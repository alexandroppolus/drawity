var ColorPickerTool = (function() {
    
    return utils.createClass(BaseTool, {
        constructor: function() {
            BaseTool.call(this);
        },
        
        _getColor: function(x, y) {
            return this._dom.getPixelColor(x, y);
        },
        
        _mouseHandlers: {
            mousedown: function(e) {
                var optName = this._paint.tools.options.get('picker');
                var color = this._getColor(e.start.nodeX, e.start.nodeY);
                if (color) {
                    //console.log(color);
                    this._paint.tools.options.set(optName, graphUtils.color.colorStr(color));
                }
            }
        },
        
        _begin: function() {
            this._mouseMgr.setMode(this._mouseMgr.MODE_POINT, {
                areaOnly: true
            });
        },
        
        _end: function() {
        }
    });
})();