var gulp = require("gulp"),
	plumber = require("gulp-plumber"),
	browserSync = require("browser-sync");
	browserify = require('gulp-browserify'),
	rename = require("gulp-rename");

gulp.task("server", function() {
	browserSync({
		port: 9000,
		server: {
			baseDir: "app"
		}
	});
});

gulp.task("watch1", function(){
	gulp.watch([
		"app/**/*.html",
		"app/**/*.js",
		"app/**/*.css"
	]).on("change", browserSync.reload);
});

gulp.task('scripts', function() {
	gulp.src('app/js/main.js')
		.pipe(browserify({
			debug : true
		}))
		.pipe(rename('bundle.js'))
		.pipe(gulp.dest('./app/'))
});

gulp.task('watch2', function(){
	gulp.watch([
		"app/**/*.js",
		], ["scripts"]);
});

gulp.task("default", ["server", "scripts", "watch1", "watch2"]);

