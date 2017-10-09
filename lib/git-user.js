/**
 * @file 获得本地git的user相关信息
 * @author jady
 */

let exec = require('child_process').execSync;

module.exports = function () {
    var name = '';
    var email = '';

    try {
        name = exec('git config --get user.name');
        email = exec('git config --get user.email');
    }
    catch (e) {}

    name = name && JSON.stringify(name.toString().trim()).slice(1, -1);
    console.log(name);
    email = email && (' <' + email.toString().trim() + '>');
    return (name || '') + (email || '');
};
