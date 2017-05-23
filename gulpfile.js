const gulp = require('gulp');
const babel = require('gulp-babel');
const sass = require('gulp-sass');
const del = require('del');
const concat = require('concat-stream');
const through = require('through2');
const staticModule = require('static-module');
const path = require('path');

const paths = {
  scripts: {
    src: 'src/**/*.js',
    watch: 'src/**/*.{js,scss}',
    dest: 'dist/'
  }
};

function clean() {
  return del(['dist']);
}

function scripts() {
  return gulp.src(paths.scripts.src, {
      sourcemaps: true,
      //since: gulp.lastRun(scripts)
    })
    .pipe(babel({
      "plugins": [
        ["transform-react-jsx"]
      ]
    }))
    .pipe(through.obj(function (file, enc, callback) {
      const sm = staticModule({
        'static-module': {
          inlineSass: file => {
            return gulp.src(file)
              .pipe(sass().on('error', sass.logError))
              .pipe(through.obj((file, enc, callback) => {
                callback(null, JSON.stringify(file.contents.toString(enc)));
              }));
          }
        }
      }, {
        vars: { __dirname: path.dirname(file.path) },
        parserOpts: { ecmaVersion: 8, sourceType: 'module' }
      });

      file.pipe(sm)
        .on('error', err => callback(err)).pipe(concat(data => {
          file.contents = data;
          callback(null, file);
        }));
    }))
    .pipe(gulp.dest(paths.scripts.dest));
}

function watch() {
  gulp.watch(paths.scripts.watch, scripts);
}

exports.build = gulp.series(clean, scripts);
exports.dev = gulp.series(exports.build, watch);