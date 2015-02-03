module.exports = createInjector

function createInjector(handler, app) {
    var injectHandler = function(req, res, next) {
        var self = this;
        console.log(req._cache);
        if (req._cache) {
            console.log("no cache");
            req._cache = {};
        }
        console.log(typeof req._cache);
        if (req._cache[handler]) {
            handler.apply(self, req._cache[handler]);
        } else {
            var load = injectHandler.dependencies_loader(req, res, next);
            load(function(err, values){
                if (err) {
                    next(err);
                } else {
                    handler.apply(self, values);
                }
            });
        }
    };


    injectHandler.dependencies_loader = function(req, res, next) {
        return function (fn) {
            var factoryNum = -1; 
            var values = [];
            var propNames = injectHandler.extract_params(); 

            var innerNext = function(error, value) {
                if (!error) {
                    factoryNum++;

                    if (value !== undefined) {
                        console.log(value);
                        values.push(value);
                    }
                    if (propNames[factoryNum] !== undefined) {
                        var name = propNames[factoryNum];
                        var factoryFn = app._factories[name];
                        if (factoryFn !== undefined) {
                            factoryFn(req, res, innerNext);
                        } else {
                            switch(name) {
                                case "req":
                                    values.push(req);
                                    innerNext();
                                    break;
                                case "res":
                                    values.push(res);
                                    innerNext();
                                    break;
                                case "next":
                                    values.push(next);
                                    innerNext();
                                    break;
                                default:
                                    throw new Error("Factory not defined: " + name);
                            }
                        }
                    }
                } else {
                    throw error;
                }
            };
            try {
                innerNext();//get values
                req._cache[handler] = values;
                fn(null, values);
            } catch(err) {
                fn(err, null);
            }

        };
    };
    injectHandler.dependencies_loader.cache = {};

    injectHandler.extract_params = function() {
        var fnText = handler.toString();
        if (injectHandler.extract_params.cache[fnText]) {
            return injectHandler.extract_params.cache[fnText];
        }
        var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m,
            FN_ARG_SPLIT = /,/,
            FN_ARG = /^\s*(_?)(\S+?)\1\s*$/,
            STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
        var inject = [];
        var argDecl = fnText.replace(STRIP_COMMENTS, '').match(FN_ARGS);
        argDecl[1].split(FN_ARG_SPLIT).forEach(function(arg) {
            arg.replace(FN_ARG, function(all, underscore, name) {
                inject.push(name);
            });
        });
        injectHandler.extract_params.cache[handler] = inject;
        return inject;
    };

    injectHandler.extract_params.cache = {};


    return injectHandler;
}

