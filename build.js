const util = require('util');

const del = require('del');
const glob = util.promisify(require('glob'));
const rollup = require('rollup');
const sass = require('rollup-plugin-sass');
const babel = require('rollup-plugin-babel');
const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');

(async function() {
  await del('dist');

  const matches = await glob('src/**/*.js');

  await Promise.all(matches.map(async path => {
    const dest = path.replace(/^src\//, 'dist/');

    const bundle = await rollup.rollup({
      entry: path,
      external: id => (id.startsWith('.') || id.startsWith('/')) && !id.endsWith('.scss'),
      plugins: [
        sass(),
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

    await bundle.write({
      format: 'es',
      dest
    });
  }));

})().catch(err => {
  console.error(err.stack);
  process.exit(1);
});