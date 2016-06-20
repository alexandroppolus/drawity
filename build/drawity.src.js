
(function(root, factory) {

    if (typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define(factory);
	else if(typeof exports === 'object')
		exports["drawity"] = factory();
	else
		root["drawity"] = factory();

})(this, function() {

var DND = (function() {
    var dragInfo = null;
    var dragInfoInner = null;
    
    var eventItems = ['nodeX', 'nodeY', 'clientX', 'clientY', 'pageX', 'pageY', 'shiftKey', 'altKey', 'ctrlKey', 'metaKey'];
    function copyEventData(src, dest) {
        dest = dest || {};
        for (var i = 0; i < eventItems.length; ++i) {
            dest[eventItems[i]] = src[eventItems[i]];
        }
        dest.cmdKey = dest.ctrlKey || dest.metaKey;
        return dest;
    }
    
    function calcOffset(obj) {
        if (dragInfoInner.offsetNode) {
            var bound = dragInfoInner.offsetNode.getBoundingClientRect();
            obj.nodeX = obj.clientX - Math.round(bound.left);
            obj.nodeY = obj.clientY - Math.round(bound.top);
        }
    }
    
    function getArray(items) {
        if (!items) {
            return null;
        }
        return (items.sort && items.splice) ? items : [items];
    }
    
    function testStart(config, md) {
        var distance = config.options.distance;
        if (distance && (typeof distance == 'number') && (distance > 0)) {
            if (md) { return false; }
            if (Math.abs(dragInfo.start.pageX - dragInfo.current.pageX) +
                    Math.abs(dragInfo.start.pageY - dragInfo.current.pageY) < distance) {
                return false;
            }
        }
    
        if (config.events.dndStart) {
            return (config.events.dndStart.call(config.options.ctx || config.events, dragInfo, md) !== false);
        }
        
        return true;
    }
    
    function onMD(e) {
        if (e.which != 1) {
            return;
        }
        MU(e, true);
        if (!this._dndEnabled || !this._dndConfig) {
            return;
        }
        
        dragInfo = {
            target: e.target || e.srcElement,
            thisElement: this,
            data: {},
            start: copyEventData(e)
        };
        var config = this._dndConfig;
        
        dragInfoInner = {
            started: false,
            offsetNode: config.options.calcOffset
                ? (config.events.dndGetOffsetNode
                    ? config.events.dndGetOffsetNode.call(config.options.ctx || config.events, dragInfo)
                    : dragInfo.thisElement)
                : null
        };
        calcOffset(dragInfo.start);
        dragInfo.current = dragInfo.start;
        
        if (config.events.dndMouseDown) {
            if (config.events.dndMouseDown.call(config.options.ctx || config.events, dragInfo, e) === false) {
                dragInfo = null;
                dragInfoInner = null;
                //console.log('cancel');
                return;
            }
        }
        dragInfo.old = dragInfo.start;
        
        //e.stopPropagation();
        dragInfoInner.started = testStart(config, true);
        setDocEvents(true);
    }
    
    function onMM(e) {
        if (!dragInfo) { return; }
        if (e.which != 1) {
            MU(e, false);
            return;
        }
        var config = dragInfo.thisElement._dndConfig;
        if (dragInfoInner.started) {
            dragInfo.old = copyEventData(dragInfo.current, dragInfo.old == dragInfo.start ? null : dragInfo.old);
        }
        dragInfo.current = copyEventData(e, dragInfo.current == dragInfo.start ? null : dragInfo.current);
        calcOffset(dragInfo.current);
        
        if (!dragInfoInner.started) {
            dragInfoInner.started = testStart(config, false);
            if (!dragInfoInner.started) {
                return;
            }
        }
        if (config.events.dndMove) {
            config.events.dndMove.call(config.options.ctx || config.events, dragInfo);
        }
    }
    
    function MU(e, fromMD) {
        if (dragInfo) {
            var config = dragInfo.thisElement._dndConfig;
            setDocEvents(false);
            if (config) {
                var eventName = dragInfoInner.started ? 'dndStop' : 'dndSkip';
                if (config.events[eventName]) {
                    config.events[eventName].call(config.options.ctx || config.events, dragInfo, fromMD);
                }
                if (config.events.dndMouseUp) {
                    dragInfo.started = dragInfoInner.started;
                    config.events.dndMouseUp.call(config.options.ctx || config.events, dragInfo, fromMD);
                }
            }
            dragInfo = null;
            dragInfoInner = null;
        }
    }
    function onMU(e) {
        return MU(e, false);
    }
    
    function retFalse(e) {
        //console.log("DS!!!!!!!!! " + e.type, this);
        e.preventDefault();
        return false;
    }
    
    function setDocEvents(add) {
        var func = add ? 'addEventListener' : 'removeEventListener';
        document[func]('mousemove', onMM, false);
        document[func]('mouseup', onMU, false);
        document[func]('dragstart', retFalse, false);
    }
    
    return {
        //events { dndGetOffsetNode, dndMouseDown, dndStart, dndMove, dndMouseUp, dndStop, dndSkip }
        //options { ctx, distance, calcOffset }
        create: function(elems, events, options) {
            elems = getArray(elems);
            for(var i = 0; i < elems.length; ++i) {
                if (!elems[i]._dndConfig) {
                    elems[i].addEventListener('mousedown', onMD, false);
                    elems[i].addEventListener('dragstart', retFalse, false);
                }
                elems[i]._dndConfig = {
                    events: events || {},
                    options: options || {}
                };
                elems[i]._dndEnabled = true;
            }
        },
        destroy: function(elems) {                          
            elems = getArray(elems);                    
            for(var i = 0; i < elems.length; ++i) {
                if (elems[i]._dndConfig) {
                    elems[i]._dndConfig = null;
                    elems[i].removeEventListener('mousedown', onMD, false);
                    elems[i].removeEventListener('dragstart', retFalse, false);
                }
            }
        },
        disable: function(elems) {
            elems = getArray(elems);
            for(var i = 0; i < elems.length; ++i) {
                elems[i]._dndEnabled = false;
            }
        },
        enable: function(elems) {
            elems = getArray(elems);
            for(var i = 0; i < elems.length; ++i) {
                elems[i]._dndEnabled = true;
            }
        }
    };
})();

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
var CommandHistory = (function() {

    /* events: 
     - redoclear, 
     - clear, 
     - change (after undo/redo/run), 
     - changing (before undo/redo), 
     - running (before run), 
    */

    function CommandHistory(maxSize, eventEmitter) {
        this._maxSize = maxSize || 0;
        this._stack = [];
        this._batchCmd = null;
        this._batchDepth = 0;
        this._stackPtr = 0;
        this._eventEmitter = eventEmitter;
        this.readOnly = false;
    }

    CommandHistory.prototype = {
        constructor: CommandHistory,
        
        undoLength: function() {
            return this._stackPtr;
        },
        
        redoLength: function() {
            return this._stack.length - this._stackPtr;
        },
        
        isEmpty: function() {
            return !this._stack.length;
        },
        
        _emit: function(event, data) {
            if (this._eventEmitter) {
                this._eventEmitter.emit(event, data);
            }
        },
        
        _redoClear: function(eventChange) {
            if (this.redoLength()) {
                this._emit('redoclear');
                this._stack.length = this._stackPtr;
                if (eventChange) {
                    this._emit('change', 'redoclear');
                }
            }
        },
        
        clear: function(onlyRedo) {
            if (this._stack.length) {
                if (onlyRedo) {
                    this._redoClear(true);
                } else {
                    this._emit('clear');
                    this._stack = [];
                    this._stackPtr = 0;
                    this._batchCmd = null;
                    this._batchDepth = 0;
                    this._emit('change', 'clear');
                }
            }
            return this;
        },
        
        undo: function() {
            if (!this.undoLength() || this._readOnly()) {
                return this;
            }
            this._emit('changing', 'undo');
            this._stackPtr--;
            cmdUndo(this._stack[this._stackPtr]);
            this._emit('change', 'undo');
            return this;
        },
        
        redo: function() {
            if (!this.redoLength() || this._readOnly()) {
                return this;
            }
            this._emit('changing', 'redo');
            return this._redo('redo');
        },
        
        _redo: function(from) {
            cmdRedo(this._stack[this._stackPtr]);
            this._stackPtr++;
            this._emit('change', from);
            return this;
        },
        
        run: function(cmd, groupId) {
            if (!cmd || this.readOnly) {
                return this;
            }
            this._emit('running');
            
            if (this.redoLength()) {
                this._redoClear(false);
            }
            
            cmd.groupId = cmd.groupId || groupId;
            
            var parentCmd = this._batchCmd ||
                (!this._batchDepth && cmd.groupId && this._stackPtr &&
                    (this._stack[this._stackPtr - 1].groupId === cmd.groupId) &&
                     this._stack[this._stackPtr - 1]);
            
            if (parentCmd) {
                cmdAppend(parentCmd, cmd);
            } else {
                if ((this._maxSize > 0) && (this._stack.length == this._maxSize)) {
                    this._stack.shift();
                    this._stackPtr--;
                }
                
                this._stack.push(cmd);
                if (this._batchDepth) {
                    this._batchCmd = cmd;
                }
                this._redo('run');
            }
            return this;
        },
        
        beginBatch: function() {
            this._batchDepth++;
            return this;
        },
        
        endBatch: function(all) {
            if (this._batchDepth) {
                this._batchDepth = all ? 0 : this._batchDepth - 1;
                if (!this._batchDepth) {
                    this._batchCmd = null;
                }
            }
            return this;
        },
        
        isBatchMode: function() {
            return !!this._batchDepth;
        },
        
        _readOnly: function() {
            return this.readOnly || this._batchDepth;
        }
    };
    
    function cmdUndo(cmd) {
        if (cmd.__tail) {
            for (var i = cmd.__tail.length - 1; i >= 0; --i) {
                cmd.__tail[i].undo();
                cmd.__tail[i].done = false;
            }
        }
        cmd.undo();
        cmd.done = false;
    }
    
    function cmdRedo(cmd) {
        cmd.redo();
        cmd.done = true;
        if (cmd.__tail) {
            for (var i = 0; i < cmd.__tail.length; ++i) {
                cmd.__tail[i].redo();
                cmd.__tail[i].done = true;
            }
        }
    }
    
    function cmdAppend(parentCmd, cmd) {
        var added = false;
        var lastCmd = parentCmd.__tail ? parentCmd.__tail[parentCmd.__tail.length - 1] : parentCmd;
        
        if (lastCmd.groupId && (lastCmd.groupId === cmd.groupId) && (typeof lastCmd.appendCommand === 'function')) {
            added = lastCmd.appendCommand(cmd);
        }
        
        if (!added) {
            if (!parentCmd.__tail) {
                parentCmd.__tail = [];
            }
            parentCmd.__tail.push(cmd);
        }
        cmd.redo();
        cmd.done = true;
    }
    
    return CommandHistory;
})();

//https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob
if (!HTMLCanvasElement.prototype.toBlob) {
 Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
  value: function (callback, type, quality) {

    var binStr = atob( this.toDataURL(type, quality).split(',')[1] ),
        len = binStr.length,
        arr = new Uint8Array(len);

    for (var i=0; i<len; i++ ) {
     arr[i] = binStr.charCodeAt(i);
    }

    callback( new Blob( [arr], {type: type || 'image/png'} ) );
  }
 });
}
var Rect = (function () {

    var SIN_15 = 0.2588;
    var SIN_22_5 = 0.3827;

    function Rect() {
        if (this instanceof Rect) {
            this.set.apply(this, arguments);
        } else {
            var r = Object.create(Rect.prototype);
            r.set.apply(r, arguments);
            return r;
        }
    }
    
    Rect.prototype = {
        constructor: Rect,
        clone: function(dest, copyOriginSize) {
            if (typeof dest == 'boolean') {
                copyOriginSize = dest;
                dest = null;
            }
            if (!dest) {
                dest = new Rect(this);
            } else {
                if (dest == this) {
                    return dest;
                }
                this.set.call(dest, this);
            }
            if (copyOriginSize) {
                if (this._origWidth != null) {
                    dest._origWidth = this._origWidth;
                    dest._origHeight = this._origHeight;
                    dest._origChanged = this._origChanged;
                } else {
                    this.clearProportions.call(dest);
                }
            }
            return dest;
        },
        
        //---------- info ------------------------------
        toString: function() {
            return 'Rect(' + this.left + ', ' + this.top + ', ' + this.right + ', ' + this.bottom + ')';
        },
        
        width: function(abs) {
            return abs ? Math.abs(this.right - this.left) : this.right - this.left;
        },
        
        height: function(abs) {
            return abs ? Math.abs(this.bottom - this.top) : this.bottom - this.top;
        },
        
        size: function(abs, dest) {
            dest = dest || {};
            dest.width = this.width(abs);
            dest.height = this.height(abs);
            return dest;
        },
        
        hasPoint: function(x, y) {
            if (x && (typeof x == 'object')) {
                y = x.y || x.top;
                x = x.x || x.left;
            }
            x = x || 0;
            y = y || 0;
            return (this.left <= x) && (this.right > x) && (this.top <= y) && (this.bottom > y);
        },
        
        isIntersect: function(rect) {
            if (!rect) {
                return false;
            }
            return bufRect.set(this).clip(rect).minSize() > 0;
        },
        
        hasArea: function() {
            return Rect.hasArea(this);
        },
        
        hasSize: function() {
            return Rect.hasSize(this);
        },
        
        point: function(p) {
            p = rectUtils.getPointData(p);
            if (!p) {
                return { x: this.left, y: this.top };
            }
            return {
                x: p.left ? this.left : (p.right ? this.right : Math.round((this.left + this.right) / 2)),
                y: p.top ? this.top : (p.bottom ? this.bottom : Math.round((this.top + this.bottom) / 2))
            };
        },
        
        margin: function(parent, buf) {
            buf = buf || [0, 0, 0, 0];
            if (!parent) {
                buf[0] = buf[1] = buf[2] = buf[3] = 0;
            } else {
                buf[0] = this.top - parent.top;
                buf[1] = parent.right - this.right;
                buf[2] = parent.bottom - this.bottom;
                buf[3] = this.left - parent.left;
            };
            return buf;
        },
        
        minSize: function(abs) {
            return Math.min(this.width(abs), this.height(abs));
        },
        
        maxSize: function(abs) {
            return Math.max(this.width(abs), this.height(abs));
        },
        
        diagonal: function() {
            return Rect.diagonal(this.left, this.top, this.right, this.bottom);
        },
        
        angle: function() {
            return Rect.angle(this.left, this.top, this.right, this.bottom);
        },
        
        //------------- change -----------------------------
        zero: function() {
            this.left = this.top = this.right = this.bottom = 0;
            this.clearProportions();
            return this;
        },
        set: function() {
            var a = arguments;
            this.clearProportions();
            if ((a.length == 1) && (typeof a[0] == 'object')) {
                var src = a[0];
                if (!src) {
                    this.zero();
                } else {
                    rectUtils.copyLT(this, src, 'left', 'x');
                    rectUtils.copyLT(this, src, 'top', 'y');
                    rectUtils.copyRB(this, src, 'right', 'left', 'width');
                    rectUtils.copyRB(this, src, 'bottom', 'top', 'height');
                }
            } else {
                if (a.length == 4) {
                    this.left = a[0];
                    this.top = a[1]
                    this.right = a[2];
                    this.bottom = a[3];
                } else {
                    if ((a.length == 2) || (a.length == 3)) {
                        if ((typeof a[0] == 'object') && (typeof a[1] == 'object')) {
                            rectUtils.copyLT(this, a[0], 'left', 'x');
                            rectUtils.copyLT(this, a[0], 'top', 'y');
                            rectUtils.copyRB(this, a[1], 'right', 'left', 'width');
                            rectUtils.copyRB(this, a[1], 'bottom', 'top', 'height');
                        } else {
                            var isPoint = (a.length == 3) && a[2];
                            this.right = a[0];
                            this.bottom = a[1];
                            this.left = isPoint ? this.right : 0;
                            this.top = isPoint ? this.bottom : 0;
                        }
                    } else {
                        this.zero();
                    }
                }
            }
            return this;
        },
        moveTo: function(x, y) {
            if (x && (typeof x == 'object')) {
                y = x.y || x.top;
                x = x.x || x.left;
            }
            var dx = (typeof x == 'number') ? x - this.left : 0;
            var dy = (typeof y == 'number') ? y - this.top : 0;
            return this.move(dx, dy);
        },
        normalize: function() {
            rectUtils.swapSort(this, 'left', 'right');
            rectUtils.swapSort(this, 'top', 'bottom');
            return this;
        },
        change: function(dl, dt, dr, db) {
            this.left += dl || 0;
            this.right += dr || 0;
            this.top += dt || 0;
            this.bottom += db || 0;
            return this;
        },
       
        clearProportions: function() {
            this._origWidth = null;
            this._origHeight = null;
            this._origChanged = false;
            return this;
        },
        /*
        num
        num, num
        {width, height}
        true
        */
        saveProportions: function(w, h) {
            var tw = typeof w;
            if (w && (tw == 'object')) {
                if (w instanceof Rect) {
                    if (w._origWidth != null) {
                        this._origWidth = w._origWidth;
                        this._origHeight = w._origHeight;
                    } else {
                        this._origWidth = w.width(true);
                        this._origHeight = w.height(true);
                    }
                    this._origChanged = false;
                    return this;
                }
                h = w.height;
                w = w.width;
            } else {
                if (tw == 'number') {
                    h = (typeof h == 'number') ? h : w;
                } else {
                    if ((w === true) || (this._origWidth == null) || this._origChanged) {
                        w = this.width();
                        h = this.height();
                    } else {
                        return this;
                    }
                }
            }
            this._origWidth = Math.abs(w);
            this._origHeight = Math.abs(h);
            this._origChanged = false;
            return this;
        },
        
        /*
        options {
            x: cx,
            y: cy,
            
            point: {x, y},
            
            width: width,
            height: height,
            
            size: {width, height},
            
            deltaWidth: dx,
            deltaHeight: dy,
            
            resizeType: MIN / MAX / AVG / R8,
            minSize: {width, height} / num,
            maxSize: {width, height} / num,
            positiveOnly: bool
        }
        
        */
        resize: function(point, options) {
            var pd = rectUtils.getPointData(point);
            if (!pd || !options) {
                return this;
            }
            
            var rt = options.resizeType || 0;
            if (rt > Rect.RT_R8) {
                rt = 0;
            }
            var size = rectUtils.getSize(this, pd, options);
            var minSize = rectUtils.getMinMaxSize(options.minSize, 0);
            var maxSize = rectUtils.getMinMaxSize(options.maxSize, 10000000);
            
            if (options.positiveOnly) {
                if (pd.width && (size.width < 0)) {
                    size.width = minSize.width;
                }
                if (pd.height && (size.height < 0)) {
                    size.height = minSize.height;
                }
            }
            
            var calcWidth = Math.abs(size.width);
            var calcHeight = Math.abs(size.height);
            
            if (pd.corner && rt) {
                if (rt <= Rect.RT_MAX) {
                    var ZERO = 0.000001;
                
                    var absWidth = this._origWidth == null ? this.width(true) : this._origWidth,
                        absHeight = this._origHeight == null ? this.height(true) : this._origHeight;

                    if ((absWidth < ZERO) && (absHeight < ZERO)) {
                        absWidth = absHeight = 1;
                    }
                    
                    if (absWidth < ZERO) {
                        calcWidth = 0;
                        calcHeight = Math.max(Math.min(calcHeight, maxSize.height), minSize.height);
                    }
                    if (absHeight < ZERO) {
                        calcHeight = 0;
                        calcWidth = Math.max(Math.min(calcWidth, maxSize.width), minSize.width);
                    }
                    
                    if ((absWidth >= ZERO) && (absHeight >= ZERO)) {
                        var k = absWidth / absHeight;
                        var calcWidth1 = rectUtils.mathFunc[rt - 1](calcHeight * k, calcWidth);
                        calcHeight = rectUtils.mathFunc[rt - 1](calcWidth / k, calcHeight);
                        calcWidth = calcWidth1;
                        if (calcWidth > maxSize.width) {
                            calcWidth = maxSize.width;
                            calcHeight = calcWidth / k;
                        }
                        if (calcHeight > maxSize.height) {
                            calcHeight = maxSize.height;
                            calcWidth = calcHeight * k;
                        }
                        if (calcWidth < minSize.width) {
                            calcWidth = minSize.width;
                            calcHeight = calcWidth / k;
                        }
                        if (calcHeight < minSize.height) {
                            calcHeight = minSize.height;
                            calcWidth = calcHeight * k;
                        }
                        calcWidth = Math.round(calcWidth);
                        calcHeight = Math.round(calcHeight);
                    }
                }
                
                if (rt === Rect.RT_R8) {
                    if (calcWidth < calcHeight * SIN_22_5) {
                        calcWidth = 0;
                        calcHeight = Math.max(Math.min(calcHeight, maxSize.height), minSize.height);
                    } else {
                        if (calcHeight < calcWidth * SIN_22_5) {
                            calcHeight = 0;
                            calcWidth = Math.max(Math.min(calcWidth, maxSize.width), minSize.width);
                        } else {
                            var v = Math.round((calcHeight + calcWidth) / 2);
                            v = Math.max(Math.min(v, maxSize.width, maxSize.height), minSize.width, minSize.height);
                            calcHeight = calcWidth = v;
                        }
                    }
                }
                /*
                if (rt === Rect.RT_R12) {
                    if (calcWidth < calcHeight * SIN_15) {
                        calcWidth = 0;
                        calcHeight = Math.max(Math.min(calcHeight, maxSize.height), minSize.height);
                    } else {
                        if (2 * calcHeight < calcWidth * SIN_22_5) {
                            calcHeight = 0;
                            calcWidth = Math.max(Math.min(calcWidth, maxSize.width), minSize.width);
                        } else {
                            if (calcWidth < calcHeight) {
                            
                            }
                            var v = Math.round((calcHeight + calcWidth) / 2);
                            v = Math.max(Math.min(v, maxSize.width, maxSize.height), minSize.width, minSize.height);
                            calcHeight = calcWidth = v;
                        }
                    }
                }
                */
            } else {
                calcWidth = Math.max(Math.min(calcWidth, maxSize.width), minSize.width);
                calcHeight = Math.max(Math.min(calcHeight, maxSize.height), minSize.height);
            }
            
            size.width = size.width < 0 ? -calcWidth : calcWidth;
            size.height = size.height < 0 ? -calcHeight : calcHeight;
            
            if (this._origWidth != null) {
                this._origChanged = ((rt < Rect.RT_MIN) || (rt > Rect.RT_MAX) || !pd.corner) &&
                    ((pd.width && (size.width != this.width())) || (pd.height && (size.height != this.height())));
            }
            return this.setSize(pd, size);
        },
        
        rotate90: function(center) {
            var w = this.width(), h = this.height();
            if (w === h) {
                return this;
            }
            if (center) {
                var w2 = w / 2, h2 = h / 2;
                var cx = this.left + w2,
                    cy = this.top + h2;
                this.left = Math.round(cx - h2);
                this.top = Math.round(cy - w2);
            }
            this.right = this.left + h;
            this.bottom = this.top + w;
            if (this._origWidth != null) {
                var t = this._origWidth;
                this._origWidth = this._origHeight;
                this._origHeight = t;
            }
            return this;
        },
        
        setSize: function(point, size) {
            var pd = rectUtils.getPointData(point);
            if (pd) {
                if (pd.left)   { this.left   = this.right  - size.width; }
                if (pd.top)    { this.top    = this.bottom - size.height; }
                if (pd.right)  { this.right  = this.left   + size.width; }
                if (pd.bottom) { this.bottom = this.top    + size.height; }
            }
            return this;
        },
        
        apply: function(func) {
            this.left = func(this.left);
            this.top = func(this.top);
            this.right = func(this.right);
            this.bottom = func(this.left);
            return this;
        },
        
        move: function(dx, dy) {
            return this.change(dx, dy, dx, dy);
        },
        
        expand: function(dx, dy) {
            dx = dx || 0;
            if (typeof dy != 'number') {
                dy = dx;
            }
            if (dx || dy) {
                this.clearProportions();
            }
            return this.change(-dx, -dy, dx, dy);
        },
        
        clip: function(rect) {
            if (rect) {
                this.left = Math.min(Math.max(rect.left, this.left), rect.right);
                this.top = Math.min(Math.max(rect.top, this.top), rect.bottom);
                this.right = Math.min(Math.max(rect.left, this.right), rect.right);
                this.bottom = Math.min(Math.max(rect.top, this.bottom), rect.bottom);
                this.clearProportions();
            }
            return this;
        },
        
        union: function(rect) {
            if (rect) {
                this.left = Math.min(this.left, rect.left);
                this.top = Math.min(this.top, rect.top);
                this.right = Math.max(this.right, rect.right);
                this.bottom = Math.max(this.bottom, rect.bottom);
                this.clearProportions();
            }
            return this;
        },
        
        unionWithPoint: function(x, y, rbAsSize) {
            if (x && (typeof x === 'object')) {
                rbAsSize = y;
                y = (x.y == null) ? x.top : x.y;
                x = (x.x == null) ? x.left : x.x;
            }
            var add = rbAsSize ? 1 : 0;
            if (typeof x === 'number') {
                this.left = Math.min(this.left, x);
                this.right = Math.max(this.right, x + add);
            }
            if (typeof y === 'number') {
                this.top = Math.min(this.top, y);
                this.bottom = Math.max(this.bottom, y + add);
            }
            return this;
        },
        
        unionWithPoints: function(points, rbAsSize) {
            for (var i = 0; i < points.length; i += 2) {
                this.unionWithPoint(points[i], points[i + 1], rbAsSize);
            }
            return this;
        },
        
        fromPoints: function(points, rbAsSize) {
            return (points && points.length) ?
                    this.set(points[0], points[1], true).unionWithPoints(points, rbAsSize) :
                    this.zero();
        },
        
        into: function(rect, behavior) {
            if (rect) {
                var dx = rectUtils.intoDelta(this.left, this.right, rect.left, rect.right, behavior, /L/i, /R/i);
                var dy = rectUtils.intoDelta(this.top, this.bottom, rect.top, rect.bottom, behavior, /T/i, /B/i);
                this.move(dx, dy);
            }
            return this;
        }
    };
    
    var bufRect = new Rect();
    
    Rect.RT_MIN = 1;
    Rect.RT_AVG = 2;
    Rect.RT_MAX = 3;
    Rect.RT_R8  = 4;
    Rect.RT_R12  = 5;
    
    Rect.diagonal = function(left, top, right, bottom) {
        var w = right - left,
            h = bottom - top;
        return (w && h) ? Math.sqrt(w * w + h * h) : Math.abs(w || h);
    };
    
    Rect.angle = function(left, top, right, bottom) {
        var w = right - left, h = bottom - top;
        var pi = Math.PI;
        if (!h || !w) {
            return (w < 0) ? pi : (h < 0 ? pi * 3 / 2 : (h ? pi / 2 : 0));
        }
        var a = Math.atan(Math.abs(h / w));
        return (w > 0) ? (h > 0 ? a : 2 * pi - a) : (h > 0 ? pi - a : pi + a);
    };
    
    Rect.isIntersect = function(rect1, rect2) {
        return !!rect1 && Rect.prototype.call(rect1, rect2);
    };
    
    Rect.hasArea = function(rect) {
        return (rect.right > rect.left) && (rect.bottom > rect.top);
    };
    
    Rect.hasSize = function(rect) {
        return (rect.right > rect.left) || (rect.bottom > rect.top);
    };
    
    Rect.get = function(obj) {
        if (obj && (obj instanceof Rect)) {
            return obj;
        }
        return new Rect(obj);
    };
    
    Rect.equal = function(r1, r2) {
        if (!r1 || !r2) {
            return !r1 == !r2;
        }
        return (r1.left == r2.left) &&
                (r1.top == r2.top) &&
                (r1.right == r2.right) &&
                (r1.bottom == r2.bottom);
    };
    
    //-----utils----------------------------------------------------------------------
    var bufPD = {};
    
    var rectUtils = {
        mathFunc: [
            function(a, b) { return Math.min(a, b); },
            function(a, b) { return (a + b) / 2; },
            function(a, b) { return Math.max(a, b); }
        ],
        getMinMaxSize: function(size, defValue) {
            if (size && (typeof size == 'object')) {
                return size;
            }
            if (typeof size == 'number') {
                return { width: size, height: size };
            }
            return { width: defValue, height: defValue };
        },
        getSize: function(rect, point, options) {
            var size = null;
            if ((typeof options.width == 'number') && (typeof options.height == 'number')) {
                size = { width: options.width, height: options.height };
            } else {
                if (typeof options.size == 'number') {
                    size = { width: options.size, height: options.size };
                } else {
                    if (options.size && (typeof options.size == 'object')) {
                        size = { width: options.size.width, height: options.size.height };
                    }
                }
            }
            if (size) {
                size.width = point.width ? size.width : rect.width();
                size.height = point.height ? size.height : rect.height();
                return size;
            }
            var pos = null;
            if ((typeof options.x == 'number') && (typeof options.y == 'number')) {
                pos = options;
            } else {
                if (options.point && (typeof options.point == 'object')) {
                    pos = options.point;
                }
            }
            if (pos) {
                return {
                    width: point.right ? pos.x - rect.left : (point.left ? rect.right - pos.x : rect.width()),
                    height: point.bottom ? pos.y - rect.top : (point.top ? rect.bottom - pos.y : rect.height())
                };
            }
            var dx = options.deltaX || 0;
            var dy = options.deltaY || 0;
            return {
                width: rect.width() + (point.right ? dx : (point.left ? -dx : 0)),
                height: rect.height() + (point.bottom ? dy : (point.top ? -dy : 0))
            };
        },
        getPointData: function(point) {
            if (!point) {
                return null;
            }
            if (bufPD === point) {
                return bufPD;
            }
            var center = (point === 'c');
            bufPD.right = !center && /r/i.test(point) ? 1 : 0;
            bufPD.bottom = !center && /b/i.test(point) ? 1 : 0;
            bufPD.left = !center && !bufPD.right && /l/i.test(point) ? 1 : 0;
            bufPD.top = !center && !bufPD.bottom && /t/i.test(point) ? 1 : 0;
            bufPD.center = center;
            bufPD.width = bufPD.left || bufPD.right || 0;
            bufPD.height = bufPD.top || bufPD.bottom || 0;
            if (!bufPD.center && !bufPD.width && !bufPD.height) {
                return null;
            }
            bufPD.corner = bufPD.width && bufPD.height;
            return bufPD;
        },
        swapSort: function(rect, propName1, propName2) {
            if (rect[propName1] > rect[propName2]) {
                var temp = rect[propName1];
                rect[propName1] = rect[propName2];
                rect[propName2] = temp;
            }
        },
        copyLT: function(rect, src, propName1, propName2) {
            if (typeof src[propName1] == 'number') {
                rect[propName1] = src[propName1];
                return;
            }
            if (typeof src[propName2] == 'number') {
                rect[propName1] = src[propName2];
                return;
            }
            rect[propName1] = 0;
        },
        copyRB: function(rect, src, propName, propLT, propWH) {
            if (typeof src[propName] == 'number') {
                rect[propName] = src[propName];
                return;
            }
            if (typeof src[propWH] == 'number') {
                rect[propName] = rect[propLT] + src[propWH];
                return;
            }
            rect[propName] = rect[propLT];
        },
        
        intoDelta: function(th1, th2, r1, r2, beh, rx1, rx2) {
            if ((th1 >= r1) && (th2 <= r2)) { return 0; }
            if ((th1 <  r1) && (th2 >  r2)) {
                if (rx1.test(beh)) { return r1 - th1; }
                if (rx2.test(beh)) { return r2 - th2; }
                return 0;
            }
            if (th1 < r1) { return Math.min(r1 - th1, r2 - th2); }
            if (th2 > r2) { return Math.max(r1 - th1, r2 - th2); }
            return 0;
        }
    };
    
    return Rect;
})();

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
var graphUtils = graphUtils || {};

graphUtils.color = (function() {

    var colorUtils = {
        extactAlpha: function(color) {
            var m = colorAlphaRx.exec(color);
            if (m) {
                return { color: m[1] + m[2] + ')', alpha: parseFloat(m[3]) };
            } else {
                return { color: color, alpha: 1 };
            }
        },
        
        addAlpha: function(color, alpha) {
            var rgba = colorUtils.getRGBA(color);
            rgba[3] = alpha;
            return colorUtils.colorStr(rgba);
        },
        
        checkColor: function(color) {
            return !!colorUtils.getRGBA(color, bufRGBA);
        },
        
        createColor: function() {
            return new ColorConstructor(4);
        },
        
        getRGBA: function(color, buf) {
            if (!color || (typeof color !== 'string')) {
                return null;
            }
            
            color = color.replace(/\s+/g, '').toLowerCase();
            
            if (colorsDict.hasOwnProperty(color)) {
                buf = buf || new ColorConstructor(4);
                return rgbaFromHex(colorsDict[color], buf);
            }
            
            if (hexRx.test(color)) {
                buf = buf || new ColorConstructor(4);
                return rgbaFromHex(color, buf);
            }
            
            var m = rgbaRx.exec(color);
            if (m) {
                if (!m[2] !== !m[6]) {
                    return null;
                }
                var r = parseColorPart(m[3]);
                var g = parseColorPart(m[4]);
                var b = parseColorPart(m[5]);
                var a = m[2] ? parseAlpha(m[6], 1) : 255;
                if (r === null || g === null || b === null || a === null) {
                    return null;
                }
                buf = buf || new ColorConstructor(4);
                buf[0] = r;
                buf[1] = g;
                buf[2] = b;
                buf[3] = a;
                return buf;
            }
            
            return null;
        },
        
        isEqvRGB: function(rgba1, rgba2) {
            return ((rgba1[3] === 0) && (rgba2[3] === 0)) ||
                    (rgba1[3] > 0) && (rgba2[3] > 0) &&
                    (rgba1[0] === rgba2[0]) &&
                    (rgba1[1] === rgba2[1]) &&
                    (rgba1[2] === rgba2[2]);
        },
        
        isEqvRGBA: function(rgba1, rgba2) {
            return ((rgba1[3] === 0) && (rgba2[3] === 0)) ||
                    (rgba1[0] === rgba2[0]) &&
                    (rgba1[1] === rgba2[1]) &&
                    (rgba1[2] === rgba2[2]) &&
                    (rgba1[3] === rgba2[3]);
        },
        
        colorStr: function(rgba) {
            if (rgba[3] > 254) {
                return '#' + hex(rgba[0]) + hex(rgba[1]) + hex(rgba[2]);
            } else {
                return 'rgba(' + rgba[0].toString() + ',' +
                                rgba[1].toString() + ',' +
                                rgba[2].toString() + ',' +
                                (rgba[3] / 255).toFixed(4) + ')';
            }
        },
        
        format: function(color) {
            if (!color || fullHexRx.test(color)) {
                return color && color.toLowerCase();
            }
            var rgba = colorUtils.getRGBA(color, bufRGBA);
            return rgba && colorUtils.colorStr(rgba);
        },
        
        getSafeColors: function() {
            var arr = [];
            for (var r = 0; r < 256; r += 51) {
                for (var g = 0; g < 256; g += 51) {
                    for (var b = 0; b < 256; b += 51) {
                        arr.push('#' + hex(r) + hex(g) + hex(b));
                    }
                }
            }
            return arr;
        }
    };


    var colorAlphaRx = /^\s*(rgb|hsl)a\s*(\([^,]+,[^,]+,[^,]+),\s*([^\)]+)\)\s*$/;
    var fullHexRx = /^#[0-9a-fA-F]{6}$/;
    var hexRx = /^#(?:[0-9a-fA-F]{3}){1,2}$/;
    var rgbaRx = /^(rgb)(a?)\(([0-9]{1,3}%?),([0-9]{1,3}%?),([0-9]{1,3}%?)(,[0-9\.]+)?\)$/;
    var PERCENT_CODE = '%'.charCodeAt(0);
    var ColorConstructor = (typeof Uint8Array === 'function') ? Uint8Array : Array;
    var bufRGBA = new ColorConstructor(4);
    
    function checkCC(num, max) {
        return (typeof num === 'number') && (Math.floor(num) === num) && (0 <= num) && (num <= max);
    }
    
    function hex(n) {
        return n < 16 ? '0' + n.toString(16) : n.toString(16);
    }
    
    function parseColorPart(str) {
        var n = parseInt(str, 10);
        var percent = (str.charCodeAt(str.length - 1) === PERCENT_CODE);
        if (percent && (n > 100) || (n > 255)) {
            return null;
        }
        return percent ? Math.round(n / 100 * 255) : n;
    }
    
    function parseAlpha(str, start) {
        str = start ? str.substr(start) : str;
        var n = parseFloat(str);
        return (!isNaN(n) && n >= 0 && n <= 1) ? Math.round(n * 255) : null;
    }
    
    function rgbaFromHex(hex, buf) {
        var r, g, b;
        if (hex.length === 7) {
            r = hex.substr(1, 2);
            g = hex.substr(3, 2);
            b = hex.substr(5, 2);
        } else {
            r = hex.substr(1, 1);
            g = hex.substr(2, 1);
            b = hex.substr(3, 1);
            r = r + r;
            g = g + g;
            b = b + b;
        }
        buf[0] = parseInt(r, 16);
        buf[1] = parseInt(g, 16);
        buf[2] = parseInt(b, 16);
        buf[3] = 255;
        return buf;
    }
    /*
    var tempCanvasForRGBA = null;
    var tempImageData = null;
    
    function createTempCanvas() {
    
    }
    
    function getTranslateTableForRGB(rgb) {
        
    }
    
    function getResultColorForRGBA(rgba) {
        
    }
    */
    
    
    var colorsDict = {
        aliceblue: '#f0f8ff',
        antiquewhite: '#faebd7',
        aqua: '#00ffff',
        aquamarine: '#7fffd4',
        azure: '#f0ffff',
        beige: '#f5f5dc',
        bisque: '#ffe4c4',
        black: '#000000',
        blanchedalmond: '#ffebcd',
        blue: '#0000ff',
        blueviolet: '#8a2be2',
        brown: '#a52a2a',
        burlywood: '#deb887',
        cadetblue: '#5f9ea0',
        chartreuse: '#7fff00',
        chocolate: '#d2691e',
        coral: '#ff7f50',
        cornflowerblue: '#6495ed',
        cornsilk: '#fff8dc',
        crimson: '#dc143c',
        cyan: '#00ffff',
        darkblue: '#00008b',
        darkcyan: '#008b8b',
        darkgoldenrod: '#b8860b',
        darkgray: '#a9a9a9',
        darkgreen: '#006400',
        darkkhaki: '#bdb76b',
        darkmagenta: '#8b008b',
        darkolivegreen: '#556b2f',
        darkorange: '#ff8c00',
        darkorchid: '#9932cc',
        darkred: '#8b0000',
        darksalmon: '#e9967a',
        darkseagreen: '#8fbc8f',
        darkslateblue: '#483d8b',
        darkslategray: '#2f4f4f',
        darkturquoise: '#00ced1',
        darkviolet: '#9400d3',
        deeppink: '#ff1493',
        deepskyblue: '#00bfff',
        dimgray: '#696969',
        dodgerblue: '#1e90ff',
        feldspar: '#d19275',
        firebrick: '#b22222',
        floralwhite: '#fffaf0',
        forestgreen: '#228b22',
        fuchsia: '#ff00ff',
        gainsboro: '#dcdcdc',
        ghostwhite: '#f8f8ff',
        gold: '#ffd700',
        goldenrod: '#daa520',
        gray: '#808080',
        green: '#008000',
        greenyellow: '#adff2f',
        honeydew: '#f0fff0',
        hotpink: '#ff69b4',
        indianred : '#cd5c5c',
        indigo : '#4b0082',
        ivory: '#fffff0',
        khaki: '#f0e68c',
        lavender: '#e6e6fa',
        lavenderblush: '#fff0f5',
        lawngreen: '#7cfc00',
        lemonchiffon: '#fffacd',
        lightblue: '#add8e6',
        lightcoral: '#f08080',
        lightcyan: '#e0ffff',
        lightgoldenrodyellow: '#fafad2',
        lightgrey: '#d3d3d3',
        lightgreen: '#90ee90',
        lightpink: '#ffb6c1',
        lightsalmon: '#ffa07a',
        lightseagreen: '#20b2aa',
        lightskyblue: '#87cefa',
        lightslateblue: '#8470ff',
        lightslategray: '#778899',
        lightsteelblue: '#b0c4de',
        lightyellow: '#ffffe0',
        lime: '#00ff00',
        limegreen: '#32cd32',
        linen: '#faf0e6',
        magenta: '#ff00ff',
        maroon: '#800000',
        mediumaquamarine: '#66cdaa',
        mediumblue: '#0000cd',
        mediumorchid: '#ba55d3',
        mediumpurple: '#9370d8',
        mediumseagreen: '#3cb371',
        mediumslateblue: '#7b68ee',
        mediumspringgreen: '#00fa9a',
        mediumturquoise: '#48d1cc',
        mediumvioletred: '#c71585',
        midnightblue: '#191970',
        mintcream: '#f5fffa',
        mistyrose: '#ffe4e1',
        moccasin: '#ffe4b5',
        navajowhite: '#ffdead',
        navy: '#000080',
        oldlace: '#fdf5e6',
        olive: '#808000',
        olivedrab: '#6b8e23',
        orange: '#ffa500',
        orangered: '#ff4500',
        orchid: '#da70d6',
        palegoldenrod: '#eee8aa',
        palegreen: '#98fb98',
        paleturquoise: '#afeeee',
        palevioletred: '#d87093',
        papayawhip: '#ffefd5',
        peachpuff: '#ffdab9',
        peru: '#cd853f',
        pink: '#ffc0cb',
        plum: '#dda0dd',
        powderblue: '#b0e0e6',
        purple: '#800080',
        red: '#ff0000',
        rosybrown: '#bc8f8f',
        royalblue: '#4169e1',
        saddlebrown: '#8b4513',
        salmon: '#fa8072',
        sandybrown: '#f4a460',
        seagreen: '#2e8b57',
        seashell: '#fff5ee',
        sienna: '#a0522d',
        silver: '#c0c0c0',
        skyblue: '#87ceeb',
        slateblue: '#6a5acd',
        slategray: '#708090',
        snow: '#fffafa',
        springgreen: '#00ff7f',
        steelblue: '#4682b4',
        tan: '#d2b48c',
        teal: '#008080',
        thistle: '#d8bfd8',
        tomato: '#ff6347',
        turquoise: '#40e0d0',
        violet: '#ee82ee',
        violetred: '#d02090',
        wheat: '#f5deb3',
        white: '#ffffff',
        whitesmoke: '#f5f5f5',
        yellow: '#ffff00',
        yellowgreen: '#9acd32'
    };
    
    return colorUtils;
})();
var graphUtils = graphUtils || {};

graphUtils.copyImage = function(src, dest, scale) {
    var ctx = dest.getContext('2d');
    var srcWidth = src.naturalWidth || src.width;
    var srcHeight = src.naturalHeight || src.height;
    if (!srcWidth || !srcHeight) {
        return dest;
    }
    var destWidth = scale ? dest.width : srcWidth;
    var destHeight = scale ? dest.height : srcHeight;
    ctx.drawImage(src, 0, 0, srcWidth, srcHeight, 0, 0, destWidth, destHeight);
    return dest;
};
        
graphUtils.drawImage = function(canvas, rect, clear, image) {
    var ctx = canvas.getContext('2d');
    var w = rect.right - rect.left, h = rect.bottom - rect.top;
    if (clear) {
        ctx.clearRect(rect.left, rect.top, w, h);
    }
    if (image) {
        ctx.drawImage(image, 0, 0, w, h, rect.left, rect.top, w, h);
    }
};

graphUtils.resetGlobals = function(ctx) {
    ctx.globalCompositeOperation = 'source-over';
};

graphUtils.setOptions = function(ctx, options) {
    if (options) {
        for (var i in options) {
            if (options.hasOwnProperty(i) && (options[i] != null)) {
                ctx[i] = options[i];
            }
        }
    }
};

graphUtils.setCtxShapeOptions = function(ctx, options) {
    ctx.strokeStyle = options.color;
    ctx.lineWidth = options.lineWidth;
    ctx.lineCap = options.lineCap;
    ctx.lineJoin = options.lineJoin;
    ctx.fillStyle = options.fillColor;
};

var graphUtils = graphUtils || {};

graphUtils.imageData = {

    copy: function(src, dest) {
        var max = Math.max(src.data.length, dest.data.length);
        src = src.data;
        dest = dest.data;

        for (var i = 0; i < max; ++i) {
            dest[i] = src[i];
        }
    /*
        var left = rect ? Math.max(rect.left, 0) : 0,
            top = rect ? Math.max(rect.top, 0) : 0,
            right = rect ? Math.min(rect.right, imgData.width) : imgData.width,
            bottom = rect ? Math.min(rect.bottom, imgData.height) : imgData.height,
            data = imgData.data;
            
        src = src.data;
        dest = dest.data;
            
        for (var j = top; y < bottom; ++y) {
            var right1 = (imgData.width * y + right) * 4;
            for (var i = right1 - (right - left) * 4; i < right1; ++i) {
                data[i] = color[0];
                data[++i] = color[1];
                data[++i] = color[2];
                data[++i] = color[3];
            }
        }
        */
    },
    
    fillRect: function(imgData, color, rect) {
        var left = rect ? Math.max(rect.left, 0) : 0,
            top = rect ? Math.max(rect.top, 0) : 0,
            right = rect ? Math.min(rect.right, imgData.width) : imgData.width,
            bottom = rect ? Math.min(rect.bottom, imgData.height) : imgData.height,
            width = imgData.width;
            
        imgData = imgData.data;
            
        for (var y = top; y < bottom; ++y) {
            var right1 = (width * y + right) * 4;
            for (var i = right1 - (right - left) * 4; i < right1; ++i) {
                data[i] = color[0];
                data[++i] = color[1];
                data[++i] = color[2];
                data[++i] = color[3];
            }
        }
    },
    
    setPixelColor: function(imgData, x, y, color, alpha) {
        var b = (y * imgData.width + x) * 4,
            d = imgData.data;
        d[b] = color[0];   // r
        d[b + 1] = color[1]; // g
        d[b + 2] = color[2]; // b
        if (alpha) {
            d[b + 3] = color[3]; // a
        }
    }
};

graphUtils.ImageData = (function() {

    var Class = utils.createClass(null, {
        constructor: function(ctx, rect, blank) {
            if (ctx.data && ctx.width && ctx.height) {
                this._imgData = ctx;
            } else {
                if (!rect || typeof rect === 'boolean') {
                    blank = rect;
                    rect = {
                        left: 0,
                        top: 0,
                        right: ctx.canvas.width,
                        bottom: ctx.canvas.height
                    };
                }
                var width = rect.right - rect.left,
                    height = rect.bottom - rect.top;
                this._imgData = blank ?
                    ctx.createImageData(width, height) :
                    ctx.getImageData(rect.left, rect.top, width, height);
            }
            this._rect = {
                left: 0,
                top: 0,
                right: this._imgData.width,
                bottom: this._imgData.height
            };
        },
        
        getData: function() {
            return this._imgData;
        },
        
        width: function() {
            return this._rect.right;
        },
        
        height: function() {
            return this._rect.bottom;
        },
        
        getPixelColor: function(x, y, colorBuf) {
            colorBuf = colorBuf || graphUtils.color.createColor();
            var b = (y * this._imgData.width + x) * 4,
                d = this._imgData.data;
            colorBuf[0] = d[b];   // r
            colorBuf[1] = d[b + 1]; // g
            colorBuf[2] = d[b + 2]; // b
            colorBuf[3] = d[b + 3]; // a
            return colorBuf;
        },
        
        setPixelColor: function(x, y, color, alpha) {
            var b = (y * this._imgData.width + x) * 4,
                d = this._imgData.data;
            d[b] = color[0];   // r
            d[b + 1] = color[1]; // g
            d[b + 2] = color[2]; // b
            if (alpha) {
                d[b + 3] = color[3]; // a
            }
        },
        
        floodFill: function(x, y, newVal, cmpAlpha, replaceAlpha) {
            var isEqvColor = cmpAlpha ? graphUtils.color.isEqvRGBA : graphUtils.color.isEqvRGB;
        
            var beginX = 0, beginY = 0, 
                endX = this._imgData.width, endY = this._imgData.height,
                oldv = this.getPixelColor(x, y),
                buf = graphUtils.color.createColor();
            
            if ((x < 0) || (y < 0) || (x >= endX) || (y >= endY)) { return null; }

            var minX = x, minY = y, maxX = x + 1, maxY = y;
                
            if(isEqvColor(newVal, oldv)) {
                return null;
            }
            if (cmpAlpha && !replaceAlpha && graphUtils.color.isEqvRGB(newVal, oldv)) {
                return null;
            }
            
            var self = this;
            
            function left(x, y) {
                var x0 = x;
                while (x0 > beginX) {
                    if (!isEqvColor(oldv, self.getPixelColor(x0 - 1, y, buf))) { break; }
                    x0--;
                }
                return x0;
            }
            function line(x0, x, y) {
                var x1;
                for (x1 = x0; x1 <= x || ((x1 < endX) && isEqvColor(oldv, self.getPixelColor(x1, y, buf))); ++x1) {
                    self.setPixelColor(x1, y, newVal, replaceAlpha);
                }
                return x1;
            }
            function cicle (x0, x1, y) {
                while (x0 < x1) {
                    if (isEqvColor(oldv, self.getPixelColor(x0, y, buf))) {
                        x0 = fill(x0, y);
                    } else {
                        x0++;
                    }
                }
            }
            function fill (x, y) {
                var x0 = left(x, y);
                var x1 = line(x0, x, y);
                if (y > beginY) { cicle(x0, x1, y - 1); }
                if (y < endY - 1) { cicle(x0, x1, y + 1); }
                if (x0 < minX) { minX = x0; }
                if (x1 > maxX) { maxX = x1; }
                if (y < minY) { minY = y; }
                if (y > maxY) { maxY = y; }
                return x1;
            }
            fill(x, y);
            
            return { 
                left: minX,
                top: minY,
                right: Math.min(maxX, endX),
                bottom: Math.min(maxY + 1, endY)
            };
        },
        
        slice: function(ctx, rect) {
            rect = rect || this._rect;
            var ret = new Class(ctx, rect, true);
            return ret.copyFrom(this, rect);
        },
        
        copyFrom: function(src, srcRect, x, y) {
            srcRect = srcRect || src._rect;
            x = x || 0;
            y = y || 0;
            
            var dx = srcRect.left - x;
            var dy = srcRect.top - y;
            var right = srcRect.left + Math.min(this.width() - x, srcRect.right - srcRect.left);
            var bottom = srcRect.top + Math.min(this.height() - y, srcRect.bottom - srcRect.top);
            var bufColor = graphUtils.color.createColor();
            
            for (var i = srcRect.left; i < right; ++i) {
                for (var j = srcRect.top; j < bottom; ++j) {
                    src.getPixelColor(i, j, bufColor);
                    this.setPixelColor(i - dx, j - dy, bufColor, true);
                }
            }
            
            return this;
        },
        
        fillRect: function(color, rect) {
            rect = rect || this._rect;
            for (var i = rect.left; i < rect.right; ++i) {
                for (var j = rect.top; j < rect.bottom; ++j) {
                    this.setPixelColor(i, j, color, true);
                }
            }
        },
        
        isImageDataWrapper: true
    });
    
    return Class;
})();
var graphUtils = graphUtils || {};

graphUtils.patterns = (function() {

    var MAX_LAST_COUNT = 16;
    var lastPatterns = [];
    
    var patterns = {
        'dots': {
            pixels: [
                [0, 0, 0],
                [0, 1, 0],
                [0, 0, 0]
            ]
        },
        
        'dotsd': {
            pixels: [
                [0, 0, 0, 0],
                [0, 1, 0, 0],
                [0, 0, 0, 0],
                [0, 0, 0, 0]
            ]
        },
        
        'dotsb': {
            pixels: [
                [0, 0, 0, 0],
                [0, 1, 1, 0],
                [0, 1, 1, 0],
                [0, 0, 0, 0]
            ]
        },
        
        'dotsbd': {
            pixels: [
                [0, 0, 0, 0, 0],
                [0, 1, 1, 0, 0],
                [0, 1, 1, 0, 0],
                [0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0]
            ]
        },
    
        'lines0': {
            pixels: [
                [0],
                [1],
                [0]
            ]
        },
        
        'lines0d': {
            pixels: [
                [0],
                [1],
                [0],
                [0]
            ]
        },
        
        'lines0b': {
            pixels: [
                [0],
                [1],
                [1],
                [0]
            ]
        },
        
        'lines0bd': {
            pixels: [
                [0],
                [1],
                [1],
                [0],
                [0]
            ]
        },
        
        'lines45': {
            pixels: [
                [1, 0, 0, 0, 0],
                [0, 1, 0, 0, 0],
                [0, 0, 1, 0, 0],
                [0, 0, 0, 1, 0],
                [0, 0, 0, 0, 1]
            ]
        },
        
        'lines45d': {
            pixels: [
                [1, 0, 0, 0, 0, 0],
                [0, 1, 0, 0, 0, 0],
                [0, 0, 1, 0, 0, 0],
                [0, 0, 0, 1, 0, 0],
                [0, 0, 0, 0, 1, 0],
                [0, 0, 0, 0, 0, 1]
            ]
        },
        
        'lines45b': {
            pixels: [
                [1, 1, 0, 0, 0, 0],
                [0, 1, 1, 0, 0, 0],
                [0, 0, 1, 1, 0, 0],
                [0, 0, 0, 1, 1, 0],
                [0, 0, 0, 0, 1, 1],
                [1, 0, 0, 0, 0, 1]
            ]
        },
        
        'lines45bd': {
            pixels: [
                [1, 1, 0, 0, 0, 0, 0],
                [0, 1, 1, 0, 0, 0, 0],
                [0, 0, 1, 1, 0, 0, 0],
                [0, 0, 0, 1, 1, 0, 0],
                [0, 0, 0, 0, 1, 1, 0],
                [0, 0, 0, 0, 0, 1, 1],
                [1, 0, 0, 0, 0, 0, 1]
            ]
        },
        
        'lines90': {
            pixels: [
                [0, 1, 0]
            ]
        },
        
        'lines90d': {
            pixels: [
                [0, 1, 0, 0]
            ]
        },
        
        'lines90b': {
            pixels: [
                [0, 1, 1, 0]
            ]
        },
        
        'lines90bd': {
            pixels: [
                [0, 1, 1, 0, 0]
            ]
        },
        
        'lines135': {
            pixels: [
                [0, 0, 0, 0, 1],
                [0, 0, 0, 1, 0],
                [0, 0, 1, 0, 0],
                [0, 1, 0, 0, 0],
                [1, 0, 0, 0, 0]
            ]
        },
        
        'lines135d': {
            pixels: [
                [0, 0, 0, 0, 0, 1],
                [0, 0, 0, 0, 1, 0],
                [0, 0, 0, 1, 0, 0],
                [0, 0, 1, 0, 0, 0],
                [0, 1, 0, 0, 0, 0],
                [1, 0, 0, 0, 0, 0]
            ]
        },
        
        'lines135b': {
            pixels: [
                [0, 0, 0, 0, 1, 1],
                [0, 0, 0, 1, 1, 0],
                [0, 0, 1, 1, 0, 0],
                [0, 1, 1, 0, 0, 0],
                [1, 1, 0, 0, 0, 0],
                [1, 0, 0, 0, 0, 1]
            ]
        },
        
        'lines135bd': {
            pixels: [
                [0, 0, 0, 0, 0, 1, 1],
                [0, 0, 0, 0, 1, 1, 0],
                [0, 0, 0, 1, 1, 0, 0],
                [0, 0, 1, 1, 0, 0, 0],
                [0, 1, 1, 0, 0, 0, 0],
                [1, 1, 0, 0, 0, 0, 0],
                [1, 0, 0, 0, 0, 0, 1]
            ]
        }
    };
    
    var pttrns = {
        getAllTypes: function(withEmpty) {
            var types = Object.keys(patterns);
            if (withEmpty) {
                types.unshift('');
            }
            return types;
        },
        
        checkName: function(name) {
            return (typeof name === 'string' && (name === '' || patterns.hasOwnProperty(name)));
        },
        
        getPattern: function(type, color, offsetX, offsetY) {
            var obj = this._getPattern(type, color, offsetX, offsetY);
            return obj ? obj.pattern : null;
        },
        
        getPatternUrl: function(type, color, offsetX, offsetY) {
            var obj = this._getPattern(type, color, offsetX, offsetY);
            return obj ? obj.url : null;
        },
    
        _getPattern: function(type, color, offsetX, offsetY) {
            if (!type || !color || !patterns.hasOwnProperty(type)) {
                return null;
            }
            
            var config = patterns[type];
            var width = config.pixels[0].length;
            var height = config.pixels.length;
            
            offsetX = (offsetX || 0) % width;
            offsetY = (offsetY || 0) % height;
            if (offsetX < 0) {
                offsetX = width + offsetX;
            }
            if (offsetY < 0) {
                offsetY = height + offsetY;
            }
            
            for (var i = 0; i < lastPatterns.length; ++i) {
                if (lastPatterns[i].isMatch(type, color, offsetX, offsetY)) {
                    return lastPatterns[i];
                }
            }
            
            var obj = new PatternWrapper(type, color, offsetX, offsetY);

            lastPatterns.push(obj);
            if (lastPatterns.length > MAX_LAST_COUNT) {
                lastPatterns.shift();
            }
            
            return obj;
        }
    };
    
    // ----------------------------------------------------------------------------------
    var tempCanvas;
    var transparent = [0, 0, 0, 0];
    
    function PatternWrapper(type, color, offsetX, offsetY) {
        this._type = type;
        this._color = color;
        this._offsetX = offsetX;
        this._offsetY = offsetY;
        
        var config = patterns[type];
        
        this.width = config.pixels[0].length;
        this.height = config.pixels.length;
        
        if (!tempCanvas) {
            tempCanvas = document.createElement('canvas');
        }
        tempCanvas.width = this.width;
        tempCanvas.height = this.height;
        
        var ctx = tempCanvas.getContext('2d');
        this._drawPattern(config, ctx);
        
        this.url = tempCanvas.toDataURL('image/png');
        this.pattern = ctx.createPattern(tempCanvas, 'repeat');
    }
    
    PatternWrapper.prototype._drawPattern = function(config, ctx) {
        if (!config._imageData) {
            config._imageData = ctx.createImageData(this.width, this.height);
        }
        
        var color = graphUtils.color.getRGBA(this._color);
        //color[3] = 255;
        
        for (var y = 0; y < this.height; ++y) {
            var destY = this.y(y);
            
            for (var x = 0; x < this.width; ++x) {
                var destX = this.x(x);
                
                graphUtils.imageData.setPixelColor(config._imageData, 
                        destX, destY, config.pixels[y][x] ? color : transparent, true);
            }
        }
        
        ctx.putImageData(config._imageData, 0, 0);
    };
    
    PatternWrapper.prototype.isMatch = function(type, color, offsetX, offsetY) {
        return (this._type === type) &&
                    (this._color === color) &&
                    (this._offsetX === offsetX) &&
                    (this._offsetY === offsetY);
    };
    
    PatternWrapper.prototype.x = function(x) {
        return (this.width + x - this._offsetX) % this.width;
    };
    
    PatternWrapper.prototype.y = function(y) {
        return (this.height + y - this._offsetY) % this.height;
    };
    
    return pttrns;
})();
var graphUtils = graphUtils || {};

graphUtils.rotate = (function() {
    
    var transforms = {
        'x'  : function(w, h) { return [-1,  0,  0,  1, w, 0]; },
        'y'  : function(w, h) { return [ 1,  0,  0, -1, 0, h]; },
        '90' : function(w, h) { return [ 0,  1, -1,  0, h, 0]; },
        '180': function(w, h) { return [-1,  0,  0, -1, w, h]; },
        '270': function(w, h) { return [ 0, -1,  1,  0, 0, w]; }
    };
    
    return {
        // angle: 'x', 'y', '90', '180', '270'
        rotateOrto: function(srcCanvas, destCtx, type) {
            var t = transforms[String(type).toLowerCase()];
            if (t) {
                destCtx.save();
                var w = srcCanvas.width, h = srcCanvas.height;
                destCtx.setTransform.apply(destCtx, t(w, h));
                destCtx.drawImage(srcCanvas, 0, 0, w, h, 0, 0, w, h);
                destCtx.restore();
            }
        }
    };
})();
var graphUtils = graphUtils || {};

graphUtils.shapes = (function() {

    var shapes = {
        squarePenLine: function(ctx, x1, y1, x2, y2, widthMinus, widthPlus) {
            var x0, y0;
            if ((x1 === x2) || (y1 === y2)) {
                //if ((x1 === x2) && (y1 === y2)) { return; }
                x0 = Math.min(x1, x2);
                y0 = Math.min(y1, y2);
                ctx.rect(x0 - widthMinus, y0 - widthMinus, Math.max(x1, x2) - x0 + widthMinus + widthPlus, Math.max(y1, y2) - y0 +  widthMinus + widthPlus);
                return;
            }
            if (x2 < x1) {
                x0 = x1;
                x1 = x2;
                x2 = x0;
                y0 = y1;
                y1 = y2;
                y2 = y0;
            }
            ctx.moveTo(x1 - widthMinus, y1 - widthMinus);
            if (y2 > y1) {
                ctx.lineTo(x1 + widthPlus, y1 - widthMinus);
            } else {
                ctx.lineTo(x2 - widthMinus, y2 - widthMinus);
            }
            ctx.lineTo(x2 + widthPlus, y2 - widthMinus);
            ctx.lineTo(x2 + widthPlus, y2 + widthPlus);
            if (y2 > y1) {
                ctx.lineTo(x2 - widthMinus, y2 + widthPlus);
            } else {
                ctx.lineTo(x1 + widthPlus, y1 + widthPlus);
            }
            ctx.lineTo(x1 - widthMinus, y1 + widthPlus);
        },
        
        useFillPath: function(lineWidth, penForm) {
            return (penForm !== 'round') && (lineWidth > 2);
        },
        
        _drawStrokePath: function(ctx, path, width) {
            var add = (width % 2) ? 0.5 : 0;
            
            if (path.length < 4) {
                ctx.arc(path[0] + add, path[1] + add, width / 2, 0, Math.PI * 2);
                ctx.fillStyle = ctx.strokeStyle;
                ctx.fill();
                return;
            }
            
            ctx.moveTo(path[0] + add, path[1] + add);
            for (var i = 3; i < path.length; i += 2) {
                ctx.lineTo(path[i - 1] + add, path[i] + add);
            }
            ctx.stroke();
        },
        
        _drawFillPath: function(ctx, path, width) {
            var widthMinus = Math.floor(width / 2 + 0.000001);
            var widthPlus = Math.ceil(width / 2 - 0.000001);
            
            if (path.length < 4) {
                this.squarePenLine(ctx, path[0], path[1], path[0], path[1], widthMinus, widthPlus);
                ctx.fill();
                return;
            }
            
            for (var i = 3; i < path.length; i += 2) {
                this.squarePenLine(ctx, path[i - 3], path[i - 2], path[i - 1], path[i], widthMinus, widthPlus);
            }
            ctx.fill();
        },
        
        // path: [x0, y0, x1, y1, ..., xN, yN]
        drawPath: function(ctx, path, lineWidth, penForm) {
            if (!path || (path.length < 2)) {
                return;
            }
            lineWidth = lineWidth || 1;
            var useFillPath = this.useFillPath(lineWidth, penForm);
            ctx.beginPath();
            if (useFillPath) {
                this._drawFillPath(ctx, path, lineWidth);
            } else {
                this._drawStrokePath(ctx, path, lineWidth);
            }
        },
        
        _getColor: function(color, drawValue) {
            return (drawValue === 'erase') ? '#000000' : color;
        },
        
        isEraser: function(drawValue) {
            return ((drawValue === 'erase') || (drawValue === 'parterase'));
        },
        
        _setGCO: function(options, drawValue) {
            if (this.isEraser(drawValue)) {
                options.globalCompositeOperation = 'destination-out';
            }
        },
        
        getDrawStyle: function(config, color, rect) {
            return config.drawPattern ?
                graphUtils.patterns.getPattern(config.drawPattern, color, rect ? rect.left : 0, rect ? rect.top : 0) :
                color;
        },
        
        makePenOptions: function(config, forcedColor, rect, eraser) {
            var options = {};
            var color = this._getColor(forcedColor || config.color, eraser && 'erase'/*config.drawPen*/);
            color = this.getDrawStyle(config, color, rect);
            var lineWidth = config.lineWidth || 1;
            options.fillStyle = color;
            var useFillPath = this.useFillPath(lineWidth, config.penForm);
            if (!useFillPath) {
                options.strokeStyle = color;
                options.lineWidth = lineWidth;
                options.lineCap = lineWidth > 1 ? 'round' : 'square';
                options.lineJoin = 'round';
            }
            this._setGCO(options, eraser && 'erase'/*config.drawPen*/);
            return options;
        },
        
        compressPath: function(path) {
            if (!path || (path.length < 6)) {
                return path;
            }
            var pos = 3;
            var x1 = path[0], y1 = path[1], x2 = path[2], y2 = path[3];
            for (var i = 5; i < path.length; i += 2) {
                var x3 = path[i - 1], y3 = path[i];
                
                var canCollapse = ((x1 === x2) && (x2 === x3) && (y1 >= y2 === y2 >= y3)) ||
                                    ((y1 === y2) && (y2 === y3) && (x1 >= x2 === x2 >= x3)) ||
                                    ((y3 - y2 === y2 - y1) && (x3 - x2 === x2 - x1));
                
                if (canCollapse) {
                    x2 = path[pos - 1] = x3;
                    y2 = path[pos] = y3;
                } else {
                    x1 = x2;
                    y1 = y2;
                    x2 = path[i - 1];
                    y2 = path[i];
                    pos += 2;
                    if (pos + 2 <= i) {
                        path[pos - 1] = path[i - 1];
                        path[pos] = path[i];
                    }
                }
            }
            path.length = pos + 1;
            return path;
        },
        
        drawLine: function(ctx, rect) {
            var add = (ctx.lineWidth % 2) ? 0.5 : 0;
            ctx.beginPath();
            ctx.moveTo(rect.left + add, rect.top + add);
            ctx.lineTo(rect.right + add, rect.bottom + add);
            ctx.stroke();
        },
        
        drawBezier: function(ctx, points) {
            var add = (ctx.lineWidth % 2) ? 0.5 : 0;
            ctx.beginPath();
            ctx.moveTo(points[0] + add, points[1] + add);
            if (points.length == 4) {
                ctx.lineTo(points[2] + add, points[3] + add);
            }
            if (points.length == 6) {
                ctx.quadraticCurveTo(points[2] + add, points[3] + add, points[4] + add, points[5] + add);
            }
            if (points.length == 8) {
                ctx.bezierCurveTo(points[2] + add, points[3] + add, points[4] + add, points[5] + add, points[6] + add, points[7] + add);
            }
            ctx.stroke();
        },
        
        makeLineOptions: function(config, canErase, rect) {
            var options = {};
            var color = canErase ? this._getColor(config.color, config.drawLine) : config.color;
            color = this.getDrawStyle(config, color, rect);
            var lineWidth = config.lineWidth || 1;
            options.strokeStyle = color;
            options.lineWidth = lineWidth;
            options.lineCap = lineWidth > 1 ? (config.lineCap || 'round') : 'square';
            if (canErase) {
                this._setGCO(options, config.drawLine);
            }
            return options;
        },
        
        makeShapeOptions: function(config, shape, rect) {
            var options = {};
            var lineWidth = config.lineWidth || 1;
            options.strokeStyle = config.color;
            var fillColor = this._getColor(config.fillColor, config.drawShape);
            fillColor = this.getDrawStyle(config, fillColor, rect);
            options.fillStyle = fillColor;
            options.lineWidth = lineWidth;
            
            if ((lineWidth > 1) && (config.lineJoin === 'round')) {
                options.lineCap = 'round';
                options.lineJoin = 'round';
            } else {
                options.lineCap = 'square';
                options.lineJoin = 'miter';
            }
            
            this._setGCO(options, config.drawShape);
            return options;
        },
        
        drawShape: function(ctx, shape, rect, drawShape, options) {
            var lineWidth = (drawShape === 'stroke') || (drawShape === 'both') ? ctx.lineWidth : 0;
            var fill = (drawShape !== 'stroke');
            
            if (!fill && !lineWidth) {
                return;
            }
            
            if (typeof drawShapeFuncs[shape] === 'function') {
                drawShapeFuncs[shape](ctx, rect, fill, lineWidth, options);
            }
        }
    };
    
    var drawShapeFuncs = {
        rect: function(ctx, rect, fill, lineWidth) {
            if (!lineWidth) {
                ctx.fillRect(rect.left, rect.top, rect.right - rect.left + 1, rect.bottom - rect.top + 1);
                return;
            }

            if (fill) {
                var fillDelta = Math.ceil(lineWidth / 2);
                var fillDelta2 = lineWidth - fillDelta;
                var rectWidth = rect.right - rect.left - lineWidth;
                var rectHeight = rect.bottom - rect.top - lineWidth;
                if (rectWidth > 0 && rectHeight > 0) {
                    ctx.fillRect(rect.left + fillDelta, rect.top + fillDelta, rectWidth, rectHeight);
                }
            }

            var add = (lineWidth % 2) ? 0.5 : 0;
            ctx.beginPath();
            ctx.moveTo(rect.left + add, rect.top + add);
            ctx.lineTo(rect.right + add, rect.top + add);
            ctx.lineTo(rect.right + add, rect.bottom + add);
            ctx.lineTo(rect.left + add, rect.bottom + add);
            ctx.lineTo(rect.left + add, rect.top + add);
            ctx.stroke();
        },
        
        _roundrectPath: function(ctx, x1, y1, x2, y2, radius) {
            ctx.beginPath();
            ctx.moveTo(x1 + radius, y1);
            ctx.arcTo(x2, y1, x2, y2, radius);
            ctx.arcTo(x2, y2, x1, y2, radius);
            ctx.arcTo(x1, y2, x1, y1, radius);
            ctx.arcTo(x1, y1, x2, y1, radius);
        },
        roundrect: function(ctx, rect, fill, lineWidth, options) {
            var radius = options.rectRadius || 1;
            radius = Math.min(radius, (rect.right - rect.left) / 2, (rect.bottom - rect.top) / 2);
            if (!lineWidth) {
                this._roundrectPath(ctx, rect.left, rect.top, rect.right + 1, rect.bottom + 1, radius);
                ctx.fill();
                return;
            }

            if (fill) {
                var fillDelta = Math.ceil(lineWidth / 2);
                var fillDelta2 = lineWidth - fillDelta;
                var r = radius - ctx.lineWidth / 2;
                var rectWidth = rect.right - rect.left - lineWidth;
                var rectHeight = rect.bottom - rect.top - lineWidth;
                if (rectWidth > 0 && rectHeight > 0) {
                    if (r > 0) {
                        this._roundrectPath(ctx, rect.left + fillDelta, rect.top + fillDelta,
                                            rect.right - fillDelta2, rect.bottom - fillDelta2, r);
                        ctx.fill();
                    } else {
                        ctx.fillRect(rect.left + fillDelta, rect.top + fillDelta, rectWidth, rectHeight);
                    }
                }
            }

            var add = (lineWidth % 2) ? 0.5 : 0;
            
            this._roundrectPath(ctx, rect.left + add, rect.top + add, rect.right + add, rect.bottom + add, radius);
            ctx.stroke();
        },
        
        _setEllipsTransform: function(ctx, cx, cy, rect, radius, width, height) {
            ctx.translate(rect.left + cx, rect.top + cy);
            if (width > height) {
                ctx.scale(1, height / width);
            } else {
                ctx.scale(width / height, 1);
            }
        },
        
        ellipse: function(ctx, rect, fill, lineWidth) {
            var width = rect.right - rect.left + 1,
                height = rect.bottom - rect.top + 1;

            var cx = width / 2, cy = height / 2;
            var add = (lineWidth % 2) ? 0.5 : 0;
            
            var radius = (width > height ? cx : cy);

            ctx.save();
            
            this._setEllipsTransform(ctx, cx, cy, rect, radius, width, height);
            /*
            ctx.translate(rect.left + cx, rect.top + cy);
            
            var radius;
            if (width > height) {
                radius = cx;
                ctx.scale(1, height / width);
            } else {
                radius = cy;
                ctx.scale(width / height, 1);
            }
            */

            if (!lineWidth) {
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, 2 * Math.PI);
                ctx.restore();
                ctx.fill();
                
            } else {
                if (fill && (width > lineWidth) && (height > lineWidth)) {
                    var delta = lineWidth / 2;
                    ctx.beginPath();
                    ctx.arc(0, 0, radius, 0, Math.PI * 2);
                    ctx.restore();
                    ctx.fill();
                    ctx.save();
                    this._setEllipsTransform(ctx, cx, cy, rect, radius, width, height);
                }
                ctx.beginPath();
                ctx.arc(0, 0, radius + add, 0, Math.PI * 2);
                ctx.restore();
                ctx.stroke();
            }
        }
    };
    
    return shapes;
})();
var graphUtils = graphUtils || {};

graphUtils.text = (function() {

    return {
        makeFont: function(options) {
            return (options.fontBold ? 'bold ' : '') +
                    (options.fontItalic ? 'italic ' : '') +
                    options.fontSize + 'px ' + options.fontFamily;
        },
        
        makeTextOptions: function(config) {
            var options = {};
            options.fillStyle = config.color;
            options.font =  this.makeFont(config);
            return options;
        },
        
        drawText: function(ctx, strings, pos, lineHeight) {
            if (!strings) {
                return;
            }
            ctx.textBaseline = 'top';
            var top = pos.y;
            for (var i = 0; i < strings.length; ++i) {
                ctx.fillText(strings[i], pos.x, top);
                top += lineHeight;
            }
        },
        
        checkFont: function(font) {
            return true;
        }
    };
})();
var html5 = (function() {

    var html5 = {
        getImage: function(blobOrUrl, corsOptions, callback, ctx) {
            if (!blobOrUrl) {
                callback.call(ctx, {img: null, error: 'noParam'});
                return;
            }
            if (typeof corsOptions == 'function') {
                ctx = callback;
                callback = corsOptions;
                corsOptions = null;
            }
            if (typeof blobOrUrl == 'string') {
                this.getImageFromURL(blobOrUrl, corsOptions, callback, ctx);
            } else {
                this.getImageFromBlob(blobOrUrl, callback, ctx)
            }
        },
        
        getImageFromBlob: function(blob, callback, ctx) {
            if (!blob || (typeof Blob == 'undefined') || !(blob instanceof Blob)) {
                callback.call(ctx, {img: null, error: 'noBlob'});
                return;
            }
            var fileName = blob.name;
            var getImage = this.getImageFromURL;
            if ((typeof URL !== 'undefined') && URL && URL.createObjectURL) {
                var objUrl = URL.createObjectURL(blob);
                getImage(objUrl, null, function(imgInfo) {
                    URL.revokeObjectURL(objUrl);
                    imgInfo.fileName = fileName;
                    callback.call(ctx, imgInfo, blob);
                });
            } else {
                if (typeof FileReader === 'function') {
                    var fr = new FileReader();
                    fr.onload = function() {
                        getImage(this.result, null, function(imgInfo) {
                            imgInfo.fileName = fileName;
                            callback.call(ctx, imgInfo, blob);
                        });
                    };
                    fr.readAsDataURL(blob);
                }
            }
        },
        
        getImageFromURL: function(url, corsOptions, callback, ctx) {
            var img = new Image();
            if (corsOptions && utils.isCrossOrigin(location.href, url)) {
                var resolved = false;
                if (corsOptions.getProxyUrl) {
                    url = corsOptions.getProxyUrl.call(corsOptions.ctx || corsOptions, url);
                    resolved = !utils.isCrossOrigin(location.href, url);
                }
                if (!resolved) {
                    if (img.crossOrigin === undefined) {
                        //attr "crossorigin" not supported
                        callback.call(ctx, {img: null, error: 'crossOrigin'}, url);
                        return;
                    }
                    img.crossOrigin = corsOptions.useCredentials ? 'use-credentials' : 'anonymous';
                }
            }
            img.onload = function() {
                callback.call(ctx, {img: img, error: null}, url);
            };
            img.onerror = function() {
                callback.call(ctx, {img: null, error: 'onError'}, url);
            };
            img.src = url;
        },
        
        getImageFromEvent: function(e, callback, ctx, callbackStartTimer) {
            var el = e.target;
            if (e.type == 'paste') {
                getImageFromDT(e.clipboardData, e.type, function(blob, url, image) {
                    if (blob || url || image) {
                        e.stopPropagation();
                        e.preventDefault();
                    }
                    if (blob) {
                        html5.getImageFromBlob(blob, callback, ctx);
                        return;
                    }
                    if (url) {
                        callback.call(ctx, {url: url, img: null, error: null});
                        return;
                    }
                    if (image) {
                        callback.call(ctx, {url: null, img: image, error: null});
                        return;
                    }

                    if (callbackStartTimer) {
                        callbackStartTimer.call(ctx);
                    }
                    setTimeout(function() {
                        var pastedImg = el.getElementsByTagName('img')[0];
                        if (el.parentNode) {
                            el.parentNode.removeChild(el);
                        }
                        if (pastedImg) {
                            pastedImg.parentNode.removeChild(pastedImg);
                            if (pastedImg.complete) {
                                callback.call(ctx, {img: pastedImg, error: null});
                            } else {
                                pastedImg.onload = function() {
                                    callback.call(ctx, {img: pastedImg, error: null});
                                };
                            }
                        } else {
                            callback.call(ctx, {img: null, error: 'noImage'});
                        }
                    }, 200);
                });
                return;
            }
            
            if (e.type == 'drop') {
                getImageFromDT(e.dataTransfer, e.type, function(blob, url, image) {
                    if (blob) {
                        html5.getImageFromBlob(blob, callback, ctx);
                        return;
                    }
                    if (url) {
                        callback.call(ctx, {url: url, img: null, error: null});
                        return;
                    }
                    if (image) {
                        callback.call(ctx, {url: null, img: image, error: null});
                        return;
                    }
                });
                return;
            }
            
            callback.call(ctx, { img: null, name: null, event: e.type, error: 'notImplemented' });
        }
    };
    
    
    //---------------------------
    var imgTypeRX = /^image\/(?:bmp|ico|png|gif|jpe?g)$/;
    
    var getImageFromDT = function(dt, event, callback) {
        if (!dt) {
            callback(null, null, null);
            return;
        }
        
        var file, i;
        
        if (dt.files && dt.files.length) {
            for(i = 0; i < dt.files.length; ++i) {
                file = dt.files[i];
                if (imgTypeRX.test(file.type)) {
                    callback(file, null, null);
                    return;
                }
            }
        }
        
        if (dt.items) {
            for(i = 0; i < dt.items.length; ++i) {
                var dti = dt.items[i];
                if((dti.kind === 'file') && imgTypeRX.test(dti.type)) {
                    file = dti.getAsFile();
                    if (file) {
                        callback(file, null, null);
                        return;
                    }
                }
            }
        }
        
        getImageUrlFromDTItems(dt, event, callback);
    };
    
    var getImageUrlFromDTItems = function(dt, event, callback) {
        
        var str, type = (event === 'paste') ? 'text/plain' : 'text/html';
        
        try {
            str = dt.getData(type);
        } catch(exc) {}
        
        var image = html5.customImageClipboard.get(str);
        if (image) {
            callback(null, null, image);
            return;
        }
        
        
        var url = (image === false) ? getImageUrlFromDTItem(type, str) : null;
        callback(null, url, null);
    };
    
    var imgSrcRX = /^<img\s[^<>]*\bsrc\s*=\s*['"]((?:http|data:image)[^'"]+)/;
    var base64urlRX = /^data:image\/(?:bmp|ico|png|gif|jpe?g);base64,.{20}/;
    
    var getImageUrlFromDTItem = function(type, str) {
        if (type && str && (str.length < 8000)) {
            if (type === 'text/html') {
                var match = imgSrcRX.exec(str);
                return match ? match[1] : null;
            }
            if (type === 'text/plain') {
                return base64urlRX.test(str) ? str : null;
            }
        }
        return null;
    };
    
    var cbPrefix = 'cicb:jscp-img-51ebce89b51840b490e5469b5eb59c41#';
    
    html5.customImageClipboard = {
        _lastUrl: '',
        _canvas: null,
        
        _tryBase64: function(canvas) {
            if (canvas.width * canvas.height > 10000) {
                return null;
            }
            var url64 = canvas.toDataURL('image/png');
            return url64.length < 8000 ? url64 : null;
        },
    
        put: function(canvas) {
            this._canvas = null;
            this._lastUrl = '';
            
            if (canvas) {
                var url64 = this._tryBase64(canvas);
                if (url64) {
                    return url64;
                }
                
                var savedCanvas = document.createElement('canvas');
                savedCanvas.width = canvas.width;
                savedCanvas.height = canvas.height;
                var ctx = savedCanvas.getContext('2d');
                ctx.drawImage(canvas, 0, 0);
                
                this._canvas = savedCanvas;
                this._lastUrl = cbPrefix + (new Date()).valueOf();
                return this._lastUrl;
            }
            return '';
        },
        
        get: function(url) {
            if (this._lastUrl === url) {
                return this._canvas;
            }
            if (!url || (url.indexOf(cbPrefix) !== 0) || (url.length > cbPrefix.length + 30)) {
                return false;
            }
            return null;
        }
    };
    
    return html5;
})();

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
var uiUtils = {
    getCoords: function(element, inPage, coords){
        coords = coords || new Rect();
        var r = element.getBoundingClientRect();
        coords.set(Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom));
        if (inPage) {
            coords.move(window.pageXOffset, window.pageYOffset);
        }
        return coords;
    },
    
    setStyle: function(element, obj) {
        this.copy(obj, element.style, true);
    },
    
    setPos: function(element, left, top) {
        if (left && (typeof left === 'object')) {
            top = (left.top || left.y || 0);
            left = (left.left || left.x || 0);
        }
        if (element) {
            element.style.left = left + 'px';
            element.style.top = top + 'px';
        }
    },
    
    setSize: function(element, obj) {
        if (element && obj) {
            element.style.width = ((typeof obj.width === 'function') ? obj.width() : (obj.width || 0)) + 'px';
            element.style.height = ((typeof obj.height === 'function') ? obj.height() : (obj.height || 0)) + 'px';
        }
    },
    
    setBound: function(element, rect, parentRect) {
        if (element && rect) {
            this.setPos(element, rect);
            if (parentRect) {
                element.style.right = (parentRect.right - rect.right) + 'px';
                element.style.bottom = (parentRect.bottom - rect.bottom) + 'px';
            } else {
                this.setSize(element, rect);
            }
        }
    },
    
    removeChilds: function(node, buf) {
        while (node.lastChild) {
            if (buf) {
                buf.unshift(node.lastChild);
            }
            node.removeChild(node.lastChild);
        }
        return buf;
    },
    
    createElement: function(descr) {
        if (!descr) {
            return document.createElement('div');
        }
        descr = descr.split('.');
        var elem = document.createElement(descr[0] || 'div');
        if (descr[1]) {
            elem.className = descr[1];
        }
        return elem;
    },
    
    appendChilds: function(node, childs) {
        for (var i = 0; i < childs.length; ++i) {
            node.appendChild(childs[i]);
        }
    },
    
    isParent: function(parent, child) {
        while (child) {
            if (child == parent) {
                return true;
            }
            child = child.parentNode;
        }
        return false;
    },
    
    _addOrRemoveListeners: function(method, node, listeners, capturing) {
        if (!node || !listeners) {
            return;
        }
        method = method + 'EventListener';
        for (var i in listeners) {
            if (listeners.hasOwnProperty(i) && (typeof listeners[i] === 'function')) {
                node[method](i, listeners[i], !!capturing);
            }
        }
    },
    
    addListeners: function(node, listeners, capturing) {
        this._addOrRemoveListeners('add', node, listeners, capturing);
    },
    
    removeListeners: function(node, listeners, capturing) {
        this._addOrRemoveListeners('remove', node, listeners, capturing);
    },
    
    getImageSize: function(image) {
        var sz = image ? { 
            width: image.naturalWidth || image.width,
            height: image.naturalHeight || image.height
        } : null;
        return sz && (typeof sz.width === 'number') ? sz : null;
    },
    
    isTaintedImage: function(imgOrCv) {
        if (!imgOrCv) {
            return false;
        }
        if (imgOrCv.tagName == 'IMG') {
            return utils.isCrossOrigin(location.href, imgOrCv.src);
        }
        if (imgOrCv.tagName == 'CANVAS') {
            try {
                imgOrCv.getContext('2d').getImageData(0, 0, 1, 1);
                return false;
            } catch(exc) {
                return true;
            }
        }
        return false;
    },
    
    isGoodImage: function(imgOrCv) {
        return (imgOrCv && (imgOrCv.nodeType === 1) && /^(?:IMG|CANVAS)$/.test(imgOrCv.tagName) && !uiUtils.isTaintedImage(imgOrCv));
    },
    
    _tempDiv: null,
    createCanvas: function(image, size, scale) {
        size = size || this.getImageSize(image);
        if (!size) {
            return null;
        }
        if (!this._tempDiv) {
            this._tempDiv = document.createElement('div');
        }
        this._tempDiv.innerHTML = utils.applyTemplate('<canvas width="${width}" height="${height}"></canvas>', size);
		var cv = this._tempDiv.firstChild;
        this._tempDiv.removeChild(cv);
        if (this.isGoodImage(image)) {
            graphUtils.copyImage(image, cv, scale);
        }
		return cv;
	},
    
    createNodes: function(html) {
        if (!html) {
            return [];
        }
        if (!this._tempDiv) {
            this._tempDiv = document.createElement('div');
        }
        
        this._tempDiv.innerHTML = html;
        return this.removeChilds(this._tempDiv, []);
	},
    
    bgImageUrl: function(size, color1, color2) {
        var cv = this.createCanvas({width: size * 2, height: size * 2});
        var ctx = cv.getContext('2d');
        ctx.fillStyle = color1;
        ctx.fillRect(0, 0, size, size);
        ctx.fillRect(size, size, size, size);
        ctx.fillStyle = color2;
        ctx.fillRect(0, size, size, size);
        ctx.fillRect(size, 0, size, size);
        return cv.toDataURL('image/png');
    },
    
    getInsertPoint: function(size, parentSize, elem) {
        var point = {x: 0, y: 0};
        if (size.width < parentSize.width) {
            point.x = Math.round((parentSize.width - size.width) / 2);
        }
        if (size.height < parentSize.height) {
            point.y = Math.round((parentSize.height - size.height) / 2);
        }
        return point;
    },
    
    textSplit: function(textarea) {
        var arr = textarea.value.split(/\r?\n/);
        // to-do: breaks
        return arr;
    }
};
var JSCPObject = utils.createClass(EventEmitter, {
    constructor: function(dom, elem) {
        EventEmitter.call(this);
        this._dom = dom;
        this.root = elem;
        
        this._back = null;
        this._front = null;
        this._inner = null;
        
        this._movingTimer = new Timer(800, function() { this.moving(false); }, this, true);
        
        var match = /jscpc-object-([a-z0-9]+)/.exec(elem.className);
        this._objType = match ? match[1] : '';
        
        this._createDOM();
        this.rect = Rect();
        this._setVisible(false);
        this.enableDND(false);
    },
    
    getType: function() {
        return this._objType;
    },
    
    getName: function() {
        return this._objType;
    },
    
    appendChild: function(elem, parent) {
        if (elem && parent) {
            if (parent === 'back') {
                parent = this.getBack();
            }
            if (parent === 'front') {
                parent = this.getFront();
            }
            if (parent === 'inner') {
                parent = this._inner;
            }
            parent.appendChild(elem);
        }
        return elem;
    },
    
    createGrip: function(grip, parent) {
        return this.appendChild(this._dom.createGrip(grip), parent);
    },
    
    _grips: ['t', 'r', 'b', 'l', 'lt', 'rt', 'rb', 'lb'],
    _enabledMove: true,
    _createDOM: function() {
        var childs = uiUtils.removeChilds(this.root, []);
        this.root.innerHTML = '<div class="jscpc-obj_inner jscpc-dashborder"></div>';
        this._inner = this.root.firstChild;
        if (this._enabledMove) {
            this._inner.setAttribute('data-grip', 'move');
        }
        uiUtils.appendChilds(this._inner, childs);
        var grips = this._grips;
        for(var i = 0; i < grips.length; ++i) {
            this._dom.createGrip(grips[i], this._inner, true);
        }
    },
    
    _gripParent: function() {
        return this._inner;
    },
    
    destroy: function() {
        if (!this.root) {
            return;
        }
        this._moveTimer.destroy();
        this.un()._destroy();
        this._dom.removeObject(this.getName());
        this.root.parentNode.removeChild(this.root);
        if (this._back && this._back.parentNode) {
            this._back.parentNode.removeChild(this._back);
        }
        if (this._front && this._front.parentNode) {
            this._front.parentNode.removeChild(this._front);
        }
        this._dom = null;
        this._inner = null;
        this._back = null;
        this._front = null;
        this.root = null;
    },
    
    _setRootAttr: function(name, value, toInner) {
        this.root.setAttribute(name, value);
        if (toInner && this._inner) {
            this._inner.setAttribute(name, value);
        }
        if (this._back) {
            this._back.setAttribute(name, value);
        }
        if (this._front) {
            this._front.setAttribute(name, value);
        }
    },
    
    mode: utils.property('_mode', function(newValue, oldValue) {
        this._setRootAttr('data-mode', newValue);
        this._changeMode(newValue, oldValue);
        //this.emit('mode');
    }),
    
    moving: utils.property('_moving', function(newValue, oldValue) {
        this._setRootAttr('data-moving', newValue, true);
        this._changeMoving(newValue, oldValue);
    }, function(value) {
        this._movingTimer.stop();
    }),
    
    enableDND: utils.property('_enableDND', function(newValue, oldValue) {
        var elem = this._inner || this.root;
        elem.__disabledGrip = !newValue;
        this._setRootAttr('data-hidegrips', !newValue, true);
    }),
    
    getOffsetNode: function() {
        return this._inner || this.root;
    },
    
    visible: function() {
        return this._visible;
    },
    
    _bufRect: Rect(),
    visibleIn: function(rect, thisRect) {
        rect = this._bufRect
            .set(rect || this._dom.getObject('bg').rect)
            .clip(thisRect || this.rect);
        return this._visible && (rect.minSize() > 0);
    },
    
    _setVisible: function(visible) {
        this._visible = visible;
        var display = visible ? '' : 'none';
        this.root.style.display = display;
        if (this._back) {
            this._back.style.display = display;
        }
        if (this._front) {
            this._front.style.display = display;
        }
    },
    
    hide: function() {
        if (this._visible) {
            this._movingTimer.timeout();
            this._beforeHide();
            this._setVisible(false);
            this.rect.zero();
            this._hide();
            this.emit('hide');
        }
        return this;
    },

    show: function(rect) {
        if (!rect) {
            return this;
        }
        rect.clone(this.rect, true).normalize();
        if (this.rect.minSize() < 1) {
            return this.hide();
        }
        this._setBound();
        this._gripParent().setAttribute('data-gripsize', this.rect.minSize() < 22 ? 'small' : 'normal');
        this._setVisible(true);
        this.emit('resize');
        return this;
    },
    
    move: function(dx, dy, timeout) {
        if (this._visible) {
            if (timeout) {
                this.moving(true);
                this._movingTimer.setInterval(timeout).start();
            }
            this.rect.move(dx, dy);
            this.show(this.rect);
        }
        return this;
    },
    
    getBack: function() {
        if (!this._back) {
            this._back = this._dom.appendChild(this._createBack(), 'back');
            this._back.style.display = this._visible ? '' : 'none';
            var cs = window.getComputedStyle(this._back);
            this._backPosition = cs.getPropertyValue('position');
            this._back.__objectName = this.getName();
        }
        return this._back;
    },
    
    getFront: function() {
        if (!this._front) {
            this._front = this._dom.appendChild(this._createFront(), 'front');
            this._front.style.display = this._visible ? '' : 'none';
            var cs = window.getComputedStyle(this._front);
            this._frontPosition = cs.getPropertyValue('position');
            this._front.__objectName = this.getName();
        }
        return this._front;
    },
    
    _setBound: function() {
        uiUtils.setBound(this.root, this.rect);
        if (this._backPosition === 'absolute') {
            uiUtils.setBound(this._back, this.rect);
        } else {
            uiUtils.setPos(this._back, this.rect);
        }
        if (this._frontPosition === 'absolute') {
            uiUtils.setBound(this._front, this.rect);
        } else {
            uiUtils.setPos(this._front, this.rect);
        }
    },
    
    _createBack: function() {
        var node = uiUtils.createElement('.' + this._backClassName);
        uiUtils.setPos(node, this.rect);
        return node;
    },
    
    _createFront: function() {
        var node = uiUtils.createElement('.' + this._frontClassName);
        uiUtils.setPos(node, this.rect);
        return node;
    },
    
    _backClassName: 'jscpc-objparent',
    _frontClassName: 'jscpc-objparent',
    
    _hide: function() {},
    _beforeHide: function() {},
    _changeMode: function(newValue, oldValue) {},
    _changeMoving: function(newValue, oldValue) {},
    _destroy: function() {}
});

//-----------------------------------------------------------------
var JSCPSelection = utils.createClass(JSCPObject, function(base, baseConstr) {
    return {
        constructor: function(dom, elem) {
            baseConstr.call(this, dom, elem);
            this.getBack();
            this.enableDND(true);
        },
        
        _backClassName: 'jscpc-select-outer',
        
        _changeMode: function(newValue, oldValue) {
            var crop = (newValue == this.MODE_CROP);
            this._inner.setAttribute('data-event-dblclick', crop ? 'applycrop' : '');
            this._inner.setAttribute('data-bordertype', crop ? 'shadow' : 'inner');
        },
        
        MODE_CROP: 'crop',
        MODE_SELECT: 'select'
    };
});

var JSCPCursor = utils.createClass(EventEmitter, {

    constructor: function(cursor, overlay, config) {
        EventEmitter.call(this);
        this.cursor = cursor;
        this._area = cursor.parentNode;
        this._overlay = overlay;
        this._margin = config.margin ? '-' + config.margin + 'px' : '0';
        
        this._hpLeft = 0; 
        this._hpTop = 0;
        
        this._point = { x: 0, y: 0 };
        this._futurePoint = { x: 0, y: 0 };
        
        this.enable(false).visible(true).mode('none').moveInAreaOnly(false);
        
        var th = this;
        this._overlay.onmouseover = function(e) {
            return th._events.mouseover.call(th, e);
        };
        this._overlay.onmousemove = function(e) {
            return th._events.mousemove.call(th, e);
        };
        this._overlay.onmouseout = function(e) {
            return th._events.mouseout.call(th, e);
        };
    },
    
    destroy: function() {
        this.un();
        this._overlay.onmouseover = null;
        this._overlay.onmousemove = null;
        this._overlay.onmouseout = null;
    },
    
    _events: {
        mouseover: function() {
            if (this._mode !== 'none') {
                this._showCursor(true);
            }
        },
        mousemove: function(e) {
            if (this._mode !== 'none') {
                var bound = this._area.getBoundingClientRect();
                this._futurePoint.x = e.clientX - Math.round(bound.left);
                this._futurePoint.y = e.clientY - Math.round(bound.top);
                this._noMoveCursor = true;
                this.emit('mousemove', this._futurePoint);
                this._noMoveCursor = false;
                this._setPos(this._futurePoint.x, this._futurePoint.y);
                this._showCursor(true);
                e.stopPropagation();
            }
        },
        mouseout: function() {
            this._showCursor(false);
        }
    },
    
    _visibleDOM: function() {
        return this._enable && this._visible;
    },
    
    enable: utils.property('_enable', function(value) {
        if (!value) {
            this._showCursor(false);
        }
        this._overlay.style.display = this._visibleDOM() ? '' : 'none';
    }),
    
    visible: utils.property('_visible', function(value) {
        if (!value) {
            this._showCursor(false);
        }
        this._overlay.style.display = this._visibleDOM() ? '' : 'none';
    }),
    
    _setPos: function(x, y) {
        this._point.x = x;
        this._point.y = y;
        if (!this._noMoveCursor) {
            this.cursor.style.left = (this._point.x - this._hpLeft) + 'px';
            this.cursor.style.top = (this._point.y - this._hpTop) + 'px';
        }
    },
    
    setHotPoint: function(left, top) {
        this._hpLeft = left;
        this._hpTop = top;
        if (this.enable()) {
            this._setPos(this._point.x, this._point.y);
        }
        return this;
    },
    
    setSize: function(width, height) {
        this.cursor.style.width = width + 'px';
        this.cursor.style.height = height + 'px';
        return this;
    },
    
    setStyle: function(name, value) {
        this.cursor.style[name] = value;
        return this;
    },
    
    setBG: function(color) {
        this.cursor.style.background = color;
        return this;
    },
    
    setAttrs: function(obj) {
        for (var j in obj) {
            if (obj.hasOwnProperty(j)) {
                this.cursor.setAttribute(j, obj[j]);
            }
        }
        return this;
    },
    
    mode: utils.property('_mode', function(value) {
        this.cursor.setAttribute('data-mode', value);
        if (value === 'none') {
            uiUtils.removeChilds(this.cursor);
            this.setBG('');
        }
    }),
    
    moveInAreaOnly: utils.property('_moveInAreaOnly', function(value) {
        var size = value ? '0' : this._margin;
        this._overlay.style.left = size;
        this._overlay.style.top = size;
        this._overlay.style.right = size;
        this._overlay.style.bottom = size;
    }),
    
    _showCursor: function(show) {
        this.cursor.style.display = show && this._visibleDOM() ? '' : 'none';
    }
});
var JSCPDOM = (function() {

    var objParentNames = ['back', 'front', 'main'];
    
    return utils.createClass(EventEmitter, {

        constructor: function(rootNode, config) {
            EventEmitter.call(this);
            this.config = config;
            this._createDOM(rootNode, config);
            
            this._tempPixelCanvas = uiUtils.createCanvas({ width: 1, height: 1 });
            this._tempPixelCtx = this._tempPixelCanvas.getContext('2d');
            
            this.rect = Rect();
            this.areaRect = Rect();
            this.bgOffset = { left: 0, top: 0 };
            this._delayedResize = false;
            
            
            var elemBG = this.root.querySelector('.jscpc-object-bg');
            var elemObject = this.root.querySelector('.jscpc-object-frame');
            var elemText = this.root.querySelector('.jscpc-object-text');
            var elemSelect = this.root.querySelector('.jscpc-object-select');
            
            this._objects = {
                bg: new JSCPBackground(this, elemBG),
                frame: new JSCPFrame(this, elemObject),
                text: new JSCPTextInput(this, elemText),
                select: new JSCPSelection(this, elemSelect)
            };
            
            var cursor = this.root.querySelector('.jscpc-cursor');
            var overlay = this.root.querySelector('.jscpc-overlay');
            this.cursor = new JSCPCursor(cursor, overlay, config);
            
            this.mode(this.MODE_NORMAL);
            
            this.getBG().on('_eventsBG', this);
            this.getSelection().on('_eventsSelection', this);
            
            this.getBG().replaceCanvas(uiUtils.createCanvas(config));
            this.getBG().resizeByCanvas();
        },
        
        _eventsBG: {
            resize: function() {
                this._resizeOuter();
            }
        },
        _eventsSelection: {
            resize: function() {
                this._resizeOuter();
            },
            hide: function() {
                this._resizeOuter();
            }
        },
        
        destroy: function() {
            this.un();
            for (var i in this._objects) {
                if (this._objects.hasOwnProperty(i)) {
                    this._objects[i].destroy();
                }
            }
            
            if (!this._hasRootParent) {
                this.root.parentNode.removeChild(this.root);
            } else {
                while (this.root.lastChild) {
                    this.root.removeChild(this.root.lastChild);
                }
            }
            
            this.cursor.destroy();
            
            this.cursor = null;
            this.root = null;
            this._layers = null;
            this._objects = null;
        },
        
        _createDOM: function(rootNode, config) {
            this.root = rootNode || document.createElement('div');
            this._hasRootParent = !!this.root.parentNode;
            this.root.className = (this.root.className ? this.root.className + ' ' : '') + 'jscpc-root';
            this.root.style.borderWidth = config.margin + 'px';
            this.root.setAttribute('data-grip', 'root');
            
            this.root.innerHTML = utils.applyTemplate('\
<div class="jscpc-objparent jscpc-objparent-back"></div>\
<div class="jscpc-objparent jscpc-objparent-front"></div>\
<div class="jscpc-overlay"></div>\
<div class="jscpc-area">\
<div class="jscpc-objparent jscpc-objparent-main"">\
<div class="jscpc-object jscpc-object-bg">\
<div class="jscpc-object jscpc-object-frame"></div>\
<div class="jscpc-object jscpc-object-text"></div>\
</div>\
<div class="jscpc-object jscpc-object-select"></div>\
</div>\
<div class="jscpc-cursor"></div>\
</div>\
', config);
            
            this._bgStyle = 'transparent url("' + uiUtils.bgImageUrl(config.bgTileSize, config.bgTileColor1, config.bgTileColor2) + '") 0 0 repeat';
            var area = this.root.querySelector('.jscpc-area');
            area.style.background = this._bgStyle;
            
            this._layers = {
                root: this.root,
                area: area
            };
            for (var i = 0; i < objParentNames.length; ++i) {
                this._layers[objParentNames[i]] = this.root.querySelector('.jscpc-objparent-' + objParentNames[i]);
            }
        },
        
        getAreaCoords: function() {
            var r = this._layers.area.getBoundingClientRect();
            return {
                left: Math.round(r.left),
                top: Math.round(r.top),
                right: Math.round(r.right),
                bottom: Math.round(r.bottom)
            };
        },
        
        appendChild: function(elem, parent) {
            if (elem && parent) {
                if (typeof parent === 'string') {
                    parent = this._layers[parent];
                }
                parent.appendChild(elem);
            }
            return elem;
        },
        
        createGrip: function(grip, parent, childGrip) {
            var p = uiUtils.createElement(childGrip ? 'p.jscpc-grip' : 'p.jscpc-grip jscpc-object-grip');
            p.setAttribute('data-grip', grip);
            return this.appendChild(p, parent);
        },
        
        removeObject: function(objName) {
            delete this._objects[objName];
        },
        
        getObject: function(name, testVisible) {
            var obj = this._objects[name];
            return obj && (!testVisible || obj.visible()) ? obj : null;
        },
        
        getActiveLayer: function() {
            return this.getObject('frame', true) || this.getBG();
        },
        
        getSelection: function(testVisible) {
            return this.getObject('select', testVisible);
        },
        
        getBG: function() {
            return this.getObject('bg');
        },
        /*
        getImageData: function() {
            var obj = this.getObject('frame', true);
            if (!obj) {
                return this.getBG().getImageData();
            } else {
                
                var data = this.getBG().getImageData();
            }
        },
        */
        
        getPixelColor: function(x, y) {
            var bg = this.getBG();
            if (!bg.rect.hasPoint(x, y)) {
                return null;
            }
            var obj = this.getObject('frame', true);
            if (!obj || !obj.rect.hasPoint(x, y)) {
                return bg.getPixelColor(x, y);
            }
            var objColor = obj.getPixelColor(x - obj.rect.left, y - obj.rect.top);
            if (objColor[3] === 255) {
                return objColor;
            }
            if (objColor[3] === 0) {
                return bg.getPixelColor(x, y);
            }
            this._tempPixelCtx.globalCompositeOperation = 'copy';
            this._tempPixelCtx.drawImage(bg.getResizedCanvas(), x, y, 1, 1, 0, 0, 1, 1);
            this._tempPixelCtx.globalCompositeOperation = 'source-over';
            this._tempPixelCtx.drawImage(obj.getResizedCanvas(), x - obj.rect.left, y - obj.rect.top, 1, 1, 0, 0, 1, 1);
            var data = this._tempPixelCtx.getImageData(0, 0, 1, 1);
            return data.data;
        },
        
        _moveObjects: function(left, top) {
            var offset = this.bgOffset;
            
            if ((offset.left !== left) || (offset.top !== top)) {
                offset.left = left;
                offset.top = top;
                for (var i = 0; i < objParentNames.length; ++i) {
                    uiUtils.setPos(this._layers[objParentNames[i]], offset);
                }
            }
        },

        _resizeOuter: function() {
            if (this.mode() == this.MODE_SELECTING) {
                this._delayedResize = true;
                return;
            }
            this._delayedResize = false;
            var rect = this.getBG().rect;
            var selection = this.getSelection(true);
            if (selection && (selection.mode() == selection.MODE_CROP)) {
                rect = rect.clone().union(selection.rect);
            }
            
            var left = rect.left < 0 ? -rect.left : 0;
            var top = rect.top < 0 ? -rect.top : 0;
            this._moveObjects(left, top);
            
            var w = rect.width(), h = rect.height();
            var resize = false, resizing = false;
            var modeResizing = (this.mode() == this.MODE_RESIZING);
            
            if ((this.areaRect.right !== w) || (this.areaRect.bottom !== h)) {
                resizing = modeResizing;
                this.areaRect.set(w, h);
                this._layers.area.style.width = w + 'px';
                this._layers.area.style.height = h + 'px';
            }
            
            if ((this.mode() !== this.MODE_RESIZING) &&
               ((this.rect.right !== w) || (this.rect.bottom !== h))) {
                resize = true;
                this.rect.set(w, h);
                this.root.style.width = w + 'px';
                this.root.style.height = h + 'px';
            }
            if (resizing || resize) {
                this.emit(resize ? 'resize' : 'resizing');
            }
        },
        
        getGrip: function(node, params) {
            params = params || {};
            params.move = (params.move !== false);
            params.resize = (params.resize !== false);
            params.root = (params.root !== false);
            if (params.move || params.resize) {
                while (node && (node != this.root)) {
                    var parentNode = node.parentNode;
                    var disabled = node.__disabledGrip || (parentNode && parentNode.__disabledGrip);
                    if (!disabled) {
                        var grip = node.getAttribute('data-grip');
                        if (grip == 'none') {
                            return null;
                        }
                        if (grip == 'root') {
                            return params.root ? { node: node, grip: grip } : null;
                        }
                        if (grip) {
                            if ((grip == 'move') && !params.move) {
                                continue;
                            }
                            if (!params.resize) {
                                continue;
                            }
                            return { node: node, grip: grip };
                        }
                    }
                    node = parentNode;
                }
            }
            return params.root ? { node: this.root, grip: 'root' } : null;
        },
        
        getObjectByNode: function(node) {
            while(node && (node != this.root)) {
                if (/jscpc-object\b/.test(node.className)) {
                    for (var i in this._objects) {
                        if (this._objects.hasOwnProperty(i)) {
                            var obj = this._objects[i];
                            if (obj.root == node) {
                                return obj;
                            }
                        }
                    }
                    return null;
                }
                if (node.__objectName) {
                    return this.getObject(node.__objectName);
                }
                node = node.parentNode;
            }
            return null;
        },
        
        showSystemCursor: utils.property('_showSystemCursor', function(value) {
            this.root.setAttribute('data-systemcursor', value);
        }),
        
        MODE_NORMAL: 0,
        MODE_SELECTING: 1,
        MODE_RESIZING: 2,
        
        mode: utils.property('_mode', function(newValue, oldValue) {
            this._layers.area.setAttribute('data-resizing', newValue == this.MODE_RESIZING);
            if (oldValue == this.MODE_RESIZING) {
                this._resizeOuter();
            } else if ((oldValue == this.MODE_SELECTING) && this._delayedResize) {
                var sel = this.getSelection(true);
                if (sel) {
                    sel.show(sel.rect);
                } else {
                    this._resizeOuter();
                }
            }
        })
    });
})();
var KeyManager = (function() {

    /*
    events: 
        copy
        cut
        pasteImage
        del
        enter
        move
        escape
        requestCopyData
    */
    
    var Class = utils.createClass(EventEmitter, {
        constructor: function(config) {
            EventEmitter.call(this);
            this._config = config;
            this._kbEvents = utils.bindAll(this._kbEvents, this);
            this._createDOM();
            
            //this._focusByTimer = utils.bind(this.focus, this);
            this._focusTimer = new Timer(300, this.focus, this, true);
        },
        
        destroy: function() {
            this.un();
            this._focusTimer.stop();
            uiUtils.removeListeners(this._kbHandler, this._kbEvents);
            this._parent.parentNode.removeChild(this._parent);
            this._parent = null;
            this._kbEvents = null;
            this._kbHandler = null;
        },
        
        _createDOM: function() {
            this._parent = uiUtils.createElement('.jscpc-kbparent');
            document.body.appendChild(this._parent);
            this._replaceHandler(false);
        },
        
        _replaceHandler: function(focus) {
            //console.log('_replaceHandler', focus);
            uiUtils.removeListeners(this._kbHandler, this._kbEvents);
            this._kbHandler = uiUtils.createElement('.jscpc-kb-handler');
            this._kbHandler.setAttribute('contenteditable', 'true');
            this._parent.appendChild(this._kbHandler);
            uiUtils.addListeners(this._kbHandler, this._kbEvents);
            if (focus !== false) {
                //console.log('restart timer');
                this._focusTimer.stop().start();
            }
        },
        
        _kbEvents: {
            paste: function(e) {
                html5.getImageFromEvent(e, this._pasteImage, this, this._replaceHandler);
            },
            
            copy: function(e) {
                this._handleCopyEvent(e);
            },
            
            cut: function(e) {
                if (this._handleCopyEvent(e)) {
                    this.emit('del', { event: e });
                }
            },
            
            keydown: function(e) {
                var param;
                e = e || window.event;
                var eventData = keyCodeMap[e.keyCode];
                if (eventData) {
                    if (eventData.preventDefault) {
                        e.preventDefault();
                    } else {
                        //setTimeout(this._focusByTimer, 100);
                        this._focusTimer.stop().start();
                    }
                    if (!eventData.cmdKeyTest || e.ctrlKey || e.metaKey) {
                        param = { event: e };
                        if (eventData.command === 'move') {
                            param.direction = moveCodeMap[e.keyCode];
                        }
                        this.emit(eventData.command, param);
                    }
                    return;
                }
                //setTimeout(this._focusByTimer, 300);
                this._focusTimer.stop().start();
            }
        },
        
        _handleCopyEvent: function(e) {
            var text = this.emit('requestCopyData', e.type, true);
            if (text) {
                if (this._insertToCB(text, e) === false) {
                    e.preventDefault();
                }
                return true;
            }
            return false;
        },
        
        _setSelection: function() {
            if (!this._kbHandler) {
                return;
            }
            if (!this._kbHandler.firstChild || this._kbHandler.firstChild.nextSibling || (this._kbHandler.firstChild.nodeType != 3)) {
                this._kbHandler.innerHTML = '1';
            } else {
                if (!this._kbHandler.firstChild.data || (this._kbHandler.firstChild.data.length > 5)) {
                    this._kbHandler.firstChild.data = '1';
                }
            }
            //console.log(this._kbHandler.firstChild);
            try {
                window.getSelection().selectAllChildren(this._kbHandler);
            } catch(exc) {
                //console.log('********* error getSelection **********');
            }
        },
        
        focus: function() {
            if (!this._focusTimer.started()) {
                this._setSelection();
                this._kbHandler.focus();
            }
        },
        
        _insertToCB: function(data, event) {
            if (event.clipboardData && event.clipboardData.setData) {
                try {
                    event.clipboardData.setData('text/plain', data);
                    return false;
                } catch (exc1) {}
            }
            
            if (window.clipboardData && window.clipboardData.setData) {
                try {
                    if (window.clipboardData.setData('Text', data)) {
                        return false;
                    }
                } catch (exc2) {}
            }
            
            this._kbHandler.innerHTML = data;
            window.getSelection().selectAllChildren(this._kbHandler);
            this._focusTimer.stop().start();
            //setTimeout(this._focusByTimer, 100);
        },
        
        _pasteImage: function(imgData) {
            if (imgData.img || imgData.url) {
                this.emit('pasteImage', imgData);
            }
        }
    });
    
    var keyCodeMap = {
        /* tab */
        9: { 
            preventDefault: true,
            command: 'tab'
        },
        
        /* tab */
        13: {
            preventDefault: true,
            command: 'enter'
        },
        
        /* escape */
        27: {
            preventDefault: true,
            command: 'escape'
        },
        
        /* delete */
        46: {
            preventDefault: true,
            command: 'del'
        },
        
        /* move */
        37: {
            preventDefault: true,
            command: 'move'
        },
        
        /* a (selectAll) */
        65: {
            preventDefault: true,
            command: 'selectAll',
            cmdKeyTest: true
        },
        
        /* y (redo) */
        89: {
            preventDefault: true,
            command: 'redo',
            cmdKeyTest: true
        },
        
        /* z (undo) */
        90: {
            preventDefault: true,
            command: 'undo',
            cmdKeyTest: true
        }
    };
    
    keyCodeMap[38] = keyCodeMap[39] = keyCodeMap[40] = keyCodeMap[37];
    
    var moveCodeMap = {
        37: { name: 'left', dx: -1, dy: 0 },
        38: { name: 'top', dx: 0, dy: -1 },
        39: { name: 'right', dx: 1, dy: 0 },
        40: { name: 'bottom', dx: 0, dy: 1 }
    };
    
    return Class;
})();
var MouseManager = utils.createClass(EventEmitter, function(base, baseConstr) {
    
    var Class = {
    
        MODE_RECT: 'rect',
        MODE_PATH: 'path',
        MODE_POINT: 'point',
    
        constructor: function(config, dom, root) {
            baseConstr.call(this);
            this._dom = dom;
            this._root = root;
            
            this._fileDNDTimer = new Timer(200, function() {
                this._root.setAttribute('data-dragover', 'false');
            }, this, true);
            
            this._dndConfig = {
                ctx: this,
                distance: 3,
                calcOffset: true
            };

            DND.create(this._root, this._dndEvents, this._dndConfig);
            
            this._rootMouseEvents = utils.bindAll(this._rootMouseEvents, this);
            this._fileDNDEvents = utils.bindAll(this._fileDNDEvents, this);
            
            uiUtils.addListeners(this._root, this._rootMouseEvents);
            uiUtils.addListeners(this._root, this._fileDNDEvents);
            
            this._mode = null;
            this._dndLast = false;
            
            this._modeMap = {};
            this._modeMap[this.MODE_RECT] = (new ModeRect()).init(this, this._dom);
            this._modeMap[this.MODE_PATH] = (new ModePath()).init(this, this._dom);
            this._modeMap[this.MODE_POINT] = (new ModePoint()).init(this, this._dom);
        },
        
        destroy: function() {
            this.un();
            DND.destroy(this._root);
            uiUtils.removeListeners(this._root, this._rootMouseEvents);
            uiUtils.removeListeners(this._root, this._fileDNDEvents);
            this._rootMouseEvents = null;
            this._fileDNDEvents = null;
            this._dndConfig = null;
            this._root = null;
        },
        
        _rootMouseEvents: {
            dblclick: function(e) {
                this._rootMouseEvent(e);
            },
            
            click: function(e) {
                this._rootMouseEvent(e);
            },
            
            mouseup: function(e) {
                this.emit('keyManagerFocus');
            }
        },
        
        _fileDNDEvents: {
            dragenter: function(e) {
            },
            
            dragover: function(e) {
                this._fileDNDTimer.stop().start();
                this._root.setAttribute('data-dragover', 'true');
                e.preventDefault();
            },
            
            dragleave: function(e) {
            },
            
            drop: function(e) {
                e.preventDefault();
                e.stopPropagation();
                this._fileDNDTimer.timeout();
                html5.getImageFromEvent(e, function(imgData) {
                    this._dropImage(imgData, e);
                }, this);
            }
        },
        
        _dropImage: function(imgData, e) {
            if (imgData.img || imgData.url) {
                var area = this._dom.getAreaCoords();
                imgData.point = {
                    x: e.clientX - area.left,
                    y: e.clientY - area.top
                };
                this.emit('dropImage', imgData);
            }
        },
        
        _rootMouseEvent: function(e) {
            if (this._dndLast) {
                this._dndLast = false;
                return;
            }
            var node = e.target;
            var attrName = 'data-event-' + e.type;
            
            while (node && (node != this._root)) {
                var action = node.getAttribute(attrName);
                if (action) {
                    var obj = this._dom.getObjectByNode(node);
                    if (obj) {
                        obj.emit(action, { node: node, event: e });
                    }
                    return;
                }
                node = node.parentNode;
            }
            
            var bound = this._dom.getAreaCoords();
            
            this.emit(e.type, {
                event: e,
                areaX: e.clientX - bound.left,
                areaY: e.clientY - bound.top
            });
        },
        
        _callEventRet: function(event, e) {
            return this._mode[event] ? this._mode[event](e) : this.emit(event, e, true);
        },
        _callEvent: function(event, e) {
            if (this._mode[event]) {
                this._mode[event](e);
                return true;
            }
            return false;
        },
        
        _dndEvents: {
            dndGetOffsetNode: function(e) {
                return this._params
                    ? (this._params.useActiveLayer
                        ? this._dom.getActiveLayer()
                        : this._dom.getBG()).getOffsetNode()
                    : null;
            },
            
            dndMouseDown: function(e) {
                if (!this._mode) {
                    this._dndLast = false;
                    return false;
                }
                if ((e.target.tagName === 'TEXTAREA') || (e.target.tagName === 'INPUT')) {
                    this._dndLast = false;
                    return false;
                }
                var gripInfo = this._dom.getGrip(e.target, {
                    move: this._mode.canMove(),
                    resize: this._mode.canResize(),
                    root: this._mode.canRoot()
                });
                if (!gripInfo) {
                    this._dndLast = false;
                    return false;
                }
                //console.log(gripInfo);
                e.data.mm = {
                    grip: gripInfo.grip,
                    gripNode: gripInfo.node
                };
                if (gripInfo.grip != 'root') {
                    e.data.mm.object = this._dom.getObjectByNode(gripInfo.node);
                }
                //console.log(e.data.mm.object);
                var r = this._callEventRet('dndMouseDown', e);
                if (r !== false) {
                    this._dom.cursor.visible(false);
                } else {
                    this._dndLast = false;
                }
                return r;
            },
            
            dndStart: function(e) {
                return this._callEventRet('dndStart', e);
            },
            
            dndMove: function(e) {
                var grip = e.data.mm.grip;
                var func = 'dndMove' + (grip == 'root' ? 'Root' : (grip == 'move') ? 'Move' : 'Resize');
                this._callEvent(func, e) || this._callEvent('dndMove', e);
                this.emit('dndMove', e);
            },
            
            dndStop: function(e) {
                this._dndLast = true;
                this._callEvent('dndStop', e);
                this.emit('dndStop', e);
            },
            
            dndSkip: function(e) {
                this._dndLast = false;
                this._callEvent('dndSkip', e);
                this.emit('dndSkip', e);
            },
            
            dndMouseUp: function(e) {
                this._dom.cursor.visible(true);
                this._callEvent('dndMouseUp', e);
                this.emit('dndMouseUp', e);
            }
        },
        
        setMode: function(mode, params) {
            mode = this._modeMap[mode];
            if (!mode) {
                return this;
            }
            this._mode = mode;
            this._params = params || {};
            //console.log(params);
            return this;
        },
        
        getParams: function() {
            return this._params;
        }
    };
    
    //--------------------------------------------------------------------------
    var Mode = utils.createClass(null, {
        init: function(mm, dom) {
            this._mm = mm;
            this._dom = dom;
            return this;
        },
        canMove: function() {
            return true;
        },
        canResize: function() {
            return true;
        },
        canRoot: function() {
            return (this.getParams().gripRoot !== false);
        },
        getParams: function() {
            return this._mm.getParams();
        }
    });
    
    var ModeRect = utils.createClass(Mode, {
        dndStart: function(e) {
            var obj = e.data.mm.object;
            e.data.mm.rect = obj ? obj.rect.clone(true) : new Rect();
            if (obj) {
                e.data.mm.startRect = obj.rect.clone(true);
            }
            e.data.mm.startLT = e.data.mm.rect.point();
            return this._mm.emit('dndStart', e, true);
        },
        
        dndMoveRoot: function(e) {
            var params = this.getParams();
            e.data.mm.rect
                .set(e.start.nodeX, e.start.nodeY, true)
                .resize('rb', {
                    resizeType: e.current.shiftKey && params.shiftRootResizeType,
                    x: e.current.nodeX,
                    y: e.current.nodeY,
                    minSize: params.minSize
                })
                .clip(params.rootClip);
        },
        
        dndMoveMove: function(e) {
            var params = this.getParams();
            e.data.mm.rect
                .moveTo(e.data.mm.startLT.x + e.current.nodeX - e.start.nodeX,
                        e.data.mm.startLT.y + e.current.nodeY - e.start.nodeY)
                .into(params.moveIntoRect || e.current.shiftKey && params.shiftMoveIntoRect);
        },
        
        dndMoveResize: function(e) {
            var params = this.getParams();
            e.data.mm.rect.resize(e.data.mm.grip, {
                resizeType: params.resizeResizeType || (e.current.shiftKey && Rect.RT_AVG),
                x: e.current.nodeX,
                y: e.current.nodeY,
                positiveOnly: params.resizePositiveOnly,
                minSize: params.minSize
            });
        }
    });
    
    var ModePath = utils.createClass(Mode, {
        dndMouseDown: function(e) {
            e.data.mm.path = [e.start.nodeX, e.start.nodeY];
            e.data.mm.boundingRect = new Rect(e.start.nodeX, e.start.nodeY, e.start.nodeX + 1, e.start.nodeY + 1);
            return this._mm.emit('dndMouseDown', e, true);
        },
        
        dndMove: function(e) {
            var lastLine = e.data.mm.lastLine = e.data.mm.lastLine || [];
            lastLine[0] = e.old.nodeX;
            lastLine[1] = e.old.nodeY;
            lastLine[2] = e.current.nodeX;
            lastLine[3] = e.current.nodeY;
            e.data.mm.path.push(e.current.nodeX, e.current.nodeY);
            e.data.mm.boundingRect.unionWithPoint(e.current.nodeX, e.current.nodeY, true);
        }
    });
    
    var ModePoint = utils.createClass(Mode, {
        dndMouseDown: function(e) {
            this._mm.emit('mousedown', e);
            return false;
        },
        
        canMove: function() {
            return false;
        },
        canResize: function() {
            return false;
        }
    });

    return Class;
});
var JSCPPicture = utils.createClass(JSCPObject, {
    constructor: function(dom, elem) {
        JSCPObject.call(this, dom, elem);
        this.canvas = null;
        this._resizedCanvas = null;
        this._tempCanvas = null;
    },
    
    _destroy: function() {
        this.canvas = null;
        this._resizedCanvas = null;
        this._tempCanvas = null;
    },
    
    getCanvas: function() {
        return this.canvas;
    },
    
    getContext: function() {
        return this.canvas ? this.canvas.getContext('2d') : null;
    },
    
    getOffsetNode: function() {
        return this._inner;
    },
    
    restoreTempCanvasImage: function(copyClip) {
        var ctx = this._tempCanvas.getContext('2d');
        var oldGCO = ctx.globalCompositeOperation;
        ctx.globalCompositeOperation = 'copy';
        if (copyClip) {
            var sx = copyClip.left,
                sy = copyClip.top,
                sw = copyClip.width(),
                sh = copyClip.height();
                
            ctx.save();
            ctx.beginPath();
            ctx.rect(sx, sy, sw, sh);
            ctx.clip();
            ctx.drawImage(this.getResizedCanvas(), sx, sy, sw, sh, sx, sy, sw, sh);
            ctx.restore();
        } else {
            ctx.drawImage(this.getResizedCanvas(), 0, 0);
        }
        ctx.globalCompositeOperation = oldGCO;
    },
    
    getTempContext: function(copy, copyClip) {
        return this.getTempCanvas(copy, copyClip).getContext('2d');
    },
    
    getTempCanvas: function(copy, copyClip) {
        var size = this.rect.size();
        if (!this._tempCanvas) {
            this._tempCanvas = uiUtils.createCanvas(size);
            this._tempCanvas.className = 'jscpc-tempcanvas';
            this._inner.appendChild(this._tempCanvas);
        } else {
            if (size.width != this._tempCanvas.width) {
                this._tempCanvas.width = size.width;
            }
            if (size.height != this._tempCanvas.height) {
                this._tempCanvas.height = size.height;
            }
        }
        if (copy) {
            this.restoreTempCanvasImage(copyClip);
            this.hideCanvas();
        }
        
        this._tempCanvas.style.display = '';
        return this._tempCanvas;
    },
    
    hideCanvas: function() {
        this.canvas.style.display = 'none';
    },
    
    hideTempCanvas: function() {
        this.canvas.style.display = '';
        if (this._tempCanvas) {
            this._tempCanvas.style.display = 'none';
            this._tempCanvas.style.opacity = 1;
            var ctx = this._tempCanvas.getContext('2d');
            graphUtils.resetGlobals(ctx);
            ctx.clearRect(0, 0, this._tempCanvas.width, this._tempCanvas.height);
        }
    },
    
    SST_DATA: 'data',
    SST_CANVAS: 'canvas',
    
    _calcRectForSlice: function(rect, allowOut) {
        var thisRect = this._bufRect.set(this.rect).move(-this.rect.left, -this.rect.top);
        if (!rect) {
            rect = thisRect;
        } else {
            rect = (allowOut !== false) ? rect : thisRect.clip(rect);
        }
        return Rect.hasArea(rect) ? rect : null;
    },
    
    getImageData: function(rect) {
        rect = this._calcRectForSlice(rect);
        if (rect) {
            var ctx = this.getResizedCanvas().getContext('2d');
            return new graphUtils.ImageData(ctx, rect);
        } else {
            return null;
        }
    },
    
    getSnapshot: function(rect, allowOut) {
        rect = this._calcRectForSlice(rect, allowOut);
        if (rect) {
            var canvas = uiUtils.createCanvas(rect.size());
            var ctx = canvas.getContext('2d');
            ctx.drawImage(this.getResizedCanvas(), -rect.left, -rect.top);
            return canvas;
        } else {
            return null;
        }
    },
    
    getPixelColor: function(x, y) {
        var ctx = this.getResizedCanvas().getContext('2d');
        var data = ctx.getImageData(x, y, 1, 1);
        return data.data;
    },
    
    _testSize: function(canvas) {
        return !canvas || ((this.rect.width() == canvas.width) && (this.rect.height() == canvas.height));
    },
    
    resized: function() {
        var r = this.visible() && !this._testSize(this.canvas);
        if (!r || !this.canvas) {
            this._resizedCanvas = null;
        }
        return r;
    },
    
    getResizedCanvas: function() {
        if (!this.visible() || !this.canvas) {
            this._resizedCanvas = null;
            return null;
        }
        if (this._testSize(this.canvas)) {
            this._resizedCanvas = null;
            return this.canvas;
        }
        if (this._resizedCanvas) {
            if (!this._testSize(this._resizedCanvas)) {
                this._resizedCanvas = null;
            }
        }
        if (!this._resizedCanvas) {
            this._resizedCanvas = uiUtils.createCanvas(this.canvas, this.rect.size(), true);
        }
        return this._resizedCanvas;
    },
    
    clearResizedCanvas: function() {
        this._resizedCanvas = null;
    },
    
    replaceCanvas: function(newCanvas) {
        var oldCanvas = this.canvas;
        this.canvas = newCanvas;
        var parent = this._inner;
        if (oldCanvas) {
            if (newCanvas) {
                parent.replaceChild(newCanvas, oldCanvas);
            } else {
                parent.removeChild(oldCanvas);
            }
        } else {
            if (newCanvas) {
                parent.insertBefore(newCanvas, parent.firstChild);
            }
        }
        this._resizedCanvas = null;
        return oldCanvas;
    },
    
    resizeByCanvas: function(hideIfNoCanvas) {
        this._resizedCanvas = null;
        if (!this.canvas) {
            if (hideIfNoCanvas) {
                this.hide();
            }
            return this;
        }
        return this.show(this.rect.resize('rb', uiUtils.getImageSize(this.canvas)).saveProportions());
    }
});


var JSCPFrame = utils.createClass(JSCPPicture, {
    constructor: function(dom, elem) {
        JSCPPicture.call(this, dom, elem);
        this._inner.setAttribute('data-bordertype', 'outer');
    },
    
    create: function(srcObject, rect, copy) {
        if (!rect || this.visible()) {
            return this;
        }
        srcObject = srcObject || this._dom.getObject('bg');
        var canvas = srcObject.getSnapshot(rect);
        if (!copy) {
            graphUtils.drawImage(srcObject.canvas, rect, true);
        }
        return this.insert(canvas, rect);
    },
    
    insert: function(canvas, rect) {
        this.replaceCanvas(canvas);
        this.show(rect);
        return this;
    },
    
    draw: function(destObject) {
        if (!this.visible()) {
            return this;
        }
        destObject = destObject || this._dom.getObject('bg');
        graphUtils.drawImage(destObject.canvas, this.rect, false, this.getResizedCanvas());
        return this;
    },
    
    remove: function() {
        if (!this.visible()) {
            return this;
        }
        if (this.canvas) {
            this._inner.removeChild(this.canvas);
            this.canvas = null;
        }
        this._resizedCanvas = null;
        return this.hide();
    }
});

//-----------------------------------------------------------------
var JSCPBackground = utils.createClass(JSCPFrame, {
    constructor: function(dom, elem) {
        JSCPPicture.call(this, dom, elem);
    },
    
    _grips: ['r', 'b', 'rb'],
    _enabledMove: false
});
var JSCPTextInput = utils.createClass(JSCPObject, function(base, baseConstr) {

    var bufBorders = [0, 0, 0, 0];
    var bufRect = Rect();
    
    var MIN_SIZE = {
        width: 76,
        height: 40
    };
    
    var SIZE_FOR_MEASURE = {
        width: 4,
        height: 4
    };
    
    var OFFSET = {
        x: 0, y: 0
    };

    return {
        constructor: function(dom, elem) {
            baseConstr.call(this, dom, elem);
            this._font = null;
            this._createAdditionalDOM();
            this._timer = new Timer(200, this._updateSize, this);
            
            this._lastText = null;
            this._lastFont = null;
            this._lastWidth = 0;
            
            var self = this;

            this._onblur = function() {
                self.mode(self.MODE_PREVIEW);
            };
            this._textarea.oninput = function() {
                self._updateSize();
            };
            
            this._textarea.onkeydown = function(e) {
                if (e.keyCode == 9) {
                    e.preventDefault();
                    self.emit('tab');
                    return false;
                }
                if (e.keyCode == 27) {
                    e.preventDefault();
                    self.emit('escape');
                    return false;
                }
            };
            
            this.mode(this.MODE_PREVIEW);
            this.enableDND(true);
        },
        
        _destroy: function() {
            this._textarea.onblur = null;
            this._onblur = null;
            this._timer.stop();
        },
        
        _beforeHide: function() {
            this._textarea.value = '';
            this._clearCanvas();
            this._strings = null;
            this.mode('');
        },
        
        _hide: function() {
            
        },
        
        _grips: [],
        _enabledMove: false,
        
        _frontClassName: 'jscpc-objparent-abs jscpc-objparent-text-front',
        
        _createAdditionalDOM: function() {
            var nodes = uiUtils.createNodes('\
<div class="jscpc-obj_inner jscpc-dashborder" data-bordertype="outer" data-grip="move" data-event-click="beginedit">\
<div class="jscpc-ti_editor"><textarea></textarea></div>\
<div class="jscpc-ti_toolbar" data-grip="none">\
<div class="jscpc-button24 jscpc-image-cancel24" data-event-click="btnclose"></div>\
<div class="jscpc-button24 jscpc-image-ok24" data-event-click="applytext"></div>\
</div>\
</div>\
<div class="jscpc-ti_preview">\
<canvas width="1" height="1"></canvas>\
</div>\
');
        
            this._frontInner = this.appendChild(nodes[0], 'front');
            
            var editor = this._frontInner.querySelector('.jscpc-ti_editor');
            this._textarea = editor.firstChild;
            
            var preview = this.appendChild(nodes[1], 'inner');
            this._canvas = preview.firstChild;
        },
        
        _selfHandlers: {
            btnclose: function() {
                this.hide();
            },
            beginedit: function() {
                this.mode(this.MODE_EDIT);
            }
        },
        
        showAt: function(left, top) {
            this.rect.moveTo(left, top);
            if (this.rect.width() < 1) {
                this.rect.right = left + MIN_SIZE.width;
            }
            if (this.rect.height() < 1) {
                this.rect.bottom = top + MIN_SIZE.height;
            }
            this.show(this.rect);
        },
        
        getMinSize: function() {
            return MIN_SIZE;
        },
        
        getStrings: function() {
            return this._strings;
        },
        
        getText: function() {
            return this._textarea.value;
        },
        
        setFont: function(opts) {
            this.ctxOptions = graphUtils.text.makeTextOptions(opts);
            this.lineHeight = opts.fontSize + 2;
            this._textarea.style.font = this.ctxOptions.font;
            this._textarea.style.lineHeight = this.lineHeight + 'px';
            this._updateUI();
        },
        
        getOffset: function() {
            return OFFSET;
        },
        
        _updateUI: function() {
            if (!this.visible()) {
                return;
            }
            this._updateSize();
            this._previewText();
        },
        
        _clearCanvas: function() {
            //this._canvas.width = this._canvas.width;
            var ctx = this._canvas.getContext('2d');
            ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
        },
        
        _previewText: function() {
            if (!this.visible() || (this.mode() !== this.MODE_PREVIEW)) {
                return;
            }
            if (this._canvas.width < this.rect.width()) {
                this._canvas.width = this.rect.width();
            }
            if (this._canvas.height < this.rect.height()) {
                this._canvas.height = this.rect.height();
            }
            var ctx = this._canvas.getContext('2d');
            ctx.clearRect(0, 0, this.rect.width(), this.rect.height());
            //console.log(this.ctxOptions);
            graphUtils.setOptions(ctx, this.ctxOptions);
            graphUtils.text.drawText(ctx, this._strings, this.getOffset(), this.lineHeight);
        },
        
        _updateSize: function() {
            if (!this.ctxOptions || !this.ctxOptions.font) {
                return;
            }
            var text = this._textarea.value;
            //var width = ...;
            
            if ((this._lastText === text) &&
                (this._lastFont === this.ctxOptions.font)) {
                return;
            }
            
            this._lastText = text;
            this._lastFont = this.ctxOptions.font;
            
            if (text) {
                uiUtils.setSize(this._textarea, SIZE_FOR_MEASURE);
                
                this.rect.setSize('rb', {
                    width: Math.max(this._textarea.scrollWidth, MIN_SIZE.width),
                    height: Math.max(this._textarea.scrollHeight + 5, MIN_SIZE.height)
                });
                //console.log(this._textarea.scrollHeight);
                this._textarea.style.height = this._textarea.style.width = '';
                
            } else {
                this.rect.setSize('rb', MIN_SIZE.width);
            }
            
            this.show(this.rect);
        },
        
        _changeMode: function(newValue, oldValue) {
            if (newValue === 'edit') {
                this._timer.start();
                this._textarea.focus();
                var self = this;
                setTimeout(function() {
                    self._textarea.onblur = self._onblur;
                }, 200);
            } else {
                this._textarea.onblur = null;
            }
            if (newValue === 'preview') {
                this._timer.stop();
                //if (!this._textarea.value) {
                 //   this.hide();
                //} else {
                if (this.visible()) {
                    this._strings = uiUtils.textSplit(this._textarea);
                    this._previewText();
                }
            }
        },
        
        MODE_EDIT: 'edit',
        MODE_PREVIEW: 'preview',
        
        insert: function(rect, text, font) {
            this.select(rect);
            this._textarea.value = text;
            this.setFont(font);
        }
    };
 });
var JSCPVideoInput = utils.createClass(JSCPObject, function(base, baseConstr) {


    return {
        constructor: function(dom, elem) {
            baseConstr.call(this, dom, elem);
            this.enableDND(true);
        },
        
        _changeMode: function(newValue, oldValue) {
        }
    };
});
var BaseCommand = utils.createClass(null, {
    init: function(paint, dom) {
        this._paint = paint;
        this._dom = dom;
        this._init();
    },
    _init: function() {}
});

var SymmetricCommand = utils.createClass(BaseCommand, {
    undo: function() {
        this._action();
    },
    redo: function() {
        this._action();
    },
    _action: function() { }
});

// ----------------------------------------------------------------------------
var ReplaceCanvasCommand = utils.createClass(SymmetricCommand, {
    constructor: function(layerName, canvas) {
        this._layer = layerName;
        this._canvas = canvas;
	},
    _action: function() {
        this._canvas = this._dom.getObject(this._layer).replaceCanvas(this._canvas);
    }
});

//----- objects --------------------------------------------------------
var CreateObjectCommand = utils.createClass(BaseCommand, {
    constructor: function(rect, copy) {
		this._rect = rect;
        this._copy = copy;
	},
    undo: function() {
        var obj = this._dom.getObject('frame');
        if (!this._copy) {
            obj.draw();
        }
        obj.remove(!this._copy);
    },
    redo: function() {
        this._dom.getObject('frame').create(null, this._rect, this._copy);
    }
});

var InsertObjectCommand = utils.createClass(BaseCommand, {
    constructor: function(canvas, rect) {
		this._canvas = canvas;
        this._rect = rect;
	},
    undo: function() {
        this._dom.getObject('frame').remove();
    },
    redo: function() {
        this._dom.getObject('frame').insert(this._canvas, this._rect);
    }
});

var RemoveObjectCommand = utils.createClass(BaseCommand, {
    constructor: function(oldRect) {
        this._rect = oldRect && oldRect.clone(true);
	},
    _init: function() {
        var obj = this._dom.getObject('frame');
        this._rect = this._rect || obj.rect.clone(true);
        this._canvas = obj.canvas;
    },
    undo: function() {
        this._dom.getObject('frame').insert(this._canvas, this._rect);
    },
    redo: function() {
        this._dom.getObject('frame').remove();
    }
});

var DrawObjectCommand = utils.createClass(BaseCommand, {
    constructor: function() { },
    _init: function() {
        this._rect = this._dom.getObject('frame').rect.clone(true);
        var bg = this._dom.getBG();
        this._bgCanvas = bg.getSnapshot(this._rect, true);
    },
    undo: function() {
        graphUtils.drawImage(this._dom.getBG().canvas, this._rect, true, this._bgCanvas);
    },
    redo: function() {
        this._dom.getObject('frame').draw();
    }
});

var MoveObjectCommand = utils.createClass(BaseCommand, {
    constructor: function(objectName, newRect, oldRect) {
        this._objectName = objectName;
        this._newRect = newRect.clone(true).normalize();
        this._oldRect = oldRect && oldRect.clone(true).normalize();
	},
    _init: function() {
        this._oldRect = this._oldRect || this._dom.getObject(this._objectName).rect.clone(true);
    },
    undo: function() {
        this._dom.getObject(this._objectName).show(this._oldRect);
    },
    redo: function() {
        this._dom.getObject(this._objectName).show(this._newRect);
    },
    appendCommand: function(cmd) {
        this._newRect = cmd._newRect;
        return true;
    }
});

//-----------------------------------------------------
var ParentCommand = utils.createClass(BaseCommand, {
    constructor: function(innerCommand) {
        this._innerCommand = innerCommand;
	},
    
    _init: function() {
        this._innerCommand.init(this._paint, this._dom);
    },
    
    undo: function() {
        this._innerCommand.undo();
        this._innerCommand.done = false;
    },
    redo: function() {
        this._innerCommand.redo();
        this._innerCommand.done = true;
    },
    
    replaceInnerCommand: function(innerCommand) {
        var done = this.done;
        if (done) {
            this.undo();
        }
        this._innerCommand = innerCommand;
        this._init();
        if (done) {
            this.redo();
        }
    }
});

//--------------------------------------------------------------
var ToolCommand = utils.createClass(BaseCommand, {
    setConfig: function(objName, rect, options) {
        this._objName = objName;
        this._rect = rect;
        this._options = options;
        return this;
    },
    undo: function() {
        if (this._snapshot) {
            var ctx = this._dom.getObject(this._objName).canvas.getContext('2d');
            ctx.putImageData(this._snapshot.getData(), this._rect.left, this._rect.top);
        }
    },
    redo: function() {
        if (!this._snapshot) {
            this._snapshot = this._dom.getObject(this._objName).getImageData(this._rect);
        }
        var obj = this._dom.getObject(this._objName);
        var ctx = obj.canvas.getContext('2d');
        graphUtils.setOptions(ctx, this._options);
        this._apply(ctx);
        graphUtils.resetGlobals(ctx);
    },
    
    _apply: function(ctx) { }
});

var PrintCommand = utils.createClass(ToolCommand, {
    constructor: function(imgData, x, y) {
        this._imgData = imgData;
        this._isImageOrCanvas = !!imgData.tagName;
        if (!this._isImageOrCanvas && this._imgData.isImageDataWrapper) {
            this._imgData = this._imgData.getData();
        }
        this._x = x;
        this._y = y;
    },
    _apply: function(ctx) {
        if (this._isImageOrCanvas) {
            ctx.drawImage(this._imgData, this._x, this._y);
        } else {
            //ctx.globalCompositeOperation = 'copy';
            ctx.putImageData(this._imgData, this._x, this._y);
            //graphUtils.resetGlobals(ctx);
        }
    }
});

var CommandRunner = utils.createClass(null, {
    constructor: function(config, paint) { 
        this._paint = paint;
        this._config = config;
        
        this.historyEventEmitter = new EventEmitter();
        this.history = new CommandHistory(config.historyLimit, this.historyEventEmitter);
    },
    
    setDOM: function(dom) {
        if (!this._dom) {
            this._dom = dom;
            this.historyEventEmitter.on('_eventsHistory', this);
        }
    },
    
    destroy: function() {
        this.historyEventEmitter.un();
        this.history.clear();
        
        this.historyEventEmitter = null;
        this._paint = null;
        this.history = null;
        this._dom = null;
    },
    
    _eventsHistory: {
        changing: function() {
            this._dom.getSelection().hide();
        }
    },
    
    getHistory: function() {
        var history = utils.proxy(this.history, ['undo', 'redo', 'undoLength', 'redoLength', 'isEmpty', 'clear']);
        EventEmitter.mixin(history);
        this.historyEventEmitter.on('change', function(data) {
            this.emit('change', data);
        }, history);
        return history;
    },
    
    run: function(cmd, groupId) {
        cmd.init(this._paint, this._dom);
        this.history.run(cmd, groupId);
    },
    
    runAll: function(cmds) {
        if (cmds && cmds.length) {
            if (cmds.length > 1) {
                this.history.beginBatch();
            }
            for (var i = 0; i < cmds.length; ++i) {
                if (cmds[i] && cmds[i].init) {
                    this.run(cmds[i]);
                }
            }
            if (cmds.length > 1) {
                this.history.endBatch();
            }
        }
    },

    //--------------------------------------------
    replaceCanvas: function(objName, canvas, newRect) {
        this.history.beginBatch();
        this.run(new ReplaceCanvasCommand(objName, canvas));
        if (newRect) {
            this.moveObject(objName, newRect, null, true);
        }
        this.history.endBatch();
    },
    
    applyResize: function(objName) {
        var obj = this._dom.getObject(objName, true);
        if (obj && obj.resized()) {
            var canvas = obj.getResizedCanvas();
            this.replaceCanvas(objName, canvas);
        }
    },
    
    crop: function(rect) {
        var selection = this._dom.getSelection(true);
        if (!rect && !selection) {
            return;
        }
        rect = Rect.get(rect || selection.rect)
            .clone()
            .normalize()
            .resize('rb', { minSize: this._config._minSize });
    
        this._dom.getSelection().hide();
        this.history.beginBatch();
        
        this.applyResize('bg');
        
        var offsetLeft = rect.left ? -rect.left : 0;
        var offsetTop = rect.top ? -rect.top : 0;
        
        var obj = this._dom.getObject('frame', true);
        if (obj) {
            if (!obj.visibleIn(rect)) {
                this.removeObject(false);
            } else {
                if (offsetLeft || offsetTop) {
                    this.moveObject('frame', obj.rect.clone(true).move(offsetLeft, offsetTop), null, false);
                }
            }
        }
        var bg = this._dom.getBG();
        var canvas = bg.getSnapshot(rect, true);
        this.moveObject('bg', rect.moveTo(0, 0).saveProportions(true));
        this.replaceCanvas('bg', canvas);
        
        this.history.endBatch();
    },
    
    _moveFrame: function(newRect, oldRect, groupId) {
        this.run(new MoveObjectCommand(objName, newRect, oldRect));
    },
    
    moveObject: function(objName, newRect, oldRect, testVisible, groupId) {
        var obj = this._dom.getObject(objName, true);
        if (obj && (objName === 'frame') && groupId && obj.visibleIn(null, newRect)) {
            this.run(new MoveObjectCommand(objName, newRect, oldRect), groupId);
            return;
        }
        this.history.beginBatch();
        if (objName === 'bg') {
            var frm = this._dom.getObject('frame', true);
            if (frm && !frm.visibleIn(newRect)) {
                this.run(new RemoveObjectCommand());
            }
        }
        if (obj) {
            if ((testVisible !== false) && (objName !== 'bg') && !obj.visibleIn(null, newRect)) {
                this.run(new RemoveObjectCommand(oldRect));
            } else {
                this.run(new MoveObjectCommand(objName, newRect, oldRect));
            }
        }
        this.history.endBatch();
    },
    
    drawObject: function() {
        if (this._dom.getObject('frame', true)) {
            this.history.beginBatch();
            this.applyResize('bg');
            this.run(new DrawObjectCommand());
            this.history.endBatch();
        }
    },
    
    removeObject: function(draw) {
        if (this._dom.getObject('frame', true)) {
            this.history.beginBatch();
            if (draw) {
                this.drawObject();
            }
            this.run(new RemoveObjectCommand());
            this.history.endBatch();
        }
    },
    
    createObject: function(rect, copy) {
        var selection = this._dom.getSelection(true);
        if (!rect && !selection) {
            return;
        }
        if (rect === 'all') {
            rect = this._dom.getBG().rect.clone().saveProportions(true);
        } else {
            rect = Rect.get(rect || selection.rect).clone().normalize().saveProportions();
        }
        
        this._dom.getSelection().hide();
        this.history.beginBatch();
        this.applyResize('bg');
        this.removeObject(true);
        if (rect.minSize() > 0) {
            this.run(new CreateObjectCommand(rect, copy));
        }
        this.history.endBatch();
    },
    
    insertImage: function(image, point, size) {
        this._dom.getSelection().hide();
        var canvas = uiUtils.createCanvas(image);
        
        this.history.beginBatch();
        this.removeObject(true);
        
        var parentRect = this._dom.getBG().rect;
        if ((size.width > parentRect.width()) || (size.height > parentRect.height())) {
            var rect = Rect(size.width, size.height).union(parentRect);
            this.crop(rect);
        }
        
        parentRect = this._dom.getBG().rect;
        var parentSize = parentRect.size();
        
        if (!point) {
            point = uiUtils.getInsertPoint(size, parentSize, this._dom.root);
        } else {
            point.x = Math.min(Math.max(point.x, 0), parentRect.width() - size.width);
            point.y = Math.min(Math.max(point.y, 0), parentRect.height() - size.height);
        }
        
        this.run(new InsertObjectCommand(canvas, Rect(point, size).saveProportions()));
        this.history.endBatch();
    },
    
    newImage: function(size, image) {
        this._dom.getSelection().hide();
        this.history.beginBatch();
        this.removeObject(false);
        this.moveObject('bg', Rect(size).saveProportions());
        this.replaceCanvas('bg', uiUtils.createCanvas(image, size));
        this.history.endBatch();
    },
    
    runToolCommand: function(objName, command) {
        this.history.beginBatch();
        this.applyResize(objName);
        this.run(command);
        this.history.endBatch();
    }
});
var BaseTool = utils.createClass(null, {
    constructor: function() {
        this._toolStarted = false;
    },
    
    _bufRect: new Rect(),
    
    init: function(config, paint, runner, dom, mouseMgr, keyMgr) {
        this._config = config;
        this._paint = paint;
        this._runner = runner;
        this._dom = dom;
        this._mouseMgr = mouseMgr;
        this._keyMgr = keyMgr;
        this._init();
    },
    destroy: function() {
        this.end();
        this._destroy();
        this._config = null;
        this._runner = null;
        this._dom = null;
        this._mouseMgr = null;
        this._keyMgr = null;
    },
    begin: function() {
        if (!this._toolStarted) {
            this._mouseMgr.on('_mouseHandlers', this);
            this._keyMgr.on('_keyHandlers', this);
            this._paint.tools.options.on('_toolOptionsHandlers', this);
            this._dom.cursor.on('_cursorHandlers', this);
            this._toolStarted = true;
            this._begin();
        }
    },

    end: function() {
        if (this._toolStarted) {
            this._toolStarted = false;
            this._end();
            this._mouseMgr.un('_mouseHandlers', this);
            this._keyMgr.un('_keyHandlers', this);
            this._paint.tools.options.un('_toolOptionsHandlers', this);
            this._dom.cursor.un('_cursorHandlers', this);
        }
    },
    // virtual functions
    _toolOptionsHandlers: null,
    _keyHandlers: null,
    _mouseHandlers: null,
    _cursorHandlers: null,
    _init: function() {},
    _destroy: function() {},
    _begin: function() {},
    _end: function() {}
});

Rect.prototype.toolResultRect = (function() {
    var bufRectObj = new Rect();
    
    return function(layer, lineWidth) {
        var expWidth = lineWidth ? Math.round(lineWidth / 1.414 + 2) : 1;
        return this
            .normalize()
            .expand(expWidth)
            .clip(bufRectObj.set(layer.rect).moveTo(0, 0));
    };
})();
var BGResizeTool = utils.createClass(BaseTool, {
    constructor: function() {
        BaseTool.call(this);
    },
    
    _mouseHandlers: {
        dndMouseDown: function(e, callback) {
            this._dom.mode(this._dom.MODE_RESIZING).getSelection().hide();
        },
        dndMove: function(e) {
            this._dom.getBG().show(e.data.mm.rect);
        },
        dndStop: function(e) {
            this._runner.moveObject('bg', e.data.mm.rect.saveProportions(), e.data.mm.startRect);
        },
        dndMouseUp: function(e) {
            this._dom.mode(this._dom.MODE_NORMAL);
        }
    },
    
    _begin: function() {
        this._mouseMgr.setMode(this._mouseMgr.MODE_RECT, {
            gripRoot: false,
            minSize: this._config._minSize,
            resizePositiveOnly: true,
            resizeResizeType: Rect.RT_AVG
        });
        this._dom.getSelection().hide();
        this._dom.getBG().enableDND(true);
    },
    
    _end: function() {
        this._dom.mode(this._dom.MODE_NORMAL);
        this._dom.getBG().enableDND(false);
    }
});
var CropTool = utils.createClass(BaseTool, {
    constructor: function() {
        BaseTool.call(this);
    },
    
    _mouseHandlers: {
        dndMouseDown: function(e, callback) {
            var sel = this._dom.mode(this._dom.MODE_SELECTING).getSelection().mode('crop');
            if (e.data.mm.grip == 'root') {
                sel.hide();
            }
        },
        dndMove: function(e) {
            this._dom.getSelection().show(e.data.mm.rect);
        },
        dndMouseUp: function(e) {
            //console.log(e.data);
            this._dom.mode(this._dom.MODE_NORMAL);
        }
    },
    
    _keyHandlers: {
        move: function(e) {
            this._dom.getSelection().move(e.direction.dx, e.direction.dy);
        },
        
        enter: function(e) {
            this._runner.crop();
        },
        
        escape: function(e) {
            this._dom.getSelection().hide();
        }
    },
    
    _selectionHandlers: {
        applycrop: function(e) {
            this._runner.crop();
        }
    },
    
    _begin: function() {
        this._mouseMgr.setMode(this._mouseMgr.MODE_RECT, {
            handleDblClick: true,
            minSize: this._config._minSize,
            shiftMoveIntoRect: this._dom.getBG().rect,
            shiftRootResizeType: Rect.RT_AVG
        });
        this._dom.getSelection().hide().mode('crop').on('_selectionHandlers', this);
    },
    
    _end: function() {
        this._dom.mode(this._dom.MODE_NORMAL).getSelection().hide().un('_selectionHandlers', this);
    }
});
var CurveTool = utils.createClass(BaseTool, function (base, baseConstr) {

    var bufRect = new Rect();

    var BezierCommand = utils.createClass(ToolCommand, {
        constructor: function(points) {
            this._points = points;
        },
        
        _apply: function(ctx) {
            graphUtils.shapes.drawBezier(ctx, this._points);
        }
    });
    
    var ArcCommand = utils.createClass(ToolCommand, {
        constructor: function(arc) {
            this._arc = arc;
        },
        
        _apply: function(ctx) {
            this._arc.draw(ctx);
        }
    });
    
    var EditCommand = utils.createClass(BaseCommand, {

        setConfig: function(toolOptions, rect, objName) {
            this._toolOptions = toolOptions;
            this._objName = objName;
            this._ctxOptions = null;
            this._canDraw = false;
            this._grips = null;
            this._rect = new Rect();
            
            this._movingTimer = new Timer(100, function() {
                this.setMoving(false);
            }, this, true);
            
            this._calcInitPoints(rect, toolOptions.curve);
        },
        
        _init: function() {
            this._calcRect();
        },
        
        undo: function() {
            for (var i = 0; i < this._grips.length; ++i) {
                this._grips[i].parentNode.removeChild(this._grips[i]);
            }
            this._grips = null;
            this._dom.getObject(this._objName).hideTempCanvas();
        },
        
        redo: function() {
            var obj = this._dom.getObject(this._objName);
            this._grips = [];
            var pointNum = 0;
            for (var i = 0; i < this._points.length; i += 2) {
                var grip = obj.createGrip('move', 'front');
                grip.__pointNum = pointNum++;
                uiUtils.setPos(grip, this._points[i], this._points[i + 1]);
                this._grips.push(grip);
            }
            
            this._createOptions();
            this._draw();
        },
        
        setMoving: function(moving) {
            if (this._grips) {
                for (var i = 0; i < this._grips.length; ++i) {
                    this._grips[i].setAttribute('data-moving', moving);
                }
            }
        },
        
        createResultCommand: function() {
            this._createOptions();
            var command = this._createResultCommand();
            return command.setConfig(this._objName, this._rect, this._ctxOptions);
        },
        
        changeOptions: function() {
            if (this.done) {
                this._createOptions();
                this._draw();
            }
        },
        
        _updateGrips: function() {
            for (var j = 0; j < this._grips.length; ++j) {
                uiUtils.setPos(this._grips[j], this._points[j * 2], this._points[j * 2 + 1]);
            }
        },
        
        changePoint: function(i, left, top) {
            this._setNewPointPos(i, left, top);
            if (this.done) {
                this._updateGrips();
                this._draw();
            }
            this._calcRect();
        },
        
        movePoints: function(dx, dy, timeout) {
            if (dx || dy) {
                if (timeout) {
                    this.setMoving(true);
                    this._movingTimer.stop().setInterval(timeout).start();
                }
                for (var i = 0; i < this._points.length; i += 2) {
                    this._points[i] = this._points[i] + dx;
                    this._points[i + 1] = this._points[i + 1] + dy;
                }
                if (this.done) {
                    this._updateGrips();
                    this._draw();
                }
                this._calcRect();
            }
        },
        
        _calcRect: function() {
            this._calcRectByCurveData(this._rect);
            this._rect.toolResultRect(this._dom.getObject(this._objName), this._toolOptions.lineWidth);
        },
        
        _createOptions: function() {
            this._ctxOptions = graphUtils.shapes.makeLineOptions(this._toolOptions, false, this._dom.getObject(this._objName).rect);
        },
        
        _draw: function() {
            if (this._canDraw) {
                var ctx = this._dom.getObject(this._objName).getTempContext();
                
                ctx.clearRect(this._rect.left, this._rect.top, this._rect.width(), this._rect.height());
                graphUtils.setOptions(ctx, this._ctxOptions);
                this._drawCurve(ctx);
            } else {
                this._canDraw = true;
            }
        },
        
        //------- virtuals -------------------------
        
        _calcInitPoints: function(rect, type) {},
        _setNewPointPos: function(i, left, top) {
            this._points[i * 2] = left;
            this._points[i * 2 + 1] = top;
        },
        _calcRectByCurveData: function(rect) {},
        _drawCurve: function(ctx) {},
        _createResultCommand: function() {}
    });
    
    var BezierEditCommand = utils.createClass(EditCommand, {
        _calcInitPoints: function(rect, type) {
            this._points = [rect.left, rect.top];
            if (/^bezier([23])$/.test(type)) {
                var n = parseInt(RegExp.$1, 10);
                for (var i = 1; i < n; ++i) {
                    this._points.push(
                        Math.round(((n - i) * rect.left + i * rect.right) / n),
                        Math.round(((n - i) * rect.top + i * rect.bottom) / n)
                    );
                }
            }
            this._points.push(rect.right, rect.bottom);
        },
        
        _calcRectByCurveData: function(rect) {
            rect.fromPoints(this._points, true);
        },
        
        _drawCurve: function(ctx) {
            graphUtils.shapes.drawBezier(ctx, this._points);
        },
        
        _createResultCommand: function() {
            return new BezierCommand(this._points);
        }
    }, {
        drawByRect: function(ctx, rect) {
            graphUtils.shapes.drawLine(ctx, rect);
        },
        
        calcClearRect: function(rect, result) {
            result.set(rect);
        }
    });
    
    var ArcData = utils.createClass(EditCommand, {
        constructor: function(rect) {
            if (rect) {
                this.set(rect);
            }
        },
        set: function(rect) {
            this.raduis = rect.diagonal();
            this.angles = this.angles || [];
            this.angles[0] = 0;
            this.angles[1] = rect.angle() || 2 * Math.PI;
            this.points = this.points || [];
            this.points[0] = rect.left;
            this.points[1] = rect.top;
            this.points[2] = rect.left + Math.round(this.raduis);
            this.points[3] = rect.top;
            this.points[4] = rect.right;
            this.points[5] = rect.bottom;
            return this;
        },
        draw: function(ctx) {
            ctx.beginPath();
            ctx.arc(this.points[0], this.points[1], this.raduis, this.angles[0], this.angles[1]);
            ctx.stroke();
        },
        calcRect: function(result) {
            var r = Math.ceil(this.raduis),
                cx = this.points[0],
                cy = this.points[1];
            result.set(cx - r, cy - r, cx + r, cy + r);
        }
    });
    
    var ArcEditCommand = utils.createClass(EditCommand, {
        _calcInitPoints: function(rect) {
            this._arc = new ArcData(rect);
            this._points = this._arc.points;
        },
        
        _setNewPointPos: function(i, left, top) {
            if (i === 0) {
                this.movePoints(left - this._points[0], top - this._points[1]);
            } else {
                this._points[i * 2] = left;
                this._points[i * 2 + 1] = top;
                this._arc.raduis = Rect.diagonal(this._points[0], this._points[1], left, top);
                var angle = Rect.angle(this._points[0], this._points[1], left, top);
                this._arc.angles[i - 1] = (i === 2 && !angle) ? 2 * Math.PI : angle;
                var j = 3 - i;
                this._points[j * 2] = this._points[0] + Math.round(this._arc.raduis * Math.cos(this._arc.angles[j - 1]));
                this._points[j * 2 + 1] = this._points[1] + Math.round(this._arc.raduis * Math.sin(this._arc.angles[j - 1]));
            }
        },
        
        _calcRectByCurveData: function(rect) {
            this._arc.calcRect(rect);
        },
        
        _drawCurve: function(ctx) {
            this._arc.draw(ctx);
        },
        
        _createResultCommand: function() {
            return new ArcCommand(this._arc);
        }
        
    }, {
        _arcBuf: new ArcData(),
        drawByRect: function(ctx, rect) {
            this._arcBuf.set(rect).draw(ctx);
        },
        
        calcClearRect: function(rect, result) {
            this._arcBuf.set(rect).calcRect(result);
        }
    });
    
//--------- tool -----------------------------------------------------------------

    return {
        constructor: function() {
            baseConstr.call(this);
            this._editCmd = null;
            this._parentCmd = null;
        },
        
        _mouseHandlers: {
            dndMouseDown: function(e, callback) {
                if (e.data.mm.grip == 'root') {
                    this._apply()
                } else {
                    this._editCmd.setMoving(true);
                }
            },
            dndStart: function(e) {
                //this._dom.getSelection().hide();
                if (e.data.mm.grip == 'root') {
                    var opts = this._paint.tools.options.getData(true);
                    
                    e.data.activeLayer = this._dom.getActiveLayer();
                    e.data.tempCanvas = e.data.activeLayer.getTempCanvas();
                    e.data.tempCtx = e.data.tempCanvas.getContext('2d');
                    e.data.CmdClass = this._getEditCommandClass(opts.curve);
                    e.data.clearRect = new Rect();
                    
                    e.data.toolOptions = graphUtils.shapes.makeLineOptions(opts, false, e.data.activeLayer.rect);
                
                    graphUtils.setOptions(e.data.tempCtx, e.data.toolOptions);
                }
            },
            dndMove: function(e) {
                if (e.data.mm.grip == 'root') {
                    if (e.data.clearRect.minSize() > 0) {
                        e.data.tempCtx.clearRect(e.data.clearRect.left, e.data.clearRect.top, e.data.clearRect.width(), e.data.clearRect.height());
                        e.data.clearRect.zero();
                    }
                    if (e.data.mm.rect.maxSize(true) > 3) {
                        //graphUtils.shapes.drawLine(e.data.tempCtx, e.data.mm.rect);
                        e.data.CmdClass.drawByRect(e.data.tempCtx, e.data.mm.rect);
                        this._calcClearRect(e.data);
                    }
                } else {
                    var pointNum = e.data.mm.gripNode.__pointNum;
                    this._editCmd.changePoint(pointNum, e.current.nodeX, e.current.nodeY);
                }
            },
            dndStop: function(e) {
                if (e.data.mm.grip == 'root') {
                    var object = e.data.activeLayer;
                    var objName = object.getName();
                    
                    var rect = this._calcClearRect(e.data);

                    if ((rect.minSize() > 0) && (e.data.mm.rect.maxSize(true) > 3)) {
                        this._editCmd = new e.data.CmdClass();
                        var opts = this._paint.tools.options.getData(true);
                        this._editCmd.setConfig(opts, e.data.mm.rect, objName);
                        this._parentCmd = new ParentCommand(this._editCmd);
                        
                        this._runner.historyEventEmitter.un('_historyHandlers', this);
                        this._runner.runToolCommand(objName, this._parentCmd);
                        this._runner.historyEventEmitter.on('_historyHandlers', this);
                    }
                }
            },
            dndMouseUp: function(e) {
                if (e.data.mm.grip == 'move') {
                    this._editCmd.setMoving(false);
                }
            }
        },
        
        _calcClearRect: function(eData) {
            eData.CmdClass.calcClearRect(eData.mm.rect, eData.clearRect);
            return eData.clearRect
                .toolResultRect(eData.activeLayer, eData.toolOptions.lineWidth);
        },
        
        _keyHandlers: {
            move: function(e) {
                if (this._parentCmd && this._parentCmd.done) {
                    this._editCmd.movePoints(e.direction.dx, e.direction.dy, 700);
                }
            },
            
            escape: function(e) {
                if (this._parentCmd && this._parentCmd.done) {
                    this._runner.history.undo();
                }
            },
            
            enter: function(e) {
                this._apply();
            }
        },
        
        _toolOptionsHandlers: {
            set: function() {
                if (this._editCmd && this._paint.tools.options.get('curveApplyOptions')) {
                    this._editCmd.changeOptions();
                }
            }
        },
        
        _historyHandlers: {
            redoclear: function() {
                this._endEdit();
            },
            clear: function() {
                this._endEdit();
            },
            running: function() {
                this._apply();
            }
        },
        
        _getEditCommandClass: function(curve) {
            if (/^bezier/.test(curve)) {
                return BezierEditCommand;
            }
            if (curve === 'arc') {
                return ArcEditCommand;
            }
            return BezierEditCommand;
        },
        
        _endEdit: function() {
            if (!this._editCmd) {
                return;
            }
            if (this._editCmd.done) {
                this._apply();
            }
            this._editCmd = this._parentCmd = null;
        },
        
        _apply: function() {
            if (!this._editCmd) {
                return;
            }
            this._parentCmd.replaceInnerCommand(this._editCmd.createResultCommand());
            this._editCmd = this._parentCmd = null;
        },
        
        _begin: function() {
            this._mouseMgr.setMode(this._mouseMgr.MODE_RECT, {
                useActiveLayer: true,
                shiftRootResizeType: Rect.RT_R8
            });
            this._runner.historyEventEmitter.on('_historyHandlers', this);
        },
        
        _end: function() {
            this._runner.historyEventEmitter.un('_historyHandlers', this);
            this._apply();
        }
    };
});
var FillTool = utils.createClass(BaseTool, function (base, baseConstr) {

    return {
        constructor: function() {
            baseConstr.call(this);
            
            this._imageDataMap = { };
        },
        
        _mouseHandlers: {
            mousedown: function(e) {
                var layer = this._dom.getActiveLayer();
                
                if (!layer.rect.hasPoint(e.start.nodeX, e.start.nodeY)) {
                    return;
                }
                
                objName = layer.getName();
                
                var imgData = this._imageDataMap[objName];
                if (!imgData) {
                    this._imageDataMap[objName] = imgData = layer.getImageData();
                }
                
                var opts = this._paint.tools.options.getData(true);
                var color = this._paint.tools.getColor();
                var cmpAlpha = (opts.fillAlpha.charAt(1) === 'y');
                var replaceAlpha = (opts.fillAlpha.charAt(3) === 'y');
                var result = imgData.floodFill(e.start.nodeX - layer.rect.left, e.start.nodeY - layer.rect.top, color, cmpAlpha, replaceAlpha);
                
                if (result) {
                    var image;
                    var ctx = layer.getCanvas().getContext('2d');
                    image = imgData.slice(ctx, result);

                    var command = new PrintCommand(image, result.left, result.top);
                    
                    this._runner.historyEventEmitter.un('_historyHandlers', this);
                    this._runner.runToolCommand(objName, command.setConfig(objName, result, null));
                    this._runner.historyEventEmitter.on('_historyHandlers', this);
                }
            }
        },
        
        _historyHandlers: {
            change: function() {
                this._imageDataMap = { };
            }
        },
        
        _begin: function() {
            this._mouseMgr.setMode(this._mouseMgr.MODE_POINT, {
            });
            this._imageDataMap = { };
            this._runner.historyEventEmitter.on('_historyHandlers', this);
        },
        
        _end: function() {
            this._imageDataMap = { };
            this._runner.historyEventEmitter.un('_historyHandlers', this);
        }
    };
});
var LineTool = utils.createClass(BaseTool, function (base, baseConstr) {

    var LineCommand = utils.createClass(ToolCommand, {
        constructor: function(lineRect) {
            this._lineRect = lineRect;
        },
        _apply: function(ctx) {
            graphUtils.shapes.drawLine(ctx, this._lineRect);
        }
    });
    
    var bufRect = new Rect();
    var bufRectObj = new Rect();
    
    function calcRect(eData) {
        var expWidth = Math.round(eData.toolOptions.lineWidth / 1.414 + 2);
        var object = eData.activeLayer;
        return bufRect
            .set(eData.mm.rect)
            .normalize()
            .expand(expWidth)
            .clip(bufRectObj.set(object.rect).moveTo(0, 0));
    }

    return {
        constructor: function() {
            baseConstr.call(this);
        },
        
        _mouseHandlers: {
            dndStart: function(e) {
                this._dom.getSelection().hide();
                
                var opts = this._paint.tools.options.getData(true);
                e.data.eraser = graphUtils.shapes.isEraser(opts.drawLine);
                e.data.activeLayer = this._dom.getActiveLayer();
                e.data.tempCanvas = e.data.activeLayer.getTempCanvas(e.data.eraser);
                e.data.tempCtx = e.data.tempCanvas.getContext('2d');
                
                e.data.toolOptions = graphUtils.shapes.makeLineOptions(opts, true, e.data.activeLayer.rect);
                
                graphUtils.setOptions(e.data.tempCtx, e.data.toolOptions);
            },
            dndMove: function(e) {
                if (bufRect.minSize() > 0) {
                    if (e.data.eraser) {
                        e.data.activeLayer.restoreTempCanvasImage(bufRect);
                    } else {
                        e.data.tempCtx.clearRect(bufRect.left, bufRect.top, bufRect.width(), bufRect.height());
                    }
                    bufRect.zero();
                }
                if (e.data.mm.rect.maxSize(true)) {
                    graphUtils.shapes.drawLine(e.data.tempCtx, e.data.mm.rect);
                    calcRect(e.data);
                }
            },
            dndStop: function(e) {
                var object = e.data.activeLayer;
                var objName = object.getName();
                
                var rect = calcRect(e.data).clone();

                if ((rect.minSize() > 0) && e.data.mm.rect.maxSize(true)) {
                    var command = new LineCommand(e.data.mm.rect);
                    this._runner.runToolCommand(objName, command.setConfig(objName, rect, e.data.toolOptions));
                }
                
                object.hideTempCanvas();
            }
        },
        
        _begin: function() {
            this._mouseMgr.setMode(this._mouseMgr.MODE_RECT, {
                useActiveLayer: true,
                shiftRootResizeType: Rect.RT_R8
            });
        },
        
        _end: function() {
        }
    };
});
var ToolManager = utils.createClass(EventEmitter, {
    constructor: function(config, paint, runner, keyManager) {
        EventEmitter.call(this);
        
        this._config = config;
        this._paint = paint;
        this._runner = runner;
        this._keyManager = keyManager;
        
        this.options = new JSCPOptions(false, jscpConfig.toolOptionsConfig);
        this.options.on('_optionsHandlers', this);

        this._tool = null;
        this._toolName = '';
        this._toolMap = {};
        
        this._rgba = { };
        this._updateColor('color');
        this._updateColor('fillColor');
    },
    
    setDOM: function(dom, mouseManager) {
        if (!this._dom) {
            this._dom = dom;
            this._mouseManager = mouseManager;
            this._addTool('crop', new CropTool());
            this._addTool('select', new SelectTool());
            this._addTool('bgresize', new BGResizeTool());
            this._addTool('pen', new PenTool(false));
            this._addTool('eraser', new PenTool(true));
            this._addTool('line', new LineTool());
            this._addTool('rect', new ShapeTool('rect'));
            this._addTool('roundrect', new ShapeTool('roundrect'));
            this._addTool('ellipse', new ShapeTool('ellipse'));
            this._addTool('fill', new FillTool());
            this._addTool('picker', new ColorPickerTool());
            this._addTool('curve', new CurveTool());
            this._addTool('text', new TextTool());
        }
    },
    
    destroy: function() {
        this.un();
        this.options.un();
        this._end();
        
        for (var i in this._toolMap) {
            if (this._toolMap.hasOwnProperty(i) && this._toolMap[i]) {
                this._toolMap[i].destroy();
            }
        }
        
        this._toolMap = null;
        this._mouseManager = null;
        this._keyManager = null;
        this._dom = null;
        this._config = null;
        this._paint = null;
        this._runner = null;
    },
    
    _addTool: function(name, tool) {
        if (name && tool && !this._toolMap[name]) {
            this._toolMap[name] = tool;
            tool.init(this._config, this._paint, this._runner, this._dom, this._mouseManager, this._keyManager);
        }
    },
    
    _updateColor: function(name) {
        this._rgba[name] = graphUtils.color.getRGBA(this.options.get(name));
    },
    
    _optionsHandlers: {
        set: function(e) {
            if ((e.name === 'color') || (e.name === 'fillColor')) {
                this._updateColor(e.name);
            }
        }
    },
    
    getColor: function() {
        return this._rgba.color;
    },
    
    getFillColor: function() {
        return this._rgba.fillColor;
    },
    
    current: function(toolName) {
        if (!this._paint) {
            return this;
        }
        if (toolName === undefined) {
            return this._toolName;
        }
        var oldTool;
        if (!toolName) {
            if (this._toolName) {
                oldTool = this._endTool();
                this.emit('change', { name: '', oldName: oldTool });
            }
            return this;
        }
        if ((typeof toolName !== 'string') || !this._toolMap.hasOwnProperty(toolName) || (this._toolName === toolName)) {
            return this;
        }
        oldTool = this._endTool();
        this._paint.filters.cancel();
        this._toolName = toolName;
        this._tool = this._toolMap[toolName];
        this._tool.begin();
        this.emit('change', { name: toolName, oldName: oldTool });
        return this;
    },
    
    _endTool: function() {
        if (this._tool) {
            var toolName = this._toolName;
            this._tool.end();
            this._toolName = '';
            this._tool = null;
            this.emit('end', toolName);
            return toolName;
        }
        return this._toolName;
    }
});

var PenTool = utils.createClass(BaseTool, function (base, baseConstr) {

    var PenCommand = utils.createClass(ToolCommand, {
        constructor: function(path, lineWidth, penForm) {
            this._path = path;
            this._lineWidth = lineWidth;
            this._penForm = penForm;
        },
        _apply: function(ctx) {
            graphUtils.shapes.drawPath(ctx, this._path, this._lineWidth, this._penForm);
        }
    });
    
    var bufRect = new Rect();
    
    function replaceProp(obj, prop, newValue) {
        if (obj && obj.hasOwnProperty(prop)) {
            obj[prop] = newValue;
        }
    }

    return {
        constructor: function(eraser) {
            baseConstr.call(this);
            this._eraser = eraser;
            if (!eraser) {
                this._cursorHandlers = this._cursorHandlersForPen;
            }
        },
        
        _mouseHandlers: {
            dndMouseDown: function(e, sender, callback) {
                this._dom.getSelection().hide();
                var opts = this._paint.tools.options.getData(true);
                var eraser = this._eraser; //graphUtils.shapes.isEraser(opts.drawPen);
                
                e.data.activeLayer = this._dom.getActiveLayer();
                e.data.tempCanvas = e.data.activeLayer.getTempCanvas(eraser);
                e.data.tempCtx = e.data.tempCanvas.getContext('2d');
                
                e.data.toolOptions = graphUtils.shapes.makePenOptions(opts, null, e.data.activeLayer.rect, eraser);
                e.data.lineWidth = opts.lineWidth || 1;
                e.data.penForm = opts.penForm;
                
                var tempCtxOptions = e.data.toolOptions;
                
                if (!eraser) {
                    var colorData = graphUtils.color.extactAlpha(opts.color);
                    if (colorData.alpha < 1) {
                        e.data.tempCanvas.style.opacity = colorData.alpha;
                        tempCtxOptions = graphUtils.shapes.makePenOptions(opts, colorData.color, e.data.activeLayer.rect, eraser);
                    }
                }
                
                graphUtils.setOptions(e.data.tempCtx, tempCtxOptions);
                graphUtils.shapes.drawPath(e.data.tempCtx, e.data.mm.path, e.data.lineWidth, e.data.penForm);
            },
            
            dndMove: function(e) {
                graphUtils.shapes.drawPath(e.data.tempCtx, e.data.mm.lastLine, e.data.lineWidth, e.data.penForm);
            },
            
            dndMouseUp: function(e) {
                var object = e.data.activeLayer;
                var objName = object.getName();
                
                var expWidth = Math.round(e.data.lineWidth / 2 + 2);
                
                var rect = e.data.mm.boundingRect.expand(expWidth).clip(bufRect.set(object.rect).moveTo(0, 0));

                if (rect.minSize() > 0) {
                    //console.log('before compress:', e.data.mm.path.length);
                    graphUtils.shapes.compressPath(e.data.mm.path);
                    //console.log('after compress:', e.data.mm.path.length);
                    var command = new PenCommand(e.data.mm.path, e.data.lineWidth, e.data.penForm);
                    this._runner.runToolCommand(objName, command.setConfig(objName, rect, e.data.toolOptions));
                }
                
                object.hideTempCanvas();
            }
        },

        _cursorHandlersForPen: {
            mousemove: function(pos, cursor) {
                var opts = this._paint.tools.options.getData(true);
                if ((opts.lineWidth >= 3) && opts.drawPattern/* && !graphUtils.shapes.isEraser(opts.drawPen)*/) {
                    //console.log('mm', pos.x);
                    var width = opts.lineWidth;
                    var offset = Math.floor(width / 2);
                    //var obj = this._dom.getActiveLayer();
                    //console.log('-' + (pos.x - offset - obj.rect.left) + 'px -' + (pos.y - offset -  - obj.rect.top) + 'px');
                    cursor.setStyle('backgroundPosition', (offset - pos.x) + 'px ' + (offset - pos.y) + 'px');
                }
            }
        },

        _toolOptionsHandlers: {
            set: function() {
                this._updateCursor();
            }
        },
        
        _updateCursor: function() {
            var opts = this._paint.tools.options.getData(true);
            
            //this._dom.showSystemCursor(opts.lineWidth < 3 || (!opts.drawPattern && !this._eraser));
            if (opts.lineWidth < 3) {
                this._dom.cursor.enable(false);
            } else {
                var width = opts.lineWidth;
                var offset = Math.floor(width / 2);
                var eraser = this._eraser; //graphUtils.shapes.isEraser(opts.drawPen);
                
                var cursorBG = eraser ? 'rgba(255, 255, 255, 0.85)' : opts.color;
                if (!eraser && opts.drawPattern) {
                    cursorBG = 'transparent url(' + 
                        graphUtils.patterns.getPatternUrl(opts.drawPattern, opts.color)
                        + ') 0 0 repeat';
                }
                
                this._dom.cursor
                    .setSize(width, width)
                    .setHotPoint(offset, offset)
                    .mode(opts.penForm + '-' + (eraser ? 'eraser' : 'pen'))
                    .setBG(cursorBG)
                    .enable(true);
            }
        },
        
        _begin: function() {
            this._mouseMgr.setMode(this._mouseMgr.MODE_PATH, {
                useActiveLayer: true
            });
            this._dom.getSelection().hide();
            this._dom.cursor.moveInAreaOnly(false);
            this._updateCursor();
        },
        
        _end: function() {
            //this._dom.showSystemCursor(true);
            this._dom.cursor.enable(false).mode('none');
        }
    };
});
var ColorPickerTool = (function() {
    
    return utils.createClass(BaseTool, {
        constructor: function() {
            BaseTool.call(this);
        },
        
        _getColor: function(x, y) {
            return this._dom.getPixelColor(x, y);
        },
        
        _mouseHandlers: {
            mousedown: function(e) {
                var optName = this._paint.tools.options.get('picker');
                var color = this._getColor(e.start.nodeX, e.start.nodeY);
                if (color) {
                    //console.log(color);
                    this._paint.tools.options.set(optName, graphUtils.color.colorStr(color));
                }
            }
        },
        
        _begin: function() {
            this._mouseMgr.setMode(this._mouseMgr.MODE_POINT, {
                areaOnly: true
            });
        },
        
        _end: function() {
        }
    });
})();
var SelectTool = utils.createClass(BaseTool, {
    constructor: function() {
        BaseTool.call(this);
    },
    
    _mouseHandlers: {
        dndMouseDown: function(e, sender, callback) {
            this._dom.getSelection().mode('select').hide();
            this._runner.history.beginBatch();
            if (e.data.mm.grip === 'root') {
                this._runner.removeObject(true);
            }
            this._dom.getSelection().moving(true);
            this._dom.getObject('frame').moving(true);
            //callback(false); //cancel
        },
        dndStart: function(e) {
            if (e.start.cmdKey && e.data.mm.object && (e.data.mm.object.getType() === 'frame')) {
                this._runner.drawObject();
            }
        },
        dndMove: function(e) {
            var obj = e.data.mm.object || this._dom.getSelection();
            obj.show(e.data.mm.rect);
        },
        dndStop: function(e) {
            if (e.data.mm.object) {
                this._runner.moveObject('frame', e.data.mm.rect.saveProportions(), e.data.mm.startRect, true);
            } else {
                this._runner.createObject(e.data.mm.rect, false);
            }
        },
        dndMouseUp: function(e) {
            this._runner.history.endBatch();
            this._dom.getSelection().moving(false);
            this._dom.getObject('frame').moving(false);
        }
    },
    
    _keyHandlers: {
        move: function(e) {
            var obj = this._dom.getObject('frame', true);
            if (obj) {
                var oldRect = obj.rect.clone(true);
                obj.move(e.direction.dx, e.direction.dy, 800);
                var grp = Math.round((new Date()).valueOf() / 4000);
                this._runner.moveObject('frame', obj.rect, oldRect, true, 'kbfmove' + grp);
            }
        },
        
        del: function(e) {
            this._runner.removeObject(false);
        },
        
        enter: function(e) {
            this._runner.removeObject(true);
        },
        
        requestCopyData: function(e, sender, callback) {
            var obj = this._dom.getObject('frame', true);
            if (obj) {
                var cv = obj.getResizedCanvas();
                if (cv) {
                    var imgData = html5.customImageClipboard.put(cv);
                    callback(imgData);
                }
            }
        }
    },
    
    _minSize: { width: 1, height: 1 },
    
    _begin: function() {
        this._mouseMgr.setMode(this._mouseMgr.MODE_RECT, {
            //minSize: this._config.minSize,
            resizeResizeType: Rect.RT_AVG,
            shiftRootResizeType: Rect.RT_AVG,
            resizePositiveOnly: true,
            minSize: this._minSize,
            rootClip: this._dom.getBG().rect
        });
        this._dom.getSelection().hide().mode('select');
        this._dom.getObject('frame').enableDND(true);
    },
    
    _end: function() {
        this._dom.getObject('frame').enableDND(false);
    }
});
var ShapeTool = utils.createClass(BaseTool, function (base, baseConstr) {

    var ShapeCommand = utils.createClass(ToolCommand, {
        constructor: function(shape, shapeRect, drawShape, shapeOptions) {
            this._shape = shape;
            this._shapeRect = shapeRect;
            this._drawShape = drawShape;
            this._shapeOptions = shapeOptions;
        },
        _apply: function(ctx) {
            graphUtils.shapes.drawShape(ctx, this._shape, this._shapeRect, this._drawShape, this._shapeOptions);
        }
    });
    
    var bufRect = new Rect();
    var bufRectObj = new Rect();
    
    function calcRect(eData) {
        var expWidth = Math.round(eData.toolOptions.lineWidth / 1.414 + 2);
        var object = eData.activeLayer;
        return bufRect
            .set(eData.mm.rect)
            .normalize()
            .expand(expWidth)
            .clip(bufRectObj.set(object.rect).moveTo(0, 0));
    }

    return {
        constructor: function(shape) {
            baseConstr.call(this);
            this._shape = shape;
        },
        
        _mouseHandlers: {
            dndStart: function(e) {
                this._dom.getSelection().hide();
                
                var opts = this._paint.tools.options.getData(true);
                e.data.eraser = graphUtils.shapes.isEraser(opts.drawShape);
                e.data.drawShape = opts.drawShape;
                e.data.activeLayer = this._dom.getActiveLayer();
                e.data.tempCanvas = e.data.activeLayer.getTempCanvas(e.data.eraser);
                e.data.tempCtx = e.data.tempCanvas.getContext('2d');
                
                e.data.shapeOptions = {
                    rectRadius: opts.rectRadius
                };
                
                e.data.toolOptions = graphUtils.shapes.makeShapeOptions(opts, this._shape, e.data.activeLayer.rect);
                //console.log(e.data.toolOptions);
                
                graphUtils.setOptions(e.data.tempCtx, e.data.toolOptions);
            },
            dndMove: function(e) {
                if (bufRect.minSize() > 0) {
                    if (e.data.eraser) {
                        e.data.activeLayer.restoreTempCanvasImage(bufRect);
                    } else {
                        e.data.tempCtx.clearRect(bufRect.left, bufRect.top, bufRect.width(), bufRect.height());
                    }
                    bufRect.zero();
                }
                if (e.data.mm.rect.minSize(true)) {
                    bufRect.set(e.data.mm.rect).normalize();
                    graphUtils.shapes.drawShape(e.data.tempCtx, this._shape, bufRect, e.data.drawShape, e.data.shapeOptions);
                    calcRect(e.data);
                }
            },
            dndStop: function(e) {
                var object = e.data.activeLayer;
                var objName = object.getName();
                
                var rect = calcRect(e.data).clone();

                if ((rect.minSize() > 0) && e.data.mm.rect.minSize(true)) {
                    var command = new ShapeCommand(this._shape, e.data.mm.rect.normalize(), e.data.drawShape, e.data.shapeOptions);
                    this._runner.runToolCommand(objName, command.setConfig(objName, rect, e.data.toolOptions));
                }
                
                object.hideTempCanvas();
            }
        },
        
        _begin: function() {
            this._mouseMgr.setMode(this._mouseMgr.MODE_RECT, {
                useActiveLayer: true,
                shiftRootResizeType: Rect.RT_AVG
            });
        },
        
        _end: function() {
        }
    };
});
var TextTool = utils.createClass(BaseTool, function (base, baseConstr) {

    var TextCommand = utils.createClass(ToolCommand, {
        constructor: function(strings, lineHeight, pos) {
            this._strings = strings;
            this._lineHeight = lineHeight;
            this._pos = pos;
        },
        _apply: function(ctx) {
            graphUtils.text.drawText(ctx, this._strings, this._pos, this._lineHeight);
        }
    });
    
    var bufRect = new Rect();

    return {
        constructor: function() {
            baseConstr.call(this);
        },
        
        _mouseHandlers: {
            dndMouseDown: function(e, sender, callback) {
                if (e.data.mm.grip === 'move') {
                    e.data.mm.object.moving(true);
                }
            },
            
            dndMove: function(e) {
                this._dom.getObject('text').show(e.data.mm.rect);
            },
            
            dndMouseUp: function(e) {
                if (e.data.mm.grip === 'move') {
                    e.data.mm.object.moving(false);
                }
            },
            
            click: function(e) {
                var ti = this._dom.getObject('text');
                if (!ti.visible()) {
                    var opts = this._paint.tools.options.getData(true);
                    //console.log(e.areaX, e.areaY);
                    ti.showAt(e.areaX, e.areaY);
                    ti.setFont(opts);
                    ti.mode(ti.MODE_EDIT);
                } else {
                    if (!ti.getText()) {
                        ti.hide();
                    }
                }
            }
        },
        
        _keyHandlers: {
            move: function(e) {
                this._dom.getObject('text').move(e.direction.dx, e.direction.dy, 800);
            },
            
            enter: function(e) {
                this._apply(this._dom.getObject('text'));
            },
            
            tab: function(e) {
                var ti = this._dom.getObject('text', true);
                if (ti) {
                    ti.mode(ti.MODE_EDIT);
                }
            },
            
            escape: function() {
                this._dom.getObject('text').hide();
            },
            
            del: function(e) {
                this._dom.getObject('text').hide();
            }
        },
        
        _tiHandlers: {
            applytext: function(data, textInput) {
                this._apply(textInput);
            },
            
            tab: function() {
                this._keyMgr.focus();
            },
            
            escape: function(data, ti) {
                this._keyMgr.focus();
                ti.hide();
            }
        },
        
        _toolOptionsHandlers: {
            set: function(data) {
                var ti = this._dom.getObject('text');
                if ((data.name === 'color') || /^font/.test(data.name)) {
                    this._setFont(ti);
                }
            }
        },
        
        _setFont: function(ti) {
            var opts = this._paint.tools.options.getData(true);
            ti.setFont(opts);
        },
        
        _apply: function(ti) {
            if (!ti || !ti.visible()) {
                return;
            }
            
            //var offset = ti.getOffset();
            var rect = ti.rect.clone();//.expand(-offset.x, -offset.y);
            var strings = ti.getStrings();
            var targetObj = this._dom.getActiveLayer();
            
            if (ti.getText() && strings && strings.length && rect.isIntersect(targetObj.rect)) {
                var objName = targetObj.getName();
                rect.move(-targetObj.rect.left, -targetObj.rect.top);
                    
                var command = new TextCommand(strings, ti.lineHeight, rect.point());

                rect.clip(targetObj.rect.clone(bufRect).moveTo(0, 0));

                this._runner.runToolCommand(objName, command.setConfig(objName, rect, ti.ctxOptions));
            }
            ti.hide();
        },
        
        _begin: function() {
            this._mouseMgr.setMode(this._mouseMgr.MODE_RECT, {
                gripRoot: false
            });
            this._dom.getSelection().hide();
            this._dom.getObject('text').on('_tiHandlers', this);
        },
        
        _end: function() {
            var ti = this._dom.getObject('text');
            ti.un('_tiHandlers', this);
            this._apply(ti);
        }
    };
});
var BaseFilter = utils.createClass(null, {
    constructor: function() {
        this._started = false;
        
        this._valueCount = this._ranges.length;
        this._values = [];
        this._canRedraw = false;
    },
    
    _ranges: [],
    
    init: function(config, manager, filterRunner, runner, dom) {
        this._config = config;
        this._manager = manager;
        this._filterRunner = filterRunner;
        this._runner = runner;
        this._dom = dom;
        this._init();
    },
    
    destroy: function() {
        this.cancel();
        this._destroy();
        this._config = null;
        this._manager = null;
        this._runner = null;
        this._dom = null;
        this._filterRunner = null;
    },
    
    begin: function() {
        if (!this._started) {
            this._started = true;
            for (var i = 0; i < this._valueCount; ++i) {
                this._values[i] = this._ranges[i][1];
            }
            this._begin();
        }
    },

    end: function() {
        if (this._started) {
            this._started = false;
            this._end();
            this._values = [];
            this._canRedraw = false;
        }
    },
    
    redraw: function() {
        this._canRedraw = true;
        this._redraw();
    },
    
    valueCount: function() {
        return this._valueCount;
    },
    
    minValue: function(i) {
        return i < this._valueCount ? this._ranges[i][0] : null;
    },
    
    maxValue: function(i) {
        return i < this._valueCount ? this._ranges[i][2] : null;
    },
    
    getValue: function(i) {
        return i < this._valueCount ? this._values[i] : null;
    },
    
    setValue: function(i, value) {
        if (i < this._valueCount && typeof value === 'number') {
            value = utils.between(this._ranges[i][0], Math.round(value), this._ranges[i][2]);
            if (value !== this._values[i]) {
                this._values[i] = value;
                this._redraw();
            }
        }
    },
    
    _redraw: function() {
        if (!this._canRedraw) {
            return;
        }
        var srcImageData = this._filterRunner.getSourceImageData();
        var destImageData = this._filterRunner.getDestinationImageData();
        
        this._calcImageData(srcImageData, destImageData,
                    srcImageData.width, srcImageData.height,
                    srcImageData.data.length);
                    
        this._filterRunner.preview();
    },
    
    // virtual functions
    _calcImageData: function(src, dest, width, height, length) {},
    _init: function() {},
    _destroy: function() {},
    _begin: function() {},
    _end: function() {}
});

convolvingFilters = {
    convolving: function(src, dest, width, height, matrix) {
        var src = src.data;
        var dest = dest.data;

        var width4 = width * 4;
        
        for (var y = 0; y < height; ++y) {
            var lastY = (y === height - 1);
            for (var x = 0; x < width; ++x) {
                var pos = (y * width + x) * 4;
                dest[pos + 3] = src[pos + 3];
                
                if (dest[pos + 3] > 1) {
                    var lastX = (x === width - 1);
                    var r = 0, g = 0, b = 0;
                    var matrixPos = -1;
                
                    for (var i = -width4; i <= width4; i += width4) {
                        for (var j = -4; j <= 4; j += 4) {
                            var srcPos = pos +
                                (!y && i < 0 || lastY && i > 0 ? 0 : i) +
                                (!x && j < 0 || lastX && j > 0 ? 0 : j);
                                
                            var k = matrix[++matrixPos];
                            
                            r += src[srcPos] * k;
                            g += src[srcPos + 1] * k;
                            b += src[srcPos + 2] * k;
                        }
                    }
                    
                    dest[pos] = r;
                    dest[pos + 1] = g;
                    dest[pos + 2] = b;
                }
            }
        }
    }
};

convolvingFilters.Sharpen = utils.createClass(BaseFilter, {
    constructor: function() {
        BaseFilter.call(this);
        this._matrix = [
           0, 0, 0,
           0, 1, 0,
           0, 0, 0
        ];
    },
    
    _levels: [0, 0.2, 0.5, 1, 2, 3],
    
    _ranges: [[0, 0, 5]],
    
    _calcImageData: function(src, dest, width, height, length) {
        var level = this._levels[this.getValue(0)];
        if (level) {
            this._matrix[1] = this._matrix[3] = this._matrix[5] = this._matrix[7] = -level;
            this._matrix[4] = level * 4 + 1;
            convolvingFilters.convolving(src, dest, width, height, this._matrix);
        } else {
            graphUtils.imageData.copy(src, dest);
        }
    }
});

convolvingFilters.Relief = utils.createClass(BaseFilter, {
    constructor: function() {
        BaseFilter.call(this);
        this._matrix = [
           0, 0, 0,
           0, 1, 0,
           0, 0, 0
        ];
    },
    
    _ranges: [[0, 0, 10], [0, 0, 24]],
    
    _calcImageData: function(src, dest, width, height, length) {
        var k = this.getValue(0);
        var angle = Math.PI * this.getValue(1) / 12;
        
        if (k) {
            var a = 0;
            var deltaA = Math.PI / 4;
            for (var i = 0; i < 9; ++i) {
                if (i != 4) {
                    this._matrix[i] = -k * Math.cos(angle - a);
                    a += deltaA;
                }
            }
            
            convolvingFilters.convolving(src, dest, width, height, this._matrix);
        } else {
            graphUtils.imageData.copy(src, dest);
        }
    }
});
var FilterManager = utils.createClass(EventEmitter, {
    constructor: function(config, paint, runner) {
        EventEmitter.call(this);
        
        this._filterRunner = null;
        this._config = config;
        this._runner = runner;
        this._paint = paint;
        
        this._lastPaintTool = null;
        
        this._filter = null;
        this._filterName = '';
        this._filterMap = {};
    },
    
    setDOM: function(dom) {
        if (!this._dom) {
            this._dom = dom;
            this._filterRunner = new FilterManager.Runner(dom, this._runner);
            
            this._addFilter('brightness', new simpleFilters.Brightness());
            this._addFilter('contrast', new simpleFilters.Contrast());
            this._addFilter('grayscale', new simpleFilters.Grayscale());
            this._addFilter('sepia', new simpleFilters.Sepia());
            this._addFilter('invert', new simpleFilters.Invert());
            this._addFilter('threshold', new simpleFilters.Threshold());
            this._addFilter('saturation', new simpleFilters.Saturation());
            this._addFilter('vibrance', new simpleFilters.Vibrance());
            
            this._addFilter('sharpen', new convolvingFilters.Sharpen());
            this._addFilter('relief', new convolvingFilters.Relief());
            
            this._runner.historyEventEmitter.on('_historyHandlers', this);
        }
    },
    
    destroy: function() {
        this.un();
        this.cancel();
        
        for (var i in this._filterMap) {
            if (this._filterMap.hasOwnProperty(i) && this._filterMap[i]) {
                this._filterMap[i].destroy();
            }
        }
        
        if (this._filterRunner) {
            this._filterRunner.destroy();
        }
        
        this._filterMap = null;
        this._dom = null;
        this._filterRunner = null;
        this._config = null;
        this._paint = null;
        this._runner = null;
    },
    
    _addFilter: function(name, filter) {
        if (name && filter && !this._filterMap[name]) {
            this._filterMap[name] = filter;
            filter.init(this._config, this, this._filterRunner, this._runner, this._dom);
        }
    },
    
    _callFilterMethod: function(method, arg1, srg2) {
        return this._filter ? this._filter[method](arg1, srg2) : null;
    },
    
    current: function(name) {
        if (!this._paint) {
            return this;
        }
        if (name === undefined) {
            return this._filterName;
        }
        var oldFilter = this._filterName;
        if (!name) {
            if (this._filter) {
                this._cancel(null);
                this.emit('change', { name: '', oldName: oldFilter });
            }
            return this;
        }
        if ((typeof name !== 'string') || !this._filterMap.hasOwnProperty(name) || (this._filterName === name)) {
            return this;
        }
        this._cancel(name);
        //this._lastPaintTool = this._paint.tools.current();
        this._paint.tools.current(null);
        this._filterName = name;
        this._filter = this._filterMap[name];
        this._filter.begin();
        //this.emit('begin', {name: name});
        this.emit('change', { name: name, oldName: oldFilter });
        this._filter.redraw();
        return this;
    },
    
    //------------------------------------------------------------
    valueCount: function() {
        return this._callFilterMethod('valueCount') || 0;
    },
    
    minValue: function(i) {
        return this._callFilterMethod('minValue', i);
    },
    
    maxValue: function(i) {
        return this._callFilterMethod('maxValue', i);
    },
    
    getValue: function(i) {
        return this._callFilterMethod('getValue', i);
    },
    
    setValue: function(i, value) {
        this._callFilterMethod('setValue', i, value);
    },
    
    apply: function() {
        if (this._filter) {
            this._applying = true;
            this._filterRunner.apply();
            this._applying = false;
            var oldFilter = this._filterName;
            this._end(null);
            this.emit('change', { name: '', oldName: oldFilter });
        }
    },
    
    cancel: function() {
        this.current(null);
    },
    
    _cancel: function(replaceFilter) {
        if (this._filter) {
            this._filterRunner.end();
            this._end(replaceFilter);
        }
    },
    
    _end: function(replaceFilter) {
        this._filter.end();
        var name = this._filterName;
        this._filter = null;
        this._filterName = '';
        this.emit('end', name);
        //this.emit('end', {name: name, replaceTo: replaceFilter});
        //if (restoreTool !== false) {
            // to-do: restore tool
        //}
    },
    
    _cancelFromHistory: function() {
        if (!this._applying) {
            this.cancel();
            this._filterRunner.clear();
        }
    },
    
    _historyHandlers: {
        changing: function() {
            this._cancelFromHistory();
        },
        running: function() {
            this._cancelFromHistory();
        }
    }
});

FilterManager.Runner = utils.createClass(null, {
    constructor: function(dom, runner) {
        this._dom = dom;
        this._runner = runner;
        this._srcData = null;
        this._destData = null;
    },
    
    destroy: function() {
        this._dom = null;
        this._runner = runner;
        this.clear();
    },
    
    getSourceImageData: function() {
        if (!this._srcData) {
            var obj = this._dom.getActiveLayer();
            var ctx = obj.getResizedCanvas().getContext('2d');
            this._srcData = ctx.getImageData(0, 0, obj.rect.width(), obj.rect.height());
        }
        return this._srcData;
    },
    
    getDestinationImageData: function() {
        if (!this._destData) {
            var obj = this._dom.getActiveLayer();
            var ctx = obj.getResizedCanvas().getContext('2d');
            this._destData = ctx.createImageData(obj.rect.width(), obj.rect.height());
        }
        return this._destData;
    },
    
    preview: function() {
        var obj = this._dom.getActiveLayer();
        var ctx = obj.getTempContext();
        ctx.putImageData(this._destData, 0, 0);
        obj.hideCanvas();
    },
    
    apply: function() {
        if (this._destData) {
            var obj = this._dom.getActiveLayer();
            var objName = obj.getName();
            var command = new PrintCommand(this._destData, 0, 0);
            this._srcData = this._destData;
            this._destData = null;
            this._runner.runToolCommand(objName, command.setConfig(objName, obj.rect.clone(), null));
        }
        this.end();
    },
    
    end: function() {
        this._dom.getActiveLayer().hideTempCanvas();
    },
    
    clear: function() {
        this._srcData = null;
        this._destData = null;
    }
});
var simpleFilters = {};

simpleFilters.Brightness = utils.createClass(BaseFilter, {
    constructor: function() {
        BaseFilter.call(this);
    },
    
    _ranges: [[-100, 0, 100]],
    
    _calcImageData: function(src, dest, width, height, length) {
        var add = this.getValue(0) * 2;
        src = src.data;
        dest = dest.data;
        
        for (var i = 0; i < length; i += 4) {
            if (src[i + 3] > 1) {
                dest[i] = src[i] + add;
                dest[i + 1] = src[i + 1] + add;
                dest[i + 2] = src[i + 2] + add;
            }
            dest[i + 3] = src[i + 3];
        }
    }
});

simpleFilters.Invert = utils.createClass(BaseFilter, {
    constructor: function() {
        BaseFilter.call(this);
    },
    
    _ranges: [[0, 0, 100]],
    
    _calcImageData: function(src, dest, width, height, length) {
        var k = this.getValue(0) / this.maxValue(0);
        var k1 = 1 - k;
        src = src.data;
        dest = dest.data;
        
        for (var i = 0; i < length; i += 4) {
            if (src[i + 3] > 1) {
                dest[i] = k * (255 - src[i]) + k1 * src[i];
                dest[i + 1] = k * (255 - src[i + 1]) + k1 * src[i + 1];
                dest[i + 2] = k * (255 - src[i + 2]) + k1 * src[i + 2];
            }
            dest[i + 3] = src[i + 3];
        }
    }
});

simpleFilters.Grayscale = utils.createClass(BaseFilter, {
    constructor: function() {
        BaseFilter.call(this);
    },
    
    _ranges: [[0, 0, 100]],
    
    _calcImageData: function(src, dest, width, height, length) {
        var k = this.getValue(0) / this.maxValue(0);
        var k1 = 1 - k;
        src = src.data;
        dest = dest.data;
        
        for (var i = 0; i < length; i += 4) {
            if (src[i + 3] > 1) {
                var r = src[i];
                var g = src[i + 1];
                var b = src[i + 2];
                var v = k * (0.2126 * r + 0.7152 * g + 0.0722 * b);
                //var v = k * (0.333 * r + 0.334 * g + 0.333 * b);
                dest[i] = v + k1 * r;
                dest[i + 1] = v + k1 * g;
                dest[i + 2] = v + k1 * b;
            }
            dest[i + 3] = src[i + 3];
        }
    }
});

simpleFilters.Sepia = utils.createClass(BaseFilter, {
    constructor: function() {
        BaseFilter.call(this);
    },
    
    _ranges: [[0, 0, 100]],
    
    _calcImageData: function(src, dest, width, height, length) {
        var k = this.getValue(0) / this.maxValue(0);
        var k1 = 1 - k;
        src = src.data;
        dest = dest.data;
        
        for (var i = 0; i < length; i += 4) {
            dest[i + 3] = src[i + 3];
            
            if (src[i + 3] > 1) {
                var r = src[i];
                var g = src[i + 1];
                var b = src[i + 2];
                
                dest[i]     = k * ((r * 0.393)+(g * 0.769)+(b * 0.189)) + k1 * r; // red
                dest[i + 1] = k * ((r * 0.349)+(g * 0.686)+(b * 0.168)) + k1 * g; // green
                dest[i + 2] = k * ((r * 0.272)+(g * 0.534)+(b * 0.131)) + k1 * b; // blue
            }
        }
    }
});

simpleFilters.Threshold = utils.createClass(BaseFilter, {
    constructor: function() {
        BaseFilter.call(this);
    },
    
    _ranges: [[0, 40, 255], [0, 60, 255], [0, 90, 255], [0, 140, 255]],
    
    _calcImageData: function(src, dest, width, height, length) {
        src = src.data;
        dest = dest.data;
        var cmpValue0 = this.getValue(0);
        var cmpValue1 = this.getValue(1);
        var cmpValue2 = this.getValue(2);
        var cmpValue3 = this.getValue(3);
        
        for (var i = 0; i < length; i += 4) {
            if (src[i + 3] > 1) {
                var v = (0.2126 * src[i] + 0.7152 * src[i + 1] + 0.0722 * src[i + 2]);
                //v = v < cmpValue0 ? 0 : (v < cmpValue1 ? 128 : 255);
                v = v < cmpValue0 ? 0 : (v < cmpValue1 ? 64 : (v < cmpValue2 ? 128 : (v < cmpValue3 ? 192 : 255)));
                dest[i] = v;
                dest[i + 1] = v;
                dest[i + 2] = v;
            }
            dest[i + 3] = src[i + 3];
        }
    }
});

simpleFilters.Saturation = utils.createClass(BaseFilter, {
    constructor: function() {
        BaseFilter.call(this);
    },
    
    _ranges: [[-100, 0, 100]],
    
    _calcImageData: function(src, dest, width, height, length) {
        src = src.data;
        dest = dest.data;
        var k = -this.getValue(0) / (this.getValue(0) < 0 ? 100 : 25);
 
        for (var i = 0; i < length; i += 4) {
            dest[i + 3] = src[i + 3];
            if (src[i + 3] > 1) {
                var r = src[i];
                var g = src[i + 1];
                var b = src[i + 2];
                
                var max = Math.max(r, g, b);
                
                dest[i] = r + (max - r) * k;
                dest[i + 1] = g + (max - g) * k;
                dest[i + 2] = b + (max - b) * k;
            }
        }
    }
});

simpleFilters.Vibrance = utils.createClass(BaseFilter, {
    constructor: function() {
        BaseFilter.call(this);
    },
    
    _ranges: [[-100, 0, 100]],
    
    _calcImageData: function(src, dest, width, height, length) {
        src = src.data;
        dest = dest.data;
        
        var k = -this.getValue(0) / (this.getValue(0) < 0 ? 100 : 25);

        for (var i = 0; i < length; i += 4) {
            dest[i + 3] = src[i + 3];
            
            if (src[i + 3] > 1) {
                var r = src[i];
                var g = src[i + 1];
                var b = src[i + 2];
                
                var max = Math.max(r, g, b);
                var avg = (r + g + b) / 3;
                var amt = (Math.abs(max - avg) * 2 / 255) * k;
                
                dest[i] = r + (max - r) * amt;
                dest[i + 1] = g + (max - g) * amt;
                dest[i + 2] = b + (max - b) * amt;
            }
        }
    }
});

simpleFilters.Contrast = utils.createClass(BaseFilter, {
    constructor: function() {
        BaseFilter.call(this);
    },
    
    _ranges: [[-100, 0, 100]],
    
    _calcImageData: function(src, dest, width, height, length) {
        src = src.data;
        dest = dest.data;
        
        var k = Math.pow((this.getValue(0) + 100) / 100, 2);

        for (var i = 0; i < length; i += 4) {
            dest[i + 3] = src[i + 3];
            
            if (src[i + 3] > 1) {
                dest[i]     = (((src[i] / 255) - 0.5) * k + 0.5) * 255;
                dest[i + 1] = (((src[i + 1] / 255) - 0.5) * k + 0.5) * 255;
                dest[i + 2] = (((src[i + 2] / 255) - 0.5) * k + 0.5) * 255;
            }
        }
    }
});

var jscpConfig = {

    defConfig: {
        historyLimit: 6,
        
        width: 500,
        height: 400,
        minWidth: 8,
        minHeight: 8,
        margin: 16,
        
        openDDFiles: false,
        
        /* config for BG image */
        bgTileSize: 8,
        bgTileColor1: '#c9c9c9',
        bgTileColor2: '#fefefe'
    },
    
    toolOptionsConfig: {
        color: {
            defValue: '#000000',
            check: graphUtils.color.checkColor,
            translate: graphUtils.color.format
        },
        fillColor: {
            defValue: '#dddddd',
            check: graphUtils.color.checkColor,
            translate: graphUtils.color.format
        },
        
        penForm: {
            defValue: 'round',
            check: ['round', 'square']
        },
        lineCap: {
            defValue: 'round',
            check: ['round', 'butt', 'square']
        },
        lineJoin: {
            defValue: 'round',
            check: ['round', 'miter', 'bevel']
        },
        lineWidth: {
            defValue: 1,
            check: utils.checkNumber(1, 100, true)
        },
        
        rectRadius: {
            defValue: 8,
            check: utils.checkNumber(1, 100, true)
        },
        
        drawPattern: {
            defValue: '',
            check: graphUtils.patterns.checkName
        },
        
        fillType: {
            defValue: 'replace',
            check: ['replace']
        },
        
        fillAlpha: {
            defValue: 'cyry',
            check: ['cyry', 'cnrn', 'cyrn', 'cnry']
        },
        
        picker: {
            defValue: 'color',
            check: ['color', 'fillColor']
        },
        /*
        drawPen: {
            defValue: 'stroke',
            check: ['stroke', 'erase']
        },
        */
        drawLine: {
            defValue: 'stroke',
            check: ['stroke', 'erase', 'parterase']
        },
        drawShape: {
            defValue: 'both',
            check: ['stroke', 'fill', 'both', 'erase', 'parterase']
        },
        
        curve: {
            defValue: 'bezier3',
            check: ['line', 'bezier2', 'bezier3', 'arc']
        },
        
        curveApplyOptions: {
            defValue: true,
            check: 'boolean'
        },
        
        fontBold: {
            defValue: false,
            check: 'boolean'
        },
        fontItalic: {
            defValue: false,
            check: 'boolean'
        },
        fontSize: {
            defValue: 16,
            check: utils.checkNumber(5, 100, true)
        },
        fontFamily: {
            defValue: 'sans-serif'
        }
    },
    
    constValues: {
        minWidth: 1,
        minHeight: 1
    }
};
var JSPaintCore = utils.createClass(EventEmitter, function(base, baseConstr) {

    function emptyFunc() { }

    return {
        constructor: function(rootNode, config) {
            baseConstr.call(this);
            var c = this._config = utils.copy({}, jscpConfig.defConfig, config);
            
            c.minWidth = Math.max(c.minWidth, jscpConfig.constValues.minWidth);
            c.minHeight = Math.max(c.minHeight, jscpConfig.constValues.minHeight);
            c.width = utils.between(c.minWidth, c.width, null /*c.maxWidth*/);
            c.height = utils.between(c.minHeight, c.height, null /*c.maxHeight*/);
            c._minSize = { width: c.minWidth, height: c.minHeight };
            c._minRect = new Rect(c._minSize);
            
            this._dom = null;
            
            this._keyManager = new KeyManager(c);
            this._keyManager.on('_eventsKeyBoard', this);
            
            this._runner = new CommandRunner(c, this);
            
            this.tools   = new ToolManager  (c, this, this._runner, this._keyManager);
            this.filters = new FilterManager(c, this, this._runner);
            this.history = this._runner.getHistory();
            
            this.renderTo(rootNode);
        },
        
        renderTo: function(rootNode) {
            if (!this._dom && rootNode && rootNode.tagName && rootNode.parentNode) {
                var c = this._config
                
                this._dom = new JSCPDOM(rootNode, c);
                this._dom.on('_eventsDOM', this);
                
                this._mouseManager = new MouseManager(c, this._dom, this._dom.root);
                this._mouseManager.on('_eventsMouse', this);
                
                this._runner.setDOM(this._dom);
                this.tools.setDOM(this._dom, this._mouseManager);
                this.filters.setDOM(this._dom);
            }
        },
        
        created: function() {
            return !!this._dom;
        },
        
        destroy: function() {
            this.un();
            this.history.un();
            this._mouseManager.destroy();
            this._keyManager.destroy();
            this._runner.destroy();
            this.tools.destroy();
            this.filters.destroy();
            this._dom.destroy();
            
            this.tools = null;
            this.filters = null;
            this.history = null;
            
			this._dom = null;
            this._mouseManager = null;
            this._keyManager = null;
            this._runner = null;
		},
        
        //------------------------------------------------------------------------------
        
        _eventsDOM: {
            resize: function() {
                this.emit('resize');
            }
        },
        
        _eventsMouse: {
            keyManagerFocus: function() {
                this._keyManager.focus();
            },
            dropImage: function(e) {
                this._insertImageFromEvent(e);
            }
        },
        
        _eventsKeyBoard: {
            pasteImage: function(e) {
                this._insertImageFromEvent(e);
            },
            
            selectAll: function(e) {
                this.createObject('all');
            },
        
            undo: function(e) {
                this.history.undo();
            },
            redo: function(e) {
                this.history.redo();
            }
        },
        
        _insertImageFromEvent: function(data) {
            if (data.img) {
                if (data.fileName && this._config.openDDFiles) {
                    this.openImage(data.img);
                } else {
                    this.insertImage(data.img, data.point);
                }
                return;
            }
            
            if (data.url) {
                this.insertResource(data.url, data.point);
            }
        },
		
		//-- create&run commands ---------------------------------------------------------------------------------------

        resize: function(size) {
            if (!size || !this.created()) {
                return;
            } else {
                size = utils.sizeBetween(this._config._minSize, size);
            }
            if ((size.width == this.width()) && (size.height == this.height())) {
                return;
            }
            
            this._runner.moveObject('bg', new Rect(size));
            this._keyManager.focus();
        },
        
        focus: function() {
            this._keyManager.focus();
        },
        
        crop: function(rect) {
            if (!this.created()) {
                return;
            }
            this._runner.crop(rect);
            this._keyManager.focus();
        },
        
        // --- objects ---
        createObject: function(rect, copy) {
            if (!this.created()) {
                return;
            }
            this.tools.current('select');
            this._runner.createObject(rect, copy);
            this._keyManager.focus();
        },
        
        insertImage: function(image, point) {
            if (!this.created()) {
                return;
            }
            if (!uiUtils.isGoodImage(image)) {
                return;
            }
            var size = uiUtils.getImageSize(image);
            if (!size.width || !size.height) {
                return;
            }
            this.tools.current('select');
            this._runner.insertImage(image, point, size);
            this._keyManager.focus();
        },
        
        removeObject: function(draw) {
            if (!this.created()) {
                return;
            }
            this._runner.removeObject(draw);
            this._keyManager.focus();
        },
        
        //---------------------------------
        newImage: function(size) {
            if (!this.created()) {
                return;
            }
            size = size || {width: this._config.width, height: this._config.height};
            size = utils.sizeBetween(this._config._minSize, size);
            this._runner.newImage(size);
            this._keyManager.focus();
        },
        
        openImage: function(image) {
            if (!this.created()) {
                return;
            }
            if (!uiUtils.isGoodImage(image)) {
                return;
            }
            var size = uiUtils.getImageSize(image);
            if (!size.width || !size.height) {
                return;
            }
            size = utils.sizeBetween(this._config._minSize, size);
            this._runner.newImage(size, image);
        },
        
        //---------------------------------------------------------------------
        
        _getProxyUrl: function(url) {
            return this.emit('getProxyUrl', url, true) || url;
        },
        _getImage: function(blobOrUrl, callback, ctx, success) {
            if (!this.created()) {
                return;
            }
            callback = callback || emptyFunc;
            if (!blobOrUrl) {
                callback.call(ctx, null, this);
                return;
            }
            html5.getImage(blobOrUrl, {
                ctx: this,
                getProxyUrl: this._getProxyUrl,
                useCredentials: false
            }, function(data) {
                if (data.img) {
                    success.call(this, data.img);
                }
                callback.call(ctx, data.error, this);
            }, this);
        },
        
        insertResource: function(blobOrUrl, point, callback, ctx) {
            this._getImage(blobOrUrl, callback, ctx, function(img) {
                this.insertImage(img, point);
            });
        },
        
        openResource: function(blobOrUrl, callback, ctx) {
            this._getImage(blobOrUrl, callback, ctx, this.openImage);
        },
        
        hideSelection: function() {
            if (!this.created()) {
                return;
            }
            this._dom.getSelection().hide();
        },
        
        // type: 'x', 'y', '90', '180', '270'
        rotate: function(type, bgOnly) {
            if (!this.created()) {
                return;
            }
            this.hideSelection();
            var bg = this._dom.getBG();
            var obj = bgOnly ? bg : this._dom.getActiveLayer();
            var newRect = null;
            var oldCanvas = obj.getCanvas();
            var size = uiUtils.getImageSize(oldCanvas);
            if (type === '90' || type === '270') {
                var rcenter = obj.rect.left || obj.rect.top;
                newRect = obj.rect.clone(true).rotate90(rcenter);
                var t = size.width;
                size.width = size.height;
                size.height = t;
            }
            var newCanvas = uiUtils.createCanvas(size);
            graphUtils.rotate.rotateOrto(oldCanvas, newCanvas.getContext('2d'), type);
            
            this._runner.replaceCanvas(obj.getName(), newCanvas, newRect);
        },
        
        //---------------------------------------------------------------------
        
		width: function(outer) {
			return this.created() ? (outer ? this._dom : this._dom.getBG()).rect.width() : 0;
		},
        height: function(outer) {
			return this.created() ? (outer ? this._dom : this._dom.getBG()).rect.height() : 0;
		},
        
        offsetWidth: function(withPadding) {
			return this.created() ? this._dom.rect.width() + (withPadding ? this._config.padding * 2 : 0) : 0;
		},
        offsetHeight: function(withPadding) {
			return this.created() ? this._dom.rect.height() + (withPadding ? this._config.padding * 2 : 0) : 0;
		},
        
		getRootNode: function() {
			return this.created() ? this._dom.root : null;
		},
        
        _getCanvasForSave: function() {
            var cv = this._dom.getBG().getResizedCanvas();
            var frame = this._dom.getObject('frame', true);
            if (!frame) {
                return cv;
            }
            cv = uiUtils.createCanvas(cv);
            var frameCv = frame.getResizedCanvas();
            cv.getContext('2d').drawImage(frameCv, frame.rect.left, frame.rect.top);
            return cv;
        },
        
        _getMimeType: function(mimeType) {
            if (mimeType && !/^image/i.test(mimeType)) {
                mimeType = 'image/' + mimeType;
            }
            return mimeType;
        },
		
		toDataURL: function(mimeType, quality) {
            if (!this.created()) {
                return null;
            }
			mimeType = this._getMimeType(mimeType);
			return this._getCanvasForSave().toDataURL(mimeType, quality);
		},
        
        toBlob: function(callback, mimeType, quality) {
            if (!this.created()) {
                callback && callback(null);
                return null;
            }
			mimeType = this._getMimeType(mimeType);
			return this._getCanvasForSave().toBlob(callback, mimeType, quality);
		}
	};
});

    
    return {
        Paint: JSPaintCore,
        utils: {
            Rect: Rect,
            dnd: DND,
            createClass: utils.createClass,
            color: graphUtils.color,
            patterns: graphUtils.patterns,
            EventEmitter: EventEmitter
        }
    };
});
