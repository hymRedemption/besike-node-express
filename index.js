module.exports = myexpress;

var http = require("http");
function app(req, res){
    var i = -1;
    function next(err) {
        i++;
        if (app.stack[i] == undefined) {
            res.statusCode = 404;
            res.end();
        } else {
        //    console.log(i);
            (app.stack[i])(req, res, next);
        }
    }
    next();
}

app.stack = [];
app.use = function (middleware){
    app.stack.push(middleware);
};


app.listen = function (port, callback) {
    console.log("listen");
    var serv = http.createServer(app);
    return serv.listen(port, callback);
};

function myexpress(){
    return app;
}

