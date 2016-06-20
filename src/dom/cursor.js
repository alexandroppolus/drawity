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