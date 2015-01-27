module.exports = Layer;

var p2re = require('path-to-regexp');

function Layer(path, middleware, option) {
    this.handle = middleware;

    this.match = function (str) {
        var result;
        var keys = [];
        var params = {};

        if (path != undefined) {
            var re = p2re(path, keys, option);

            if (re.test(str)) {
                var m = re.exec(str);
                for(var i = 1; i < m.length; i++) {
                    var name = keys[i-1].name;
                    params[name] = m[i];
                }
                result = {
                    "path": m[0],
                    "params": params
                };
            }
        }

        return result;
    }
}


