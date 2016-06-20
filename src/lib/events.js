var EventEmitter = (function() {

    function EventEmitter(allowEvents) {
        if (allowEvents && allowEvents.length) {
            this._EE_allowEvents = {};
            for (var i = 0; i < allowEvents.length; ++i) {
                this._EE_allowEvents[allowEvents[i]] = true; 
            }
        }
        if (this._selfHandlers && (typeof this._selfHandlers === 'object')) {
            this.on('_selfHandlers', this);
        }
    }
    
    function emptyFunc() { }
    function setValueFunc(s, value) {
        this.emitResult = value;
    }

    EventEmitter.prototype = {
        constructor: EventEmitter, 

        emit: function(topic, data, callback, ctx, syncOnly) {
            if (!topic) {
                return;
            }
            if (callback === true) {
                ctx = {};
                this.emit(topic, data, setValueFunc, ctx, true);
                return ctx.emitResult;
            }
            if (ctx === true) {
                syncOnly = ctx;
                ctx = null;
            }
            callback = (typeof callback == 'function') ? callback : null;
            if (!topic || !testEvent(this, topic)) {
                if (callback) {
                    callback.call(ctx, false);
                }
                return false;
            }
            var observers = this._EE_eventObservers && this._EE_eventObservers[topic];
            if (!observers) {
                if (callback) {
                    callback.call(ctx, false);
                }
                return false;
            }
            
            var response = emptyFunc;
            if (callback) {
                response = function(respData) {
                    if (callback) {
                        response = emptyFunc;
                        callback.call(ctx, true, respData);
                        callback = ctx = null;
                    }
                };
            }
            var asyncResponse = false;
            //try {
                for (var i = 0; i < observers.length; ++i) {
                    asyncResponse = (observers[i].callback.call(observers[i].ctx || this, data, this, response, topic) === true) || asyncResponse;
                }
            //} catch(exc) {}
            
            asyncResponse = asyncResponse && !syncOnly;
            if (!asyncResponse && callback) {
                callback.call(ctx, false);
                callback = ctx = null;
            }
            return asyncResponse && !!callback;
        },
        
        on: function(topic, callback, ctx) {
            if (!topic) {
                return this;
            }
            this._EE_eventObservers = this._EE_eventObservers || {};
            if (handleObject(this, 'on', topic, callback)) {
                return this;
            }
            if (callback && testEvent(this, topic)) {
                var observers = (this._EE_eventObservers[topic] = this._EE_eventObservers[topic] || []);
                observers.push({
                    callback: callback,
                    ctx: ctx || null
                });
            }
            return this;
        },

        un: function(topic, callback, ctx) {
            if (!topic || !this._EE_eventObservers) {
                if (this._EE_eventObservers) {
                    this._EE_eventObservers = null;
                }
                return this;
            }
            
            if (handleObject(this, 'un', topic, callback)) {
                return this;
            }
            if (!callback) {
                delete this._EE_eventObservers[topic];
            } else {
                var observers = this._EE_eventObservers[topic];

                if (observers) {
                    ctx = ctx || null;

                    this._EE_eventObservers[topic] = observers.filter(function(observer) {
                        return !(observer.callback === callback && ctx == observer.ctx);
                    });
                }
            }
            return this;
        }
    };
    
    EventEmitter.mixin = function(target, allowEvents) {
        if (!target || typeof target.emit === 'function') {
            return target;
        }
        target.emit = EventEmitter.prototype.emit;
        target.on = EventEmitter.prototype.on;
        target.un = EventEmitter.prototype.un;
        EventEmitter.call(target, allowEvents);
        return target;
    };
    
    //---utils---------------------------
    function testEvent(emitter, event) {
        return !emitter._EE_allowEvents || (emitter._EE_allowEvents[event] === true);
    }

    function handleObject(emitter, func, topic, ctx) {
        var handlers = null;
        if ((typeof topic == 'string') && ctx && (typeof ctx == 'object')) {
            handlers = ctx[topic];
        } else {
            if (typeof topic == 'object') {
                handlers = topic;
            }
        }
        if (handlers && (typeof handlers == 'object')) {
            for (var i in handlers) {
                if (handlers.hasOwnProperty(i) && (typeof handlers[i] == 'function')) {
                    emitter[func](i, handlers[i], ctx);
                }
            }
            return true;
        }
        return false;
    }

    return EventEmitter;
})();