module.exports = myexpress;

var http = require("http");

function myexpress(){

    function app(req, res, parientNext){
        var i = -1;

        function next(err) {
            i++;
            var midware = app.stack[i];

            if (midware == undefined) {
                if (parientNext !== undefined) {
                    parientNext(err);
                } else {
                    res.statusCode = err ? 500 : 404;
                    res.end();
                }
            } else {
                var varLength = app.stack[i].length;

                if (midware.constructor == myexpress) { 
                    midware(req, res, next);
                } else {
                    if (err) {
                        (varLength == 4) ? midware(err, req, res, next) : next(err);
                    } else {
                        (varLength == 4) ? next() : midware(req, res, next);
                    }
                }
            }
        }

        try {
            next();
        } catch(ex) {
            if (parientNext !== undefined){
                parientNext(ex);
            } else {
                res.statusCode = 500;
                res.end();
            }
        }
    }

    app.stack = [];
    app.constructor = myexpress;
    app.use = function (middleware){
        app.stack.push(middleware);
    };


    app.listen = function (port, callback) {
        console.log("listen");
        var serv = http.createServer(app);
        return serv.listen(port, callback);
    };

    return app;
}

