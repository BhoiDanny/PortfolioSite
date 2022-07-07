"use strict";

const gulp = require("gulp"),
    sass = require("gulp-sass")(require("sass")),
    autoprefixer = require("gulp-autoprefixer"),
    rename = require("gulp-rename"),
    terser = require("gulp-terser"),
    del = require("del"),
    replace = require("gulp-replace"),
    imagemin = require("gulp-imagemin"),
    uglifyCss = require("gulp-uglifycss"),
    browserSync = require("browser-sync"),
    connect = require("gulp-connect-php");

let srcPath = "";
let destPath = "";

/*
* FILES PATHS
* */
let paths =  {
    dist: "dist",
    src: "src",
    assets: "assets",
    vendor: "vendor",
    styles: {
        sass: "vendor/scss/main.scss"
    },
    js: {
        modernizer: "vendor/js/modernizr-custom.js",
        plugins: "vendor/js/plugins.js"
    },
    html: "./*.html"
}

gulp.task("clean", function (){
    return del(paths.dist);
});

gulp.task("sass", function(done) {
    srcPath = paths.styles.sass;
    destPath = paths.src + "/css";
    gulp.src(srcPath, {sourcemaps: true})
        .pipe(sass({
            outputStyle: "compressed"
        }))
        .pipe(autoprefixer())
        .pipe(rename({
            basename: "style",
            suffix: ".min",
            extname: ".css"
        }))
        .pipe(gulp.dest(destPath, {sourcemaps: "./maps"}))
    gulp.src(srcPath)
        .pipe(sass({
            outputStyle: "expanded"
        }))
        .pipe(autoprefixer())
        .pipe(gulp.dest(paths.vendor + "/css"))
    done();
});

gulp.task("css", function(){
    srcPath = paths.src + "/css*/**/*";
    destPath = paths.dist + "/assets";
    return gulp.src(srcPath)
        .pipe(gulp.dest(destPath));
})

gulp.task("min:js", function(done) {
    srcPath = paths.src + "/js/*.js";
    destPath = paths.assets + "/js";
    gulp.src(srcPath, {sourcemaps: true})
        .pipe(terser({
            toplevel: true,
            mangle: true,
            compress: true,
        }))
        .pipe(rename({
            basename: "code",
            suffix: ".min",
            extname: ".js"
        }))
        .pipe(gulp.dest(destPath, {sourcemaps: "./maps"}))
    done();
});

gulp.task("min:vendor:js", function(done) {
    srcPath = [paths.js.modernizer, paths.js.plugins];
    destPath = paths.assets + "/js";
    gulp.src(srcPath, {sourcemaps: true})
        .pipe(terser({
            toplevel: true,
            mangle: true,
            compress: true,
        }))
        .pipe(gulp.dest(destPath, {sourcemaps: "./maps"}))
    done();
});

gulp.task("min:images", function(done) {
    srcPath = paths.src + "/img/**/*";
    destPath = paths.assets + "/img";
    gulp.src(srcPath)
        .pipe(imagemin({
            verbose: false,
        }))
        .pipe(gulp.dest(destPath))
    done();
});

gulp.task("html", function (done) {
    srcPath = ["./*.png", "./*.ico"];
    gulp.src(srcPath, {allowEmpty: true})
        .pipe(gulp.dest(paths.dist))
    gulp.src(paths.html)
        .pipe(replace("\"src/js/main.js", "\"assets/js/code.min.js"))
        .pipe(replace("\"src/", "\"assets/"))
        .pipe(replace("\"vendor/css/main.css", "\"assets/css/style.min.css"))
        .pipe(replace("\"vendor/", "\"assets/"))
        .pipe(gulp.dest(paths.dist))
    done();
});

gulp.task("php", function(done){
    srcPath = paths.vendor + "/php/*.php";
    gulp.src(srcPath,{ allowEmpty: true })
        .pipe(gulp.dest(paths.dist));
    done();
});

gulp.task("run", gulp.series(
    "sass",
    "min:js",
    "min:vendor:js",
    "min:images",
));

gulp.task("default", gulp.series("run", "html", "php"));

gulp.task("dist", gulp.series(
    "clean",
    "run",
    "css",
    "html",
    "php",
    function(done){
        gulp.src(`*${paths.assets}/**/*`)//Copy remaining assets
            .pipe(gulp.dest(paths.dist));
        done();
    }
))

gulp.task("watch", gulp.series("dist", function(){
    connect.server({
        base : paths.dist,
        hostname: "127.0.0.1",
        port: 3030,
        stdio: "ignore",
        keepalive: true,
        livereload: true
    }, function () {
        browserSync({
            baseDir: paths.dist,
            proxy: "127.0.0.1:3030",
            port: 3031,
            ui: {
                port: 3032
            },
            open: true,
            logPrefix: "Portfolio",
            notify: true,
            livereload: true
        })
    })

    gulp.watch(`${paths.src}/img/**/*`, gulp.series("min:images"));
    gulp.watch(`${paths.src}/js/**/*`, gulp.series("min:js"));
    gulp.watch(`${paths.vendor}/scss/**/*`).on("change",gulp.series("sass" , function (done) {
        gulp.src(paths.styles.sass, {sourcemaps: true})
            .pipe(sass({
                outputStyle: "compressed"
            }))
            .pipe(autoprefixer())
            .pipe(rename({
                basename: "style",
                suffix: ".min",
                extname: ".css"
            }))
            .pipe(gulp.dest(`${paths.dist}/assets/css`, {sourcemaps: "./maps"}))
        done();
        browserSync.reload();
    }));
    gulp.watch(`${paths.vendor}/php/**/*`).on("change", gulp.series("php", function(){
        browserSync.reload();
    }));
    gulp.watch(paths.html).on("change", gulp.series("html", function(){
        browserSync.reload();
    }));
    gulp.watch(`${paths.assets}/img/**/*`).on("change", gulp.series(function(done){
        gulp.src(`${paths.assets}/img/**/*`)
            .pipe(gulp.dest(`${paths.dist}/assets/img`));
        done();
        browserSync.reload();
    }))
}))