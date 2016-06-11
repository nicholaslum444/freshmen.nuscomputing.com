"use strict";

const path = require('path');

const gulp = require('gulp');
const gulpif = require('gulp-if');
const sass = require('gulp-sass');
const jade = require('gulp-jade');
const newer = require('gulp-newer');
const sourcemaps = require('gulp-sourcemaps');

const browserSync = require('browser-sync');
const _ = require('lodash');
const moment = require('moment');
const reload = browserSync.reload;
const argv = require('yargs').argv;
const fs = require('fs');

let config = require('./config.json');
let defaults = {
  minify: false,
  sourcemaps: true,
  reload: true,
  urlRewrite: false,
};

let env = _.defaults(config.environments[config.env], defaults);


let jadeUtils = {
  slugify: (str) => {
    return str.toLowerCase()
      .replace(/[^\w\d]+/g, '-');
  }, 
  
  url: (path) => {
    if (!env.urlRewrite)
      path += '.html';
    
    return env.locals.baseUrl + path; 
  }, 
  
  moment, 
  
  faces: (path, split) => {
    const dir = config.paths.static + '/' + path;
    
    const people = fs.readdirSync(dir).map((file) => {
      const photo = file.split('.')[0]; 
      const name = photo.split(/\s*\|\s*/, 1)[0].trim();
      
      return {
        name: name.replace(/\d+\s*/, ''),
        file: env.locals.baseUrl + path + '/' + file, 
        job: _.trim(photo.substring(name.length), ' |'), 
      };
    });
    
    if (!split) {
      return people; 
    }
    
    const groups = _.groupBy(people, (person) => {
      // Returns 0 for people who are heads or directors and 1 everyone else 
      return 1 - (person.job.includes('Head') || person.job.includes('Director'));
    });

    // Bin people by their jobs, then order them by the number of people in each bin
    groups[1] = _.flatten(_.sortBy(_.groupBy(groups[1], 'job'), 'length'));

    return groups;
  },
};

function staticPaths() {
  return config.static.map((dir) => config.paths.static + dir + '/**');
}

function copyAssets(dest) {
  gulp.src(config.paths.etc + 'favicon.ico')
    .pipe(newer(dest))
    .pipe(gulp.dest(dest));
  
  return gulp.src(staticPaths(), { base: config.paths.static })
    .pipe(newer(dest))
    .pipe(gulp.dest(dest));
}

function buildSass(out, minify, reloadBS, useSourcemap) {
  const outputStyle = minify ? 'compressed' : 'nested';
  
  return gulp.src(config.paths.styles + 'app.scss')
    .pipe(gulpif(useSourcemap, sourcemaps.init()))
    .pipe(sass({ outputStyle }).on('error', sass.logError))
    .pipe(gulpif(useSourcemap, sourcemaps.write('.')))
    .pipe(gulp.dest(out + 'css'))
    .pipe(gulpif(reloadBS, reload({ stream: true, match: '**/*.css' })));
}

function buildTemplates(locals, path) {
  return gulp.src(config.paths.templates + 'pages/*.jade')
    .pipe(jade({
      locals: _.merge({}, locals, jadeUtils),
      pretty: '\t',
    }).on('error', (err) => console.log(err)))
    .pipe(gulp.dest(path));
}

gulp.task('templates', () => buildTemplates(env.locals, env.output));
gulp.task('sass', () => buildSass(env.output, env.minify, env.reload, env.sourcemaps));
gulp.task('assets', () => copyAssets(env.output));

gulp.task('templates-watch', ['templates'], reload);
gulp.task('assets-watch', ['assets'], reload);

gulp.task('serve', ['sass', 'templates'], () => {
  browserSync({
    server: {
      baseDir: env.output
    }
  });
  
  gulp.watch(staticPaths(), ['assets-watch']);
  
  gulp.watch(config.paths.styles + '**/*.scss', ['sass']);
  gulp.watch(config.paths.templates + '**/*.jade', ['templates-watch']);
});

gulp.task('build', () => {
  if (!_.has(config.environments, argv.env))
    throw new Error(`Environment '${argv.env}' not found. Please check your config.json`);
  
  env = _.defaults(config.environments[argv.env], defaults);

  copyAssets(env.output);
  buildTemplates(env.locals, env.output);
  buildSass(env.output, env.minify, env.reload, env.sourcemaps);
  
  // Copy .htaccess file if necessary 
  if (env.urlRewrite) {
    gulp.src(config.paths.etc + '.htaccess')
      .pipe(newer(env.output))
      .pipe(gulp.dest(env.output));
  }
});
