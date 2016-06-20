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