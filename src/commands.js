var BaseCommand = utils.createClass(null, {
    init: function(paint, dom) {
        this._paint = paint;
        this._dom = dom;
        this._init();
    },
    _init: function() {}
});

var SymmetricCommand = utils.createClass(BaseCommand, {
    undo: function() {
        this._action();
    },
    redo: function() {
        this._action();
    },
    _action: function() { }
});

// ----------------------------------------------------------------------------
var ReplaceCanvasCommand = utils.createClass(SymmetricCommand, {
    constructor: function(layerName, canvas) {
        this._layer = layerName;
        this._canvas = canvas;
	},
    _action: function() {
        this._canvas = this._dom.getObject(this._layer).replaceCanvas(this._canvas);
    }
});

//----- objects --------------------------------------------------------
var CreateObjectCommand = utils.createClass(BaseCommand, {
    constructor: function(rect, copy) {
		this._rect = rect;
        this._copy = copy;
	},
    undo: function() {
        var obj = this._dom.getObject('frame');
        if (!this._copy) {
            obj.draw();
        }
        obj.remove(!this._copy);
    },
    redo: function() {
        this._dom.getObject('frame').create(null, this._rect, this._copy);
    }
});

var InsertObjectCommand = utils.createClass(BaseCommand, {
    constructor: function(canvas, rect) {
		this._canvas = canvas;
        this._rect = rect;
	},
    undo: function() {
        this._dom.getObject('frame').remove();
    },
    redo: function() {
        this._dom.getObject('frame').insert(this._canvas, this._rect);
    }
});

var RemoveObjectCommand = utils.createClass(BaseCommand, {
    constructor: function(oldRect) {
        this._rect = oldRect && oldRect.clone(true);
	},
    _init: function() {
        var obj = this._dom.getObject('frame');
        this._rect = this._rect || obj.rect.clone(true);
        this._canvas = obj.canvas;
    },
    undo: function() {
        this._dom.getObject('frame').insert(this._canvas, this._rect);
    },
    redo: function() {
        this._dom.getObject('frame').remove();
    }
});

var DrawObjectCommand = utils.createClass(BaseCommand, {
    constructor: function() { },
    _init: function() {
        this._rect = this._dom.getObject('frame').rect.clone(true);
        var bg = this._dom.getBG();
        this._bgCanvas = bg.getSnapshot(this._rect, true);
    },
    undo: function() {
        graphUtils.drawImage(this._dom.getBG().canvas, this._rect, true, this._bgCanvas);
    },
    redo: function() {
        this._dom.getObject('frame').draw();
    }
});

var MoveObjectCommand = utils.createClass(BaseCommand, {
    constructor: function(objectName, newRect, oldRect) {
        this._objectName = objectName;
        this._newRect = newRect.clone(true).normalize();
        this._oldRect = oldRect && oldRect.clone(true).normalize();
	},
    _init: function() {
        this._oldRect = this._oldRect || this._dom.getObject(this._objectName).rect.clone(true);
    },
    undo: function() {
        this._dom.getObject(this._objectName).show(this._oldRect);
    },
    redo: function() {
        this._dom.getObject(this._objectName).show(this._newRect);
    },
    appendCommand: function(cmd) {
        this._newRect = cmd._newRect;
        return true;
    }
});

//-----------------------------------------------------
var ParentCommand = utils.createClass(BaseCommand, {
    constructor: function(innerCommand) {
        this._innerCommand = innerCommand;
	},
    
    _init: function() {
        this._innerCommand.init(this._paint, this._dom);
    },
    
    undo: function() {
        this._innerCommand.undo();
        this._innerCommand.done = false;
    },
    redo: function() {
        this._innerCommand.redo();
        this._innerCommand.done = true;
    },
    
    replaceInnerCommand: function(innerCommand) {
        var done = this.done;
        if (done) {
            this.undo();
        }
        this._innerCommand = innerCommand;
        this._init();
        if (done) {
            this.redo();
        }
    }
});

//--------------------------------------------------------------
var ToolCommand = utils.createClass(BaseCommand, {
    setConfig: function(objName, rect, options) {
        this._objName = objName;
        this._rect = rect;
        this._options = options;
        return this;
    },
    undo: function() {
        if (this._snapshot) {
            var ctx = this._dom.getObject(this._objName).canvas.getContext('2d');
            ctx.putImageData(this._snapshot.getData(), this._rect.left, this._rect.top);
        }
    },
    redo: function() {
        if (!this._snapshot) {
            this._snapshot = this._dom.getObject(this._objName).getImageData(this._rect);
        }
        var obj = this._dom.getObject(this._objName);
        var ctx = obj.canvas.getContext('2d');
        graphUtils.setOptions(ctx, this._options);
        this._apply(ctx);
        graphUtils.resetGlobals(ctx);
    },
    
    _apply: function(ctx) { }
});

var PrintCommand = utils.createClass(ToolCommand, {
    constructor: function(imgData, x, y) {
        this._imgData = imgData;
        this._isImageOrCanvas = !!imgData.tagName;
        if (!this._isImageOrCanvas && this._imgData.isImageDataWrapper) {
            this._imgData = this._imgData.getData();
        }
        this._x = x;
        this._y = y;
    },
    _apply: function(ctx) {
        if (this._isImageOrCanvas) {
            ctx.drawImage(this._imgData, this._x, this._y);
        } else {
            //ctx.globalCompositeOperation = 'copy';
            ctx.putImageData(this._imgData, this._x, this._y);
            //graphUtils.resetGlobals(ctx);
        }
    }
});
