/* eslint-env node, es6 */
/* eslint strict: 0, no-console: 0, complexity: [1, 5], no-use-before-define: 0 */


/* Project directory structure
 *
 * barebones
 * |- node_modules              [node]     node packages (via npm)
 * |- dev                       [project]  files, compiled for development (html, ico, png, xml, txt)
 * |  |- fonts                  [fonts]    copied (eot, otf, ttf, svg, woff, woff2)
 * |  |- images                 [images]   copied (jpg, png, svg) and sprites (png)
 * |  |- scripts                [scripts]  combined (js)
 * |  |  '- vendor              [scripts]  vendor libraries (js)
 * |  '- styles                 [styles]   prefixed (css)
 * |- dist                      [project]  compiled files, misc files (html, ico, png, xml, txt)
 * |  |- fonts                  [fonts]    compressed (eot, otf, ttf, svg, woff, woff2)
 * |  |- images                 [images]   compressed (jpg, png, svg) and sprites (png)
 * |  |- scripts                [scripts]  combined and minified (min.js)
 * |  |  '- vendor              [scripts]  vendor libraries (min.js)
 * |  '- styles                 [styles]   prefixed and minifed (min.css)
 * '- src                       [project]  source files (html)
 *    |- fonts                  [fonts]    source (eot, otf, ttf, svg, woff, woff2)
 *    |- images                 [images]   source (jpg, png, svg)
 *    |- misc                   [misc]     misc files (ico, png, xml, txt)
 *    |- partials               [partials] source (html)
 *    |- scripts                [scripts]  source (js)
 *    |- sprites                [images]   sprite components (png)
 *    |- styles                 [styles]   uncompiled source (scss)
 *    '- vendor                 [vendor]   libraries (via Bower)
 *
 */


// Basic stuff we need
// ===================
var config = require('./barebones.json'),
    gulp   = require('gulp');


// Helper plugins
// ==============
var Helper = {};

Helper.removeFiles = require('del');
Helper.portFinder  = require('portfinder');
Helper.lazyPipe    = require('lazypipe');
Helper.postCss     = require('postcss');


// Gulp plugins
// ============
var Gulp = {};

Gulp.plumber      = require('gulp-plumber');
Gulp.notify       = require('gulp-notify');
Gulp.bower        = require('gulp-bower');
Gulp.connect      = require('gulp-connect');
Gulp.filter       = require('gulp-filter');
Gulp.fileInclude  = require('gulp-file-include');
Gulp.useref       = require('gulp-useref');
Gulp.sourceMaps   = require('gulp-sourcemaps');
Gulp.if           = require('gulp-if');
Gulp.uglify       = require('gulp-uglify');
Gulp.sass         = require('gulp-sass');
Gulp.rename       = require('gulp-rename');
Gulp.postCss      = require('gulp-postcss');
Gulp.sequence     = require('gulp-sequence');


// PostCSS processors
// ==================
var PostCss = {};

PostCss.autoPrefixer = require('autoprefixer');
PostCss.atImport     = require('postcss-import');
PostCss.easings      = require('postcss-easings');
PostCss.sprites      = require('postcss-sprites');
PostCss.mQPacker     = require('css-mqpacker');
PostCss.cssOptimizer = require('postcss-csso');


// Helper functions
// ================

/*
 * Start a gulp stream
 *
 * Creates a new gulp stream with plumber already embedded
 */
var gulpSource = function (globs, options) {
    var stream = gulp.src(config.path.source + '/' + globs, options);

    // Handle errors
    return stream.pipe(Gulp.plumber({
        errorHandler: handleError
    }));
};

/*
 * Start a gulp watch
 *
 * Creates a new gulp watch process
 */
var gulpWatch = function (path, callback) {
    return gulp.watch(config.path.source + '/' + path, callback);
};

/*
 * Handle error
 *
 * Outputs internal error via gulp-notify
 */
var handleError = function (errorObject) {
    Gulp.notify.onError(errorObject.toString()).apply(this, arguments);

    // Keep gulp from hanging on this task
    if (typeof this.emit === 'function') this.emit('end');
};

/*
 * Get file format glob
 *
 * Retrieves file formats from config file and formats them as glob
 */
var formatGlob = function (type, def) {
    var exts = getFormats(type);

    if (exts.length === 1) return exts[0];
    if (exts.length > 1) return '{' + exts.join(',') + '}';

    return def || '*';
};

/*
 * Get file format regex
 *
 * Retrieves file formats from config file and formats them as regex pattern
 */
var formatRegex = function (type, def) {
    var exts = getFormats(type);

    if (exts.length === 1) return regexEscape(exts[0]);
    if (exts.length > 1) return '(?:' + exts.map(regexEscape).join('|') + ')';

    return def || '[a-z0-9]{2,5}';
};

/*
 * Get file formats
 *
 * Retrieves file formats from config file
 */
var getFormats = function (type, def) {
    var _def = def || [];

    var formats = config && config.formats && config.formats[type]
                ? config.formats[type]
                : _def;

    if (typeof formats == 'string') return [formats];
    if (formats && formats.join) return formats;

    return _def;
};

/*
 * Escape for regex
 *
 * Escapes a string for use within regular expression
 *
 * Based on http://stackoverflow.com/a/3561711
 */
var regexEscape = function (str) {
    return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};


// Task variables
// ==============
var buildPath = config.path.development + '/';


// Gulp tasks
// ==========

/* Bower task
 *
 * Installs all bower dependencies
 */
gulp.task('bower', function () {
    // Install bower dependencies
    return Gulp.bower();
});

/* Font task
 *
 * Copies font files over to dest dir
 */
gulp.task('font', function () {
    return gulpSource(config.path.font.src + '/**/*.' + formatGlob('font', '{eot,ttf,svg,woff}'))

        .pipe(gulp.dest(buildPath + config.path.font.dest))
        .pipe(Gulp.connect.reload());
});

/* Html task
 *
 * Copies html files over to dest dir
 */
gulp.task('html', function () {
    var scripts = Gulp.filter('**/*.' + formatGlob('script', 'js'), {
        restore: true
    });

    return gulpSource('*.' + formatGlob('document', 'html'))

        // Include partials
        .pipe(Gulp.fileInclude({
            prefix:   config.partials.prefix,
            suffix:   config.partials.suffix,
            basepath: config.path.source + '/' + config.path.html.partials + '/',
            context:  config.partials.context
        }))

        // Include all available assets
        .pipe(Gulp.useref({}, Helper.lazyPipe().pipe(Gulp.sourceMaps.init, {
            loadMaps: true
        })))

        // Concatenate and minify javascripts
        .pipe(scripts)
        .pipe(Gulp.if(process.env.NODE_ENV === 'production', Gulp.uglify(config.uglify || {})))
        .pipe(Gulp.sourceMaps.write('.'))
        .pipe(scripts.restore)

        // Restore html stream and write concatenated js file names
        .pipe(gulp.dest(buildPath))
        .pipe(Gulp.connect.reload());
});

/* Image task
 *
 * Copies compressed and optimized images over to dest dir
 */
gulp.task('image', function () {
    return gulpSource(config.path.image.src + '/**/*.' + formatGlob('image', '{jpg,png}'))

        .pipe(gulp.dest(buildPath + config.path.image.dest))
        .pipe(Gulp.connect.reload());
});

/* Script task
 *
 * Concatenates and uglifies scripts
 */
gulp.task('script', [
    'html'
]);

/* Style task
 *
 * Compiles scss files to css dest dir
 */
gulp.task('style', function () {
    var processors  = [],
        spriteRegex = new RegExp('^..\/'
            + regexEscape(config.path.sprite.src)
            + '\/[a-z0-9\-_]+\.'
            + formatRegex('sprite', 'png')
            + '$', 'gi');

    // Init processors
    processors.push(
        PostCss.atImport,
        PostCss.easings,
        PostCss.autoPrefixer({
            browsers: [config.autoprefixer.browsers || 'last 2 version']
        }),
        PostCss.sprites.default({
            stylesheetPath: buildPath + config.path.style.dest,
            spritePath: buildPath + config.path.image.dest,
            retina: false,

            // Only use images from sprites directory
            filterBy: function (image) {
                if (!spriteRegex.test(image.url)) {
                    return Promise.reject();
                }

                return Promise.resolve();
            },

            hooks: {
                onUpdateRule: function (rule, token, image) {
                    // Use built-in logic for background-image & background-position
                    PostCss.sprites.updateRule(rule, token, image);

                    // Output dimensions
                    ['width', 'height'].forEach(function (prop) {
                        rule.insertAfter(rule.last, Helper.postCss.decl({
                            prop: prop,
                            value: image.coords[prop] + 'px'
                        }));
                    });
                }
            }

        })
    );

    if (process.env.NODE_ENV === 'production') {
        processors.push(
            PostCss.mQPacker,
            PostCss.cssOptimizer(config.csso || {})
        );
    }

    return gulpSource(config.path.style.src + '/*.' + formatGlob('style', 'scss'))

        .pipe(Gulp.sourceMaps.init())

        .pipe(Gulp.sass())
        .pipe(Gulp.postCss(processors))
        .pipe(Gulp.rename({
            suffix: '.min'
        }))
        .pipe(Gulp.sourceMaps.write('.'))

        .pipe(gulp.dest(buildPath + config.path.style.dest))
        .pipe(Gulp.connect.reload());
});

/* Misc task
 *
 * Copies misc files misc dest dir
 */
gulp.task('misc', function () {
    return gulpSource(config.path.misc.src + '/*.' + formatGlob('misc', '{ico,png,xml.txt}'))

        .pipe(gulp.dest(buildPath + config.path.misc.dest));
});

/* Watch task
 *
 * Enters watch mode, automatically recompiling assets on source changes
 */
gulp.task('watch', function () {
    gulpWatch('*.' + formatGlob('document', 'html'), function () {
        gulp.start('html');
    });

    gulpWatch(config.path.html.partials + '/**/*.' + formatGlob('partial', 'partial.html'), function () {
        gulp.start('html');
    });

    gulpWatch(config.path.font.src + '/**/*.' + formatGlob('font', '{eot,ttf,svg,woff}'), function () {
        gulp.start('font');
    });

    gulpWatch(config.path.script.src + '/**/*.' + formatGlob('script', 'js'), function () {
        gulp.start('script');
    });

    gulpWatch(config.path.sprite.src + '**/*.' + formatGlob('sprite', 'png'), function () {
        gulp.start('style');
    });

    gulpWatch(config.path.style.src + '/**/*.' + formatGlob('style', 'scss'), function () {
        gulp.start('style');
    });

    gulpWatch(config.path.image.src + '/**/*.' + formatGlob('image', '{jpg,png,svg}'), function () {
        gulp.start('image');
    });

    gulpWatch(config.path.misc.src + '/**/*.' + formatGlob('misc', '{ico,png,xml,txt}'), function () {
        gulp.start('misc');
    });
});

/* Clean:font task
 *
 * Removes font dest folder
 */
gulp.task('clean:font', function () {
    return Helper.removeFiles(buildPath + config.path.font.dest);
});

/* Clean:html task
 *
 * Removes html files from dest folder
 */
gulp.task('clean:html', function () {
    return Helper.removeFiles(buildPath + '*.' + formatGlob('document', 'html'));
});

/* Clean:image task
 *
 * Removes image dest folder
 */
gulp.task('clean:image', function () {
    return Helper.removeFiles(buildPath + config.path.image.dest);
});

/* Clean:script
 *
 * Clears script dest folder, except vendor subfolder
 */
gulp.task('clean:script', function () {
    return Helper.removeFiles(buildPath + config.path.script.dest);
});

/* Clean:style task
 *
 * Removes style dest folder
 */
gulp.task('clean:style', function () {
    return Helper.removeFiles(buildPath + config.path.style.dest);
});

/* Clean:misc task
 *
 * Removes misc files from dest folder
 */
gulp.task('clean:misc', function () {
    return Helper.removeFiles(buildPath + config.path.misc.dest + '*.' + formatGlob('misc', '{ico,png,xml.txt}'));
});

/* Clean task
 *
 * Removes html dest folder
 */
gulp.task('clean', [
    'clean:font',
    'clean:html',
    'clean:image',
    'clean:script',
    'clean:style',
    'clean:misc'
]);

/*
 * Build dev task
 *
 * Compiles a development version. Development version doesn't get js/css minification
 */
gulp.task('build:dev', function (cb) {
    process.env.NODE_ENV = 'development';
    buildPath = config.path.development + '/';

    Gulp.sequence('clean', ['font', 'html', 'image', 'misc', 'style'], cb);
});

/*
 * Build task
 *
 * Compiles a production version. Production version has all js/css files minified
 */
gulp.task('build', function (cb) {
    process.env.NODE_ENV = 'production';
    buildPath = config.path.production + '/';

    Gulp.sequence('clean', ['font', 'html', 'image', 'misc', 'style'], cb);
});

/* Default task
 *
 * Compiles all files. Uglify depends on flag (production or development)
 */
gulp.task('default', [
    'build:dev'
]);

/* Init task
 *
 * Loads and installs required vendor libraries via bower
 */
gulp.task('init', [
    'bower'
]);

/* Connect task
 *
 * Creates a web server with an index of all html files within html dest dir
 */
gulp.task('connect', function () {
    Helper.portFinder.basePort = config.server.port;

    Helper.portFinder.getPort(function (err, port) {
        Gulp.connect.server({
            root: buildPath,
            livereload: false,
            port: port
        });
    });
});

/**
 * Connect task with livereload
 *
 * Creates a web server with an index of all html files within html dest dir
 * and automatic page reloading support
 */
gulp.task('connect:live', function () {
    Helper.portFinder.basePort = config.server.port;

    Helper.portFinder.getPort(function (err, port) {
        Gulp.connect.server({
            root: buildPath,
            livereload: true,
            port: port
        });
    });
});

/* Server task
 *
 * Creates a web server and starts watching for any changes within src dir
 */
gulp.task('server', [
    'connect',
    'watch'
]);

/* Server task with livereload
 *
 * Creates a web server and starts watching for any changes within src dir
 * and automatically reloading any opened pages on recompile
 */
gulp.task('server:live', [
    'connect:live',
    'watch'
]);
