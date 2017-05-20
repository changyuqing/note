window.define = (function () {
    var moduleCache = {};

    function getUrl (moduleName) {
        return String(moduleName).replace(/\.js$/g, '') + '.js';
    }

    function loadScript (src) {
        var _script = document.createElement('script');
        _script.type = 'text/javascript';
        _script.async = true;
        _script.src = src;
        document.getElementsByTagName('head')[0].appendChild(_script);
    }

    function loadModule (moduleName, callback) {
        var _module;
        if (moduleCache[moduleName]) {
            _module = moduleCache[moduleName];
            if (_module.status === 'loaded') {
                setTimeout(callback(_mudule.exports), 0);
            } else {
                _module.onload.push(callback);
            }
        } else {
            // 初次加载
            moduleCache[moduleName] = {
                moduleName: moduleName,
                status: 'loading',
                exports: null,
                onload: [callback]
            };
            loadScript(getUrl(moduleName));
        }
    }

    function setModules (moduleName, params, callback) {
        var _module,fn;
        // 如果模块被调用过
        if (moduleCache[moduleName]) {
            _module = moduleCache[moduleName];
            _module.status = 'loaded';
            // 矫正模块接口
            _module.exports = callback ? callback.apply(_module, params) : null;
            while (fn = _module.onload.shift()) {
                fn(_module.exports);
            }
        } else {
            callback && callback.apply(null, params);
        }
    }  



     function define (url, modDeps, modCallBack) {
        var args = [].slice.call(arguments),
            callback = args.pop(),
            deps = args.length && args[args.length - 1] instanceof Array ? args.pop() : [],
            url = args.length ? args.pop() : null,
            params = [],
            depsCount = 0,
            i = 0,
            len;
        if (len = deps.length) {
            while (i < len) {
                (function (i) {
                    // 增加未加载依赖模块数量统计
                    depsCount++;
                    loadModule(deps[i], function (depExport) {
                        // 模块加载完毕后的回调，传入模块的接口
                        params[i] = depExport;
                        if (--depsCount == 0) {
                            // 所有模块都加载完，并且接口都保存在params
                            setModules(url, params, callback);
                        }
                    });
                })(i)
                i++;
            }
        } else {
            setModules(url, [], callback);
        }
    }

    return define;

})();