module.exports = myexpress;

var http = require("http");


function myexpress() {

    var requ, resp;
    var i = -1;

    
    var obj =function(req, res) {
            requ = req;
            resp = res;
            try {
                obj.next();
            } catch (err){
                i = -1;
                inErr = 1;
                if(obj.parient != undefined){
                    obj.parient.next(err);
                } else {
                    res.statusCode = 500;
                    res.end();
                }
            }
    };

    obj.constructor = myexpress;

    obj.stack = [];
    obj.errStack = [];

    var index = [];//to index the nearest error middleware
    var jumpStep = [];
    var lastNorMidStart = 0;
    var lastNorMidEnd = 0;
    var errMidNum = 0;
    var inErr = 1;// 判断是否是在error中间件中
    var errorNum = -1;//记录第几个error handler在运行

    obj.listen = function (port, callback) {
        var server =  http.createServer(obj);
        return server.listen(port, callback);
    };


    obj.use = function (middleware) {
        if (middleware.length == 4) {
            obj.errStack.push(middleware);
            for (; lastNorMidStart < lastNorMidEnd; lastNorMidStart++) {
                index[lastNorMidStart] = errMidNum;
                jumpStep[lastNorMidStart] = lastNorMidEnd - lastNorMidStart - 1;
            }
            errMidNum++;
        } else {
            if(middleware.constructor == myexpress){
                middleware.parient = obj;
            }
            obj.stack.push(middleware);
            lastNorMidEnd++;
        }

    };

    obj.next = function(err) {
        if (err){
            errorNum = (inErr == -1) ? index[i] : errorNum + 1;
            i = (inErr == -1) ? i + jumpStep[i] : i;
            if (obj.errStack[errorNum] == undefined) {
                if(obj.parient != undefined) {
                    obj.parient.next(err);
                } else {
                    i = -1;
                    inErr = 1;
                    resp.statusCode = 500;
                    resp.end();
                }
            } else {
                obj.errStack[errorNum](err, requ, resp, obj.next);
            }
        } else { 
            i++;
            inErr = -1;
            if (obj.stack[i] == undefined) { //no middleware anymore
                if (obj.parient != undefined){
                    obj.parient.next();
                } else {
                    i = -1;
                    inErr = 1;
                    resp.statusCode = 404;
                    resp.end();
                }
            } else if (obj.stack[i].constructor == myexpress) {
                obj.stack[i](requ,resp);
            } else {
                (obj.stack[i])(requ, resp, obj.next);
            }
        }
    };

    return obj;
}

