/**
 * @file 读取配置文件
 * @author jady
 */

let path = require('path');
let metadata = require('read-metadata');
let exists = require('fs').existsSync;
let getGitUser = require('./git-user');
let validateName = require('validate-npm-package-name');

/**
 * Read prompts metadata.
 *
 * @param {String} dir
 * @return {Object}
 */

module.exports = function options(name, dir) {
    let opts = getMetadata(dir);

    setDefault(opts, 'name', name);
    setValidateName(opts);

    let author = getGitUser();
    if (author) {
        setDefault(opts, 'author', author);
    }

    return opts;
};

/**
 * Gets the metadata from either a meta.json or meta.js file.
 *
 * @param  {String} dir
 * @return {Object}
 */

function getMetadata(dir) {
    let json = path.join(dir, 'meta.json');
    let js = path.join(dir, 'meta.js');
    let opts = {};

    if (exists(json)) {
        opts = metadata.sync(json);
    }
    else if (exists(js)) {
        let req = require(path.resolve(js));
        if (req !== Object(req)) {
            throw new Error('meta.js needs to expose an object');
        }
        opts = req;
    }

    return opts;
}

/**
 * Set the default value for a prompt question
 *
 * @param {Object} opts
 * @param {String} key
 * @param {String} val
 */

function setDefault(opts, key, val) {
    if (opts.schema) {
        opts.prompts = opts.schema;
        delete opts.schema;
    }
    let prompts = opts.prompts || (opts.prompts = {});
    if (!prompts[key] || typeof prompts[key] !== 'object') {
        prompts[key] = {
            'type': 'string',
            'default': val
        };
    }
    else {
        prompts[key].default = val;
    }
}

function setValidateName(opts) {
    let name = opts.prompts.name;
    let customValidate = name.validate;
    name.validate = function (name) {
        let its = validateName(name);
        if (!its.validForNewPackages) {
            let errors = (its.errors || []).concat(its.warnings || []);
            return 'Sorry, ' + errors.join(' and ') + '.';
        }
        if (typeof customValidate === 'function') {
            return customValidate(name);
        }
        return true;
    };
}
