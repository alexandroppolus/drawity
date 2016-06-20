var BaseTool = utils.createClass(null, {
    constructor: function() {
        this._toolStarted = false;
    },
    
    _bufRect: new Rect(),
    
    init: function(config, paint, runner, dom, mouseMgr, keyMgr) {
        this._config = config;
        this._paint = paint;
        this._runner = runner;
        this._dom = dom;
        this._mouseMgr = mouseMgr;
        this._keyMgr = keyMgr;
        this._init();
    },
    destroy: function() {
        this.end();
        this._destroy();
        this._config = null;
        this._runner = null;
        this._dom = null;
        this._mouseMgr = null;
        this._keyMgr = null;
    },
    begin: function() {
        if (!this._toolStarted) {
            this._mouseMgr.on('_mouseHandlers', this);
            this._keyMgr.on('_keyHandlers', this);
            this._paint.tools.options.on('_toolOptionsHandlers', this);
            this._dom.cursor.on('_cursorHandlers', this);
            this._toolStarted = true;
            this._begin();
        }
    },

    end: function() {
        if (this._toolStarted) {
            this._toolStarted = false;
            this._end();
            this._mouseMgr.un('_mouseHandlers', this);
            this._keyMgr.un('_keyHandlers', this);
            this._paint.tools.options.un('_toolOptionsHandlers', this);
            this._dom.cursor.un('_cursorHandlers', this);
        }
    },
    // virtual functions
    _toolOptionsHandlers: null,
    _keyHandlers: null,
    _mouseHandlers: null,
    _cursorHandlers: null,
    _init: function() {},
    _destroy: function() {},
    _begin: function() {},
    _end: function() {}
});

Rect.prototype.toolResultRect = (function() {
    var bufRectObj = new Rect();
    
    return function(layer, lineWidth) {
        var expWidth = lineWidth ? Math.round(lineWidth / 1.414 + 2) : 1;
        return this
            .normalize()
            .expand(expWidth)
            .clip(bufRectObj.set(layer.rect).moveTo(0, 0));
    };
})();