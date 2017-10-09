/**
 * @file 根据配置文件生成项目文件
 * @author jady
 */

/* eslint-disable fecs-no-require */
let chalk = require('chalk');
let metalSmith = require('metalsmith');
let Handlebars = require('handlebars');
let async = require('async');
let render = require('consolidate').handlebars.render;
let path = require('path');
let multimatch = require('multimatch');
let getOptions = require('./options');
let ask = require('./ask');
let filter = require('./filter');
let logger = require('./logger');

// register handlebars helper
Handlebars.registerHelper('if_eq', function (a, b, opts) {
    return a === b
        ? opts.fn(this)
        : opts.inverse(this);
});

Handlebars.registerHelper('unless_eq', function (a, b, opts) {
    return a === b
        ? opts.inverse(this)
        : opts.fn(this);
});

/**
 * Generate a template given a `src` and `dest`.
 *
 * @param {String} name
 * @param {String} src
 * @param {String} dest
 * @param {Function} done
 */

module.exports = function generate(name, src, dest, done) {
    let opts = getOptions(name, src);
    // console.log(opts);
    let metalsmith = metalSmith(path.join(src, ''));
    let data = Object.assign(metalsmith.metadata(), {
        destDirName: name,
        inPlace: dest === process.cwd(),
        noEscape: true
    });
    opts.helpers && Object.keys(opts.helpers).map(function (key) {
        Handlebars.registerHelper(key, opts.helpers[key]);
    });

    let helpers = {chalk, logger};
    // console.log(opts.skipInterpolation);
    if (opts.metalsmith && typeof opts.metalsmith.before === 'function') {
        opts.metalsmith.before(metalsmith, opts, helpers);
        return;
    }

    metalsmith.use(askQuestions(opts.prompts))
        .use(filterFiles(opts.filters))
        .use(renderTemplateFiles(opts.skipInterpolation));


    if (typeof opts.metalsmith === 'function') {
        opts.metalsmith(metalsmith, opts, helpers);
    }
    else if (opts.metalsmith && typeof opts.metalsmith.after === 'function') {
        opts.metalsmith.after(metalsmith, opts, helpers);
    }

    metalsmith.clean(false)
    .source('.') // start from template root instead of `./src` which is metalSmith's default for `source`
    .destination(dest)
    .build(function (err, files) {
        done(err);
        if (typeof opts.complete === 'function') {
            let helpers = {chalk, logger, files};
            opts.complete(data, helpers);
        }
        else {
            logMessage(opts.completeMessage, data);
        }
    });

    return data;
};

/**
 * Create a middleware for asking questions.
 *
 * @param {Object} prompts
 * @return {Function}
 */

function askQuestions(prompts) {
    return function (files, metalsmith, done) {
        ask(prompts, metalsmith.metadata(), done);
    };
}

/**
 * Create a middleware for filtering files.
 *
 * @param {Object} filters
 * @return {Function}
 */

function filterFiles(filters) {
    return function (files, metalsmith, done) {
        filter(files, filters, metalsmith.metadata(), done);
    };
}

/**
 * Template in place plugin.
 *
 * @param {Object} files
 * @param {metalSmith} metalsmith
 * @param {Function} done
 */

function renderTemplateFiles(skipInterpolation) {
    skipInterpolation = typeof skipInterpolation === 'string'
        ? [skipInterpolation]
        : skipInterpolation;
    return function (files, metalsmith, done) {
        let keys = Object.keys(files);
        let metalsmithMetadata = metalsmith.metadata();
        async.each(keys, function (file, next) {
            // skipping files with skipInterpolation option
            if (skipInterpolation && multimatch([file], skipInterpolation, {dot: true}).length) {
                return next();
            }
            let str = files[file].contents.toString();
            // do not attempt to render files that do not have mustaches
            if (!/{{([^{}]+)}}/g.test(str)) {
                return next();
            }
            console.log(file);
            render(str, metalsmithMetadata, function (err, res) {
                if (err) {
                    err.message = `[${file}] ${err.message}`;
                    return next(err);
                }
                files[file].contents = new Buffer(res);
                next();
            });
        }, done);
    };
}

/**
 * Display template complete message.
 *
 * @param {String} message
 * @param {Object} data
 */

function logMessage(message, data) {
    if (!message) {
        return;
    }
    render(message, data, function (err, res) {
        if (err) {
            console.error('\n   Error when rendering template complete message: ' + err.message.trim());
        }
        else {
            console.log('\n' + res.split(/\r?\n/g).map(function (line) {
                return '   ' + line;
            }).join('\n'));
        }
    });
}
