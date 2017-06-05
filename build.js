const pathUtils = require('path');

const del = require('del');
const chokidar = require('chokidar');
const rollup = require('rollup');
const sass = require('rollup-plugin-sass');
const babel = require('rollup-plugin-babel');
const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');

const argv = require('minimist')(process.argv.slice(2), {
  boolean: ['watch']
});

const src = 'src/**/*.{js,scss}';

const dependencyMap = new Map();

(async function() {
  await del('dist');

  const watcher = chokidar.watch('src/**/*.{js,scss}', {
    persistent: argv.watch
  }).on('add', watch).on('change', watch);

  async function watch(path) {
    const paths = new Set([path]);

    for (const [module, dependencies] of dependencyMap) {
      debugger;
      if (dependencies.includes(path)) {
        paths.add(module);
      }
    }

    [...paths].filter(p => p.endsWith('.js')).forEach(async path => {
      const dest = path.replace(/^src\//, 'dist/');

      const bundle = await rollup.rollup({
        entry: path,
        external: id => (id.startsWith('.') || id.startsWith('/')) && !id.endsWith('.scss'),
        plugins: [
          sass({options: {outputStyle: 'compressed'}}),
          babel({
            exclude: 'node_modules/**',
            plugins: [
              ["transform-react-jsx"]
            ]
          }),
          resolve({ jsnext: true, main: true }),
          commonjs()
        ]
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