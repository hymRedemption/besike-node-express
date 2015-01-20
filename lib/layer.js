module.exports = Layer;

function Layer(path, middleware) {
    this.handle = middleware;

    this.match = function (str) {
        var result;

        if (path != undefined) {
            var reqSplitResult = path.split("/");
            var strSplitResult = str.split("/");
            var sign = 0;

            if (path !== "/") {
                for (var i = 0; i < reqSplitResult.length; i++) {
                    if(reqSplitResult[i] !== strSplitResult[i]) {
                        sign = -1;
                    }
                }
            }
            if (sign != -1) {
                result = {path: path};
            }
        }

        return result;
    }
}


