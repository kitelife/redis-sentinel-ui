/**
 * Created by xiayf on 15/12/4.
 */

var gulp = require('gulp');
var browserify = require('gulp-browserify');

function build() {
    // browserify编译
    gulp.src('./assets/main.js')
        .pipe(browserify())
        .pipe(gulp.dest('./assets/build'));
    // 复制文件

}

gulp.task('build', build);
gulp.task('default', function() {

});