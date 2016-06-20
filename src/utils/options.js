var JSCPOptions = utils.createClass(EventEmitter, {
    constructor: function(allowClear, config) {
        EventEmitter.call(this);
        this._data = {};
        this._allowClear = (allowClear !== false);
        this._readOnly = false;
        
        if (config && (typeof config === 'object')) {
            this._config = config;
            for (var i in config) {
                if (config.hasOwnProperty(i) && config[i] && config[i].hasOwnProperty('defValue')) {
                    this._data[i] = config[i].defValue;
                }
            }
        }
    },
    
    destroy: function() {
        this.un();
        this._data = null;
        this._config = null;
    },
    
    getData: function(noCopy) {
        return noCopy ? this._data : utils.copy(this._data);
    },
    
    enumValues: function(callback, ctx) {
        this._readOnly = true;
        for (var i in this._data) {
            if (this._data.hasOwnProperty(i)) {
                callback.call(ctx, i, this._data[i]);
            }
        }
        this._readOnly = false;
    },
    
    keys: function() {
        return Object.keys(this._data);
    },
    
    get: function(name) {
        return this._data[name];
    },
    
    set: function(name, value) {
        if (!this._readOnly && name) {
            var type = typeof name;
            if (type === 'string') {
                var oldValue = this._data[name];
                value = this._translateValue(name, value);
                if (oldValue !== value) {
                    if (this._testValue(name, value)) {
                        this._data[name] = value;
                        this.emit('set', {name: name, oldValue: oldValue, value: value});
                    } else {
                        this.emit('reject', {name: name, oldValue: oldValue, value: value});
                    }
                }
            } else {
                if (type === 'object') {
                    for (var i in name) {
                        if (name.hasOwnProperty(i)) {
                            this.set(i, name[i]);
                        }
                    }
                }
            }
        }
        return this;
    },
    
    _translateValue: function(name, value) {
        var c = this._config;
        return (c && c.hasOwnProperty(name) && c[name] && c[name].translate) ?
                            c[name].translate(value) : value;
    },
    
    _testValue: function(name, value) {
        if (!this._allowClear && (value == null)) {
            return false;
        }
        if (this._config) {
            if (!this._config.hasOwnProperty(name)) {
                return false;
            }
            var conf = this._config[name];
            if (conf && conf.check) {
                if (typeof conf.check === 'function') {
                    return conf.check(value);
                }
                if (typeof conf.check === 'string') {
                    return (typeof value === conf.check);
                }
                if (conf.check.test) {
                    return conf.check.test(value);
                }
                return (conf.check.indexOf(value) >= 0);
            }
        }
        return true;
    },
    
    clear: function(name) {
        if (this._readOnly || !this._allowClear) {
            return this;
        }
        if (!name) {
            var keys = this.keys();
            for (var i = 0; i < keys.length; ++i) {
                this.clear(keys[i]);
            }
        } else {
            if ((typeof name === 'string') && this._data.hasOwnProperty(name)) {
                var oldValue = this._data[name];
                delete this._data[name];
                this.emit('clear', {name: name, oldValue: oldValue});
            }
        }
        return this;
    }
});