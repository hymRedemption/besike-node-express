module.exports = myexpress;

var http = require("http");
var Layer = require("./lib/layer");

function myexpress(){

    function app(req, res, parentNext, subAppMatchPath) {
        var i = -1;

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
                        midware(req, res, next, matchRes.path);
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
            next();
        } catch(ex) {
            unexpectPro(req, res, parentNext, subAppMatchPath, ex);
        }
    }

    app.stack = [];
    app.handle = function(req, res, next){};
    app.use = function (pathPrefix, middleware){
        if (middleware == undefined) {
            middleware = pathPrefix;
            pathPrefix = "/";
        }
        app.stack.push(new Layer(pathPrefix, middleware, {end: false}));
    };


    app.listen = function (port, callback) {
        var serv = http.createServer(app);
        return serv.listen(port, callback);
    };

    app.get = function (path, handler) {
        var layer = new Layer(path, handler, {end: true});
    };

    return app;
}

function trimPath(origUrl, superUrl) {
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

