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
