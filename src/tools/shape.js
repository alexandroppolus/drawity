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