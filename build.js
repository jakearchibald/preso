const pathUtils = require('path');
const fs = require('fs');

const del = require('del');
const chokidar = require('chokidar');
const rollup = require('rollup');
const sass = require('rollup-plugin-sass');
const babel = require('rollup-plugin-babel');
const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const promisify = require('util').promisify;
const mkdirp = promisify(require('mkdirp'));

const argv = require('minimist')(process.argv.slice(2), {
  boolean: ['watch']
});

const rollupPlugins = [
  sass({options: {outputStyle: 'compressed'}}),
  babel({
    exclude: 'node_modules/**',
    plugins: [
      ["transform-react-jsx"]
    ]
  }),
  resolve({ jsnext: true, main: true }),
  commonjs()
];

// Dist
(async function() {
  const dependencyMap = new Map();
  const src = 'src/**/*.{js,scss}';
  await del('dist');

  chokidar.watch('src/**/*.{js,scss}', {
    persistent: argv.watch
  }).on('add', watch).on('change', watch);

  async function watch(path) {
    const paths = new Set([path]);

    for (const [module, dependencies] of dependencyMap) {
      if (dependencies.includes(path)) {
        paths.add(module);
      }
    }

    [...paths].filter(p => p.endsWith('.js')).forEach(async path => {
      const dest = path.replace(/^src\//, 'dist/');

      const bundle = await rollup.rollup({
        entry: path,
        external: id => (id.startsWith('.') || id.startsWith('/')) && !id.endsWith('.scss'),
        plugins: rollupPlugins
      });

      const mainModule = pathUtils.relative(__dirname, bundle.modules.slice(-1)[0].id);
      const subModules = bundle.modules.slice(0, -1).map(module => pathUtils.relative(__dirname, module.id));
      dependencyMap.set(mainModule, subModules);

      bundle.write({
        format: 'es',
        dest
      });
    });
  }
})();

// Docs
(async function() {
  await del('docs');

  const watcher = chokidar.watch('doc-src/script.js', {
    persistent: argv.watch
  }).on('add', script).on('change', script);

  chokidar.watch('doc-src/index.html', {
    persistent: argv.watch
  }).on('add', copy).on('change', copy);

  let cache;

  async function script(path) {
    const bundle = await rollup.rollup({
      entry: 'doc-src/script.js',
      cache,
      plugins: rollupPlugins
    });

    cache = bundle;

    const subModules = bundle.modules.slice(0, -1).map(module => pathUtils.relative(__dirname, module.id));
    watcher.add(subModules);

    bundle.write({
      format: 'iife',
      dest: 'docs/script.js'
    });
  }

  async function copy(path) {
    const dest = path.replace(/^doc-src\//, 'docs/');
    const fullDest = `${__dirname}/${dest}`;
    const readable = fs.createReadStream(`${__dirname}/${path}`);
    await mkdirp(pathUtils.dirname(fullDest));
    const writable = fs.createWriteStream(dest);
    readable.pipe(writable);
  }
})();