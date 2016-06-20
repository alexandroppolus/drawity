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