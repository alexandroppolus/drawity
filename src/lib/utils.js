var utils = (function() {

    var MAX_SIZE = {
        width: Infinity,
        height: Infinity
    };
    var MIN_SIZE = {
        width: 0,
        height: 0
    };
    
    var utils = {
        // src
        // dest, src1, src2,...
        copy: function() {
            var a = arguments;
            if (!a.length || ((a.length == 1) && !a[0])) {
                return null;
            }
            var dest = a.length > 1 ? a[0] || {} : {};
            for (var i = a.length > 1 ? 1 : 0; i < a.length; ++i) {
                if (a[i]) {
                    src = a[i];
                    for (var j in src) {
                        if (src.hasOwnProperty(j)) {
                            dest[j] = src[j];
                        }
                    }
                }
            }
            return dest;
        },
        
        createClass: function(baseClass, fields, statics) {
            if (typeof baseClass !== 'function') {
                baseClass = Object;
            }
            if (typeof fields === 'function') {
                fields = fields(baseClass.prototype, baseClass);
            }
            
            var constructor = (fields && fields.hasOwnProperty('constructor') && (typeof fields.constructor === 'function'))
                                ? fields.constructor
                                : function() {};
                                
            constructor.prototype = Object.create(baseClass.prototype);
            utils.copy(constructor.prototype, fields);
            constructor.prototype.constructor = constructor;
            return utils.copy(constructor, statics);
        },
        
        bind: function(func, ctx) {
            return function() {
                return func.apply(ctx, arguments);
            };
        },
        
        bindAll: function(methods, ctx) {
            var r = {};
            for (var i in methods) {
                if (methods.hasOwnProperty(i) && (typeof methods[i] === 'function')) {
                    r[i] = this.bind(methods[i], ctx);
                }
            }
            return r;
        },
        
        between: function(min, value, max) {
            return Math.max(min || -Infinity, Math.min(value, max || Infinity));
        },
        
        sizeBetween: function(min, value, max) {
            min = min || MIN_SIZE;
            max = max || MAX_SIZE;
            return {
                width: this.between(min.width, value.width, max.width),
                height: this.between(min.height, value.height, max.height)
            };
        },
        
        applyTemplate: function(tpl, data) {
            return tpl && tpl.replace(/\$\{([a-z0-9_]+)\}/g, function(m, g1) {
                return data[g1] || m;
            });
        },
        
        checkNumber: function(min, max, integer, num) {
            if (num == null) {
                return function(n) {
                    return (n != null) && utils.checkNumber(min, max, integer, n);
                };
            }
            return (typeof num === 'number') && (!integer || Math.round(num) === num) &&
                (min == null || min <= num) && (max == null || num <= max);
        },
        
        getOrigin: function(url) {
            var m = /^([a-z]+:\/\/)([^\/]+@)?([^\/]+)/i.exec(url);
            return m ? m[1] + m[3] : null;
        },
        
        isCrossOrigin: function(location, url) {
            if (!/^(https?|ftp):\/\//.test(url)) {
                return false;
            }
            var originLoc = this.getOrigin(location);
            var originUrl = this.getOrigin(url);
            return originLoc && originUrl && (originLoc != originUrl);
        },
        
        property: function(fieldName, setter, before) {
            return function(value, param) {
                if (value !== void(0)) {
                    var oldValue = this[fieldName];
                    if (before && (before.call(this, value, oldValue, param) === false)) {
                        return this;
                    }
                    if (value !== oldValue) {
                        this[fieldName] = value;
                        if (setter) {
                            setter.call(this, value, oldValue, param);
                        }
                    }
                    return this;
                } else {
                    return this[fieldName];
                }
            };
        },
        
        proxy: function(obj, methods) {
            var proxy = Object.create(null);
            for (var i = 0; i < methods.length; ++i) {
                addProxyMethod(obj, proxy, methods[i]);
            }
            return proxy;
        }
    };
    
    function addProxyMethod(obj, proxy, method) {
        proxy[method] = function() {
            var ret = obj[method].apply(obj, arguments);
            return (ret === obj) ? this : ret;
        };
    }
    
    return utils;
})();