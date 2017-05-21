const gulp = require('gulp');
const babel = require('gulp-babel');
const del = require('del');

const paths = {
  scripts: {
    src: 'src/**/*.js',
    dest: 'dist/'
  }
};

function clean() {
  return del(['dist']);
}

function scripts() {
  return gulp.src(paths.scripts.src, {
      sourcemaps: true,
      since: gulp.lastRun(scripts)
    })
    .pipe(babel({
      "plugins": [
        ["transform-react-jsx"]
      ]
    }))
    .pipe(gulp.dest(paths.scripts.dest));
}

function watch() {
  gulp.watch(paths.scripts.src, scripts);
}

exports.build = gulp.series(clean, scripts);
exports.dev = gulp.series(exports.build, watch);