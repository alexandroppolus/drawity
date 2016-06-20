var CommandRunner = utils.createClass(null, {
    constructor: function(config, paint) { 
        this._paint = paint;
        this._config = config;
        
        this.historyEventEmitter = new EventEmitter();
        this.history = new CommandHistory(config.historyLimit, this.historyEventEmitter);
    },
    
    setDOM: function(dom) {
        if (!this._dom) {
            this._dom = dom;
            this.historyEventEmitter.on('_eventsHistory', this);
        }
    },
    
    destroy: function() {
        this.historyEventEmitter.un();
        this.history.clear();
        
        this.historyEventEmitter = null;
        this._paint = null;
        this.history = null;
        this._dom = null;
    },
    
    _eventsHistory: {
        changing: function() {
            this._dom.getSelection().hide();
        }
    },
    
    getHistory: function() {
        var history = utils.proxy(this.history, ['undo', 'redo', 'undoLength', 'redoLength', 'isEmpty', 'clear']);
        EventEmitter.mixin(history);
        this.historyEventEmitter.on('change', function(data) {
            this.emit('change', data);
        }, history);
        return history;
    },
    
    run: function(cmd, groupId) {
        cmd.init(this._paint, this._dom);
        this.history.run(cmd, groupId);
    },
    
    runAll: function(cmds) {
        if (cmds && cmds.length) {
            if (cmds.length > 1) {
                this.history.beginBatch();
            }
            for (var i = 0; i < cmds.length; ++i) {
                if (cmds[i] && cmds[i].init) {
                    this.run(cmds[i]);
                }
            }
            if (cmds.length > 1) {
                this.history.endBatch();
            }
        }
    },

    //--------------------------------------------
    replaceCanvas: function(objName, canvas, newRect) {
        this.history.beginBatch();
        this.run(new ReplaceCanvasCommand(objName, canvas));
        if (newRect) {
            this.moveObject(objName, newRect, null, true);
        }
        this.history.endBatch();
    },
    
    applyResize: function(objName) {
        var obj = this._dom.getObject(objName, true);
        if (obj && obj.resized()) {
            var canvas = obj.getResizedCanvas();
            this.replaceCanvas(objName, canvas);
        }
    },
    
    crop: function(rect) {
        var selection = this._dom.getSelection(true);
        if (!rect && !selection) {
            return;
        }
        rect = Rect.get(rect || selection.rect)
            .clone()
            .normalize()
            .resize('rb', { minSize: this._config._minSize });
    
        this._dom.getSelection().hide();
        this.history.beginBatch();
        
        this.applyResize('bg');
        
        var offsetLeft = rect.left ? -rect.left : 0;
        var offsetTop = rect.top ? -rect.top : 0;
        
        var obj = this._dom.getObject('frame', true);
        if (obj) {
            if (!obj.visibleIn(rect)) {
                this.removeObject(false);
            } else {
                if (offsetLeft || offsetTop) {
                    this.moveObject('frame', obj.rect.clone(true).move(offsetLeft, offsetTop), null, false);
                }
            }
        }
        var bg = this._dom.getBG();
        var canvas = bg.getSnapshot(rect, true);
        this.moveObject('bg', rect.moveTo(0, 0).saveProportions(true));
        this.replaceCanvas('bg', canvas);
        
        this.history.endBatch();
    },
    
    _moveFrame: function(newRect, oldRect, groupId) {
        this.run(new MoveObjectCommand(objName, newRect, oldRect));
    },
    
    moveObject: function(objName, newRect, oldRect, testVisible, groupId) {
        var obj = this._dom.getObject(objName, true);
        if (obj && (objName === 'frame') && groupId && obj.visibleIn(null, newRect)) {
            this.run(new MoveObjectCommand(objName, newRect, oldRect), groupId);
            return;
        }
        this.history.beginBatch();
        if (objName === 'bg') {
            var frm = this._dom.getObject('frame', true);
            if (frm && !frm.visibleIn(newRect)) {
                this.run(new RemoveObjectCommand());
            }
        }
        if (obj) {
            if ((testVisible !== false) && (objName !== 'bg') && !obj.visibleIn(null, newRect)) {
                this.run(new RemoveObjectCommand(oldRect));
            } else {
                this.run(new MoveObjectCommand(objName, newRect, oldRect));
            }
        }
        this.history.endBatch();
    },
    
    drawObject: function() {
        if (this._dom.getObject('frame', true)) {
            this.history.beginBatch();
            this.applyResize('bg');
            this.run(new DrawObjectCommand());
            this.history.endBatch();
        }
    },
    
    removeObject: function(draw) {
        if (this._dom.getObject('frame', true)) {
            this.history.beginBatch();
            if (draw) {
                this.drawObject();
            }
            this.run(new RemoveObjectCommand());
            this.history.endBatch();
        }
    },
    
    createObject: function(rect, copy) {
        var selection = this._dom.getSelection(true);
        if (!rect && !selection) {
            return;
        }
        if (rect === 'all') {
            rect = this._dom.getBG().rect.clone().saveProportions(true);
        } else {
            rect = Rect.get(rect || selection.rect).clone().normalize().saveProportions();
        }
        
        this._dom.getSelection().hide();
        this.history.beginBatch();
        this.applyResize('bg');
        this.removeObject(true);
        if (rect.minSize() > 0) {
            this.run(new CreateObjectCommand(rect, copy));
        }
        this.history.endBatch();
    },
    
    insertImage: function(image, point, size) {
        this._dom.getSelection().hide();
        var canvas = uiUtils.createCanvas(image);
        
        this.history.beginBatch();
        this.removeObject(true);
        
        var parentRect = this._dom.getBG().rect;
        if ((size.width > parentRect.width()) || (size.height > parentRect.height())) {
            var rect = Rect(size.width, size.height).union(parentRect);
            this.crop(rect);
        }
        
        parentRect = this._dom.getBG().rect;
        var parentSize = parentRect.size();
        
        if (!point) {
            point = uiUtils.getInsertPoint(size, parentSize, this._dom.root);
        } else {
            point.x = Math.min(Math.max(point.x, 0), parentRect.width() - size.width);
            point.y = Math.min(Math.max(point.y, 0), parentRect.height() - size.height);
        }
        
        this.run(new InsertObjectCommand(canvas, Rect(point, size).saveProportions()));
        this.history.endBatch();
    },
    
    newImage: function(size, image) {
        this._dom.getSelection().hide();
        this.history.beginBatch();
        this.removeObject(false);
        this.moveObject('bg', Rect(size).saveProportions());
        this.replaceCanvas('bg', uiUtils.createCanvas(image, size));
        this.history.endBatch();
    },
    
    runToolCommand: function(objName, command) {
        this.history.beginBatch();
        this.applyResize(objName);
        this.run(command);
        this.history.endBatch();
    }
});