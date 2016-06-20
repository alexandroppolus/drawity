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