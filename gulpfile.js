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

// Defining the set of functions that are passed into the Jade template
let jadeUtils = {
  slugify: (str) => {
    return str.toLowerCase()
      .replace(/[^\w\d]+/g, '-');
  }, 
  
  url: (url) => {
    if (!env.urlRewrite)
      url += '.html';
    
    return env.locals.baseUrl + url; 
  }, 
  
  moment, 
  
  faces: (photos, partitions) => {
    const dir = path.join(config.paths.static, photos);
    partitions = partitions || []; 
    
    const people = fs.readdirSync(dir).map((file) => {
      // Each file name should be of the form: 
      //      00 Soh Wei Hao | Project Director.jpg 
      // where the first two digits are the optional ordering, and the 
      // rest of the filename is the name followed by the person's job, 
      // delimited by the pipe character, since that is not a character that 
      // occurs frequently in names or job titles. 
      const photo = file.split('.')[0]; 
      const name = photo.split(/\s*\|\s*/, 1)[0].trim();
      
      return {
        name: name.replace(/\d+\s*/, ''),
        file: env.locals.baseUrl + photos + '/' + file, 
        job: _.trim(photo.substring(name.length), ' |'), 
      };
    });
    
    let groups = [people]; 
    
    partitions.forEach((search, i) => {
      let splitted = _.partition(groups[i], (person) => {
        return person.job.includes(search); 
      }); 
      
      groups[i] = splitted[0];
      groups[i+1] = splitted[1];
    });
    
    groups = groups.map((group) => {
      return _.chain(group)
        .groupBy('job')
        .sortBy('length')
        .flatten()
        .value(); 
    }); 
    
    return partitions.length ? groups : groups[0]; 
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
