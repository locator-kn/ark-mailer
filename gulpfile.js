var gulp = require('gulp'),
    ts = require('gulp-typescript'),
    merge = require('merge2'),
    notifier = require('node-notifier'),
    sourcemaps = require('gulp-sourcemaps'),
    typescript15 = require('typescript'),
    jade = require('gulp-jade');

var tsProjectEmily = ts.createProject({
    declarationFiles: true,
    noExternalResolve: false,
    module: 'commonjs',
    target: 'ES5',
    noEmitOnError: false,
    typescript: typescript15
});

gulp.task('ts', function() {
    var tsResult = gulp.src('src/**/*.ts')
        .pipe(sourcemaps.init())
        .pipe(ts(tsProjectEmily));

    tsResult._events.error[0] = function(error) {
        notifier.notify({
            'title': 'Compilation error',
            'message': error.__safety.toString(),
            sound: true
        });
    };
    return merge([
        tsResult.dts.pipe(gulp.dest('lib/definitions')),
        tsResult.js.pipe(gulp.dest('lib/js'))
    ]);
});

gulp.task('jade', function() {
    return gulp.src('src/**/*.jade')
        .pipe(gulp.dest('lib/js'))
});

gulp.task('default', ['ts'], function() {

});