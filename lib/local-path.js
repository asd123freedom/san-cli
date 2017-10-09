/**
 * @file 有关项目路径的一些函数
 * @author jady
 */

let path = require('path');

module.exports = {
    isLocalPath: function (templatePath) {
        return /^[./]|(^[a-zA-Z]:)/.test(templatePath);
    },

    getTemplatePath: function (templatePath) {
        return path.isAbsolute(templatePath)
            ? templatePath
            : path.normalize(path.join(process.cwd(), templatePath));
    }
};
