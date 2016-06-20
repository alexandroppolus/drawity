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