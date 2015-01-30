module.exports = makeRoute;

var methods = require("methods");

function makeRoute() {
    var result = function(req, res, parentNext) {
        var handlerPos = -1;

        function next (variable) {
            var stackMember = result.stack[++handlerPos];
            if (stackMember === undefined) {
                parentNext();
            } else {
                if (variable !== undefined) {
                    (typeof(variable) === "string") ? parentNext() : parentNext(variable);
                } else {
                    var verb = stackMember.verb.toUpperCase();
                    var handler = stackMember.handler;
                    (verb === "ALL" || verb === req.method) ? handler(req, res, next) : next();
                }
            }
        }

        next();
    };

    result.stack = [
        // {verb , handler}
        ];

    result.use = function (verb, handler) {
        result.stack.push({"verb" : verb, "handler" : handler});
    };

    result.all = function (handler) {
        result.stack.push({"verb" : "all", "handler" : handler});
        return result;
    };
    
    methods.forEach(function (method) {
        result[method] = function (handler) {
            result.stack.push({"verb" : method, "handler" : handler});
            return result;
        };
    });

    return result;
}


