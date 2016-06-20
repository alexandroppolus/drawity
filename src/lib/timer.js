function Timer(ms, callback, ctx, once) {
    if (typeof ms === 'function') {
        once = ctx;
        ctx = callback;
        callback = ms;
        ms = 0;
    }
    this._timer = null;
    this._once = once;
    var self = this;
    this._callback = function() {
        if (once) {
            self._timer = null;
        }
        callback.call(ctx);
    };
    this._interval = 0;
    this.setInterval(ms);
}

Timer.prototype = {
    constructor: Timer,
    
    destroy: function() {
        this.stop();
        this._callback = null;
    },
    
    setInterval: function(interval) {
        if ((typeof interval === 'number') && (interval >= 0) && (this._interval !== interval)) {
            this._interval = interval;
            var started = this._timer;
            this.stop();
            if (started) {
                this.start();
            }
        }
        return this;
    },
    
    start: function() {
        if (!this._timer && (this._interval >= 1)) {
            this._timer = this._once ?
                setTimeout(this._callback, this._interval) :
                setInterval(this._callback, this._interval);
        }
        return this;
    },
    
    started: function() {
        return !!this._timer;
    },
    
    stop: function() {
        if (this._timer) {
            if (this._once) {
                clearTimeout(this._timer);
            } else {
                clearInterval(this._timer);
            }
            this._timer = null;
        }
        return this;
    },
    
    timeout: function() {
        if (this._timer) {
            if (this._once) {
                clearTimeout(this._timer);
                this._callback();
            } else {
                this.stop();
            }
        }
        return this;
    }
};