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
