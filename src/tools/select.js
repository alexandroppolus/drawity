var SelectTool = utils.createClass(BaseTool, {
    constructor: function() {
        BaseTool.call(this);
    },
    
    _mouseHandlers: {
        dndMouseDown: function(e, sender, callback) {
            this._dom.getSelection().mode('select').hide();
            this._runner.history.beginBatch();
            if (e.data.mm.grip === 'root') {
                this._runner.removeObject(true);
            }
            this._dom.getSelection().moving(true);
            this._dom.getObject('frame').moving(true);
            //callback(false); //cancel
        },
        dndStart: function(e) {
            if (e.start.cmdKey && e.data.mm.object && (e.data.mm.object.getType() === 'frame')) {
                this._runner.drawObject();
            }
        },
        dndMove: function(e) {
            var obj = e.data.mm.object || this._dom.getSelection();
            obj.show(e.data.mm.rect);
        },
        dndStop: function(e) {
            if (e.data.mm.object) {
                this._runner.moveObject('frame', e.data.mm.rect.saveProportions(), e.data.mm.startRect, true);
            } else {
                this._runner.createObject(e.data.mm.rect, false);
            }
        },
        dndMouseUp: function(e) {
            this._runner.history.endBatch();
            this._dom.getSelection().moving(false);
            this._dom.getObject('frame').moving(false);
        }
    },
    
    _keyHandlers: {
        move: function(e) {
            var obj = this._dom.getObject('frame', true);
            if (obj) {
                var oldRect = obj.rect.clone(true);
                obj.move(e.direction.dx, e.direction.dy, 800);
                var grp = Math.round((new Date()).valueOf() / 4000);
                this._runner.moveObject('frame', obj.rect, oldRect, true, 'kbfmove' + grp);
            }
        },
        
        del: function(e) {
            this._runner.removeObject(false);
        },
        
        enter: function(e) {
            this._runner.removeObject(true);
        },
        
        requestCopyData: function(e, sender, callback) {
            var obj = this._dom.getObject('frame', true);
            if (obj) {
                var cv = obj.getResizedCanvas();
                if (cv) {
                    var imgData = html5.customImageClipboard.put(cv);
                    callback(imgData);
                }
            }
        }
    },
    
    _minSize: { width: 1, height: 1 },
    
    _begin: function() {
        this._mouseMgr.setMode(this._mouseMgr.MODE_RECT, {
            //minSize: this._config.minSize,
            resizeResizeType: Rect.RT_AVG,
            shiftRootResizeType: Rect.RT_AVG,
            resizePositiveOnly: true,
            minSize: this._minSize,
            rootClip: this._dom.getBG().rect
        });
        this._dom.getSelection().hide().mode('select');
        this._dom.getObject('frame').enableDND(true);
    },
    
    _end: function() {
        this._dom.getObject('frame').enableDND(false);
    }
});