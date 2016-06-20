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