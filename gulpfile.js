/**
 * Created by xiayf on 15/12/4.
 */

'use strict';

const gulp = require('gulp');
const browserify = require('gulp-browserify');
const sourcemaps = require('gulp-sourcemaps');
const babel = require('gulp-babel');
const concat = require('gulp-concat');

gulp.task('babel', () => {
    gulp.src(['controllers/**/*.js', 'models/**/*.js'])
        .pipe(sourcemaps.init())
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(concat('all.js'))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('dist'));
});

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
        .pipe(gulp.dest('./public/vendors/bootstrap'));
});

gulp.task('default', ['browserify', 'clone']);
