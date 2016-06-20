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