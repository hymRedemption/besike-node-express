module.exports = myexpress;

var http = require("http");
var Layer = require("./lib/layer");
var makeRoute = require("./lib/route");
var injector = require("./lib/injector");
var methods = require("methods");
var reqProto = require("./lib/request");
var resProto = require("./lib/response");

function myexpress(){

    function app(req, res, parentNext, subAppMatchPath) {
        var i = -1;
        req.app = app;
        req.res = res;
        res.req = req;

        res.redirect = function (statusCode, redirPath) {
            if (!redirPath) {
                redirPath = statusCode;
                statusCode = 302;
            }
            res.statusCode = statusCode;
            res.setHeader("Location", redirPath);
            res.setHeader("Content-length", 0);
            res.end();
        };

        function next(err) {
            i++;
            req.params = {};
            var layer = app.stack[i];

            if (layer == undefined) {
                unexpectPro(req, res, parentNext, subAppMatchPath, err);
            } else {
                var midware = layer.handle;
                var varLength = midware.length;
                var matchRes = layer.match(req.url);

                if (matchRes !== undefined) {
                    req.params = matchRes.params;
                    if (typeof midware.handle == "function") { 
                        req.url = trimPath(req.url, matchRes.path);
                        var wrapParentNext = function (error) {
                            req.app = app;
                            next(error);
                        };
                        midware(req, res, wrapParentNext, matchRes.path);
                    } else {
                        if (err) {
                            (varLength == 4) ? midware(err, req, res, next) : next(err);
                        } else {
                            (varLength == 4) ? next() : midware(req, res, next);
                        }
                    }
                } else {
                    next(err);
                }
            }
        }

        try {
            app.monkey_patch(req, res);
            next();
        } catch(ex) {
            unexpectPro(req, res, parentNext, subAppMatchPath, ex);
        }
    }

    app.stack = [];
    app.handle = function(req, res, next){};

    app.route = function (path) {
        var newRoute = makeRoute();
        var layer = new Layer(path, newRoute, {end: true});
        app.stack.push(layer);

        return newRoute;
    };

    app.use = function (pathPrefix, middleware){
        if (middleware == undefined) {
            middleware = pathPrefix;
            pathPrefix = "/";
        }
        console.log(pathPrefix);
        app.stack.push(new Layer(pathPrefix, middleware, {end: false}));
    };

    methods.forEach(function(method){
        app[method] = function (path, handler) {
            var newRoute = app.route(path);
            newRoute[method](handler);
            
            return app;
        }
    });

    app.all = function (path, handler) {
        var newRoute = app.route(path);
        newRoute.all(handler);

        return app;
    };

    app.listen = function (port, callback) {
            var serv = http.createServer(app);
            return serv.listen(port, callback);
    };

    app._factories = {};

    app.factory = function (name, fn) {
        app._factories[name] = fn;
    };

    app.inject = function (fn) {
        return injector(fn, app);
    };

    app.monkey_patch = function (req, res) {
        req.__proto__ = reqProto;
        res.__proto__ = resProto;
    }

    return app;
}

function trimPath (origUrl, superUrl) {
    var path =  origUrl.slice(superUrl.length);
    if (path === "") {
        path = "/";
    }
    return path;
}

function unexpectPro(requ, resp, parentNext, subAppMatchPath, err) {
    if (parentNext !== undefined) {
        requ.url = (requ.url === "/") ? subAppMatchPath : subAppMatchPath + requ.url;
        parentNext(err);
    } else {
        resp.statusCode = err ? 500 : 404;
        resp.end();
    }
}


