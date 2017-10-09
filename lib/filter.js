/**
 * @file 过滤文件
 * @author jady
 */

let match = require('minimatch');
let evaluate = require('./eval');

module.exports = function (files, filters, data, done) {
    if (!filters) {
        return done;
    }
    let fileNames = Object.keys(files);
    Object.keys(filters).forEach(function (glob) {
        fileNames.forEach(function (file) {
            if (match(file, glob, {dot: true})) {
                let condition = filters[glob];
                if (!evaluate(condition, data)) {
                    delete files[file];
                }
            }
        });
    });
    done();
};
