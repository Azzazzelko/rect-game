var gulp = require("gulp"),
	plumber = require("gulp-plumber"),
	browserSync = require("browser-sync"),
	browserify = require('gulp-browserify'),
	rename = require("gulp-rename");

gulp.task('scripts', function() {
	return gulp.src('app/js/main.js')
		.pipe(plumber())
		.pipe(browserify({
			debug : true
		}))
		.pipe(rename('bundle.js'))
		.pipe(gulp.dest('./app/'))
});

gulp.task("server", ["scripts"], function() {
	browserSync({
		port: 9000,
		server: {
			baseDir: "app"
		}
	});

	gulp.watch("app/**/*.js", ['js-watch']);
});

gulp.task('js-watch', ['scripts'], function (done) {
    browserSync.reload();
    done();
});

// gulp.task("watch1", ["scripts"], function(){
// 	gulp.watch([
// 		"app/**/*.html",
// 		"app/**/*.js",
// 		"app/**/*.css"
// 	]).on("change", browserSync.reload);
// });

// gulp.task('js-watch', ["scripts"], function(){
// 	gulp.watch([
// 		"app/**/*.js",
// 		], ["scripts"]);
// });

gulp.task("default", ["server", "scripts"]);

