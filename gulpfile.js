/**
 * Created by xiayf on 15/12/4.
 */

'use strict';

const gulp = require('gulp');
const browserify = require('gulp-browserify');

gulp.task('browserify', () => {
    // browserify编译
    gulp.src('./public/main.js')
        .pipe(browserify())
        .pipe(gulp.dest('./public/dist'));
});

gulp.task('clone', () => {
    gulp.src([
            './node_modules/bootstrap/dist/css/**/*.*',
            './node_modules/bootstrap/dist/fonts/**/*.*'
        ], {base: './node_modules/bootstrap/dist'})
        .pipe(gulp.dest('./public/vendor/bootstrap'));
});

gulp.task('default', ['browserify', 'clone']);
