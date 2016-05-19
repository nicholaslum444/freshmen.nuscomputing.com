# NUS Computing Freshmen Orientation Project 2016 Website 

![](https://meebleforp.com/projects/fop/img/logo.png) 

## FOP 2016 - *Virtutem Quattuor* 

Production site: http://freshmen.nuscomputing.com/  
Staging site: https://meebleforp.com/projects/fop/

This repo contains the source code to build the SoC FOP 2016 website. 
The site is largely static, written in Jade and SASS with Bootstrap, a touch of 
JavaScript with jQuery and built with Gulp. Pull requests welcome!  
 
### To build: 

Since the site is static, the HTML will have to be generated for each 
server the site will be deployed on so that the URLs are correct.  

1. Make sure you have [node][1] and npm installed 
2. Clone this repo 
3. Install dependencies - `npm install`, and [`gulp` globally][2] 
4. Copy the example config file and edit it - `cp config.json.example config.json`
5. Build with gulp - `gulp build --env [your environment]` (eg. `gulp build --env local`) 

### To develop: 

1. Follow steps 1 - 4 from above
2. Start the local dev server by running `gulp serve`. Your browser will automatically 
open up `http://localhost:3000`, where you should see the site being served locally  
3. Get cracking! Any changes made to any of the source files should 
automatically trigger browser reload courtesy of BrowserSync

If you don't see the assets, try running `gulp assets`, or failing that, manually copy 
the static contents of `assets/img`, `assets/js` and `assets/video` over to the 
build folder  

### Environment variables 

#### `locals` - object 

Variables to be passed to the templates. Required variable: 

 - `baseUrl` - string - base URL to the site, to be used for all links and local resources. 
 URL should include protocol. For local development this is set to `/`
 - `analytics` - boolean - set to `true` to include the analytics code. Only use 
 for production build   
 
#### `output` - string
 
Folder relative to the project root to write the built files to. Include the suffix `-build`
(eg. `production-build`), which will be ignored by git.  
 
#### `urlRewrite` - boolean [default: false] 

Copies a `.htaccess` file into the root folder that removes the `.html` suffix 
from all URLs. Only works with Apache. 

#### `reload` - boolean [default: true]

Reloads BrowserSync when the build is done. Used for local development builds.  

#### `minify` - boolean [default: false] 

Minifies resources (currently only CSS via SASS). Used for production builds. 

#### `sourcemaps` - boolean [default: true] 
 
Generate source maps for the CSS 

[1]: http://nodejs.org/
[2]: https://github.com/gulpjs/gulp/blob/master/docs/getting-started.md