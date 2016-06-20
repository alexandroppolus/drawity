var BGResizeTool = utils.createClass(BaseTool, {
    constructor: function() {
        BaseTool.call(this);
    },
    
    _mouseHandlers: {
        dndMouseDown: function(e, callback) {
            this._dom.mode(this._dom.MODE_RESIZING).getSelection().hide();
        },
        dndMove: function(e) {
            this._dom.getBG().show(e.data.mm.rect);
        },
        dndStop: function(e) {
            this._runner.moveObject('bg', e.data.mm.rect.saveProportions(), e.data.mm.startRect);
        },
        dndMouseUp: function(e) {
            this._dom.mode(this._dom.MODE_NORMAL);
        }
    },
    
    _begin: function() {
        this._mouseMgr.setMode(this._mouseMgr.MODE_RECT, {
            gripRoot: false,
            minSize: this._config._minSize,
            resizePositiveOnly: true,
            resizeResizeType: Rect.RT_AVG
        });
        this._dom.getSelection().hide();
        this._dom.getBG().enableDND(true);
    },
    
    _end: function() {
        this._dom.mode(this._dom.MODE_NORMAL);
        this._dom.getBG().enableDND(false);
    }
});