module.exports = makeRoute;

function makeRoute(verb, handler) {
    var result = function(req, res, next) {
        console.log(req.method);
        console.log(verb);
        if (req.method === verb) {
            try {
                handler(req, res, next);
            } catch (ex) {
                next(ex);
            }
        } else {
            next();
        }
    };
    return result;
}
