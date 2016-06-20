var CropTool = utils.createClass(BaseTool, {
    constructor: function() {
        BaseTool.call(this);
    },
    
    _mouseHandlers: {
        dndMouseDown: function(e, callback) {
            var sel = this._dom.mode(this._dom.MODE_SELECTING).getSelection().mode('crop');
            if (e.data.mm.grip == 'root') {
                sel.hide();
            }
        },
        dndMove: function(e) {
            this._dom.getSelection().show(e.data.mm.rect);
        },
        dndMouseUp: function(e) {
            //console.log(e.data);
            this._dom.mode(this._dom.MODE_NORMAL);
        }
    },
    
    _keyHandlers: {
        move: function(e) {
            this._dom.getSelection().move(e.direction.dx, e.direction.dy);
        },
        
        enter: function(e) {
            this._runner.crop();
        },
        
        escape: function(e) {
            this._dom.getSelection().hide();
        }
    },
    
    _selectionHandlers: {
        applycrop: function(e) {
            this._runner.crop();
        }
    },
    
    _begin: function() {
        this._mouseMgr.setMode(this._mouseMgr.MODE_RECT, {
            handleDblClick: true,
            minSize: this._config._minSize,
            shiftMoveIntoRect: this._dom.getBG().rect,
            shiftRootResizeType: Rect.RT_AVG
        });
        this._dom.getSelection().hide().mode('crop').on('_selectionHandlers', this);
    },
    
    _end: function() {
        this._dom.mode(this._dom.MODE_NORMAL).getSelection().hide().un('_selectionHandlers', this);
    }
});