var JSCPPicture = utils.createClass(JSCPObject, {
    constructor: function(dom, elem) {
        JSCPObject.call(this, dom, elem);
        this.canvas = null;
        this._resizedCanvas = null;
        this._tempCanvas = null;
    },
    
    _destroy: function() {
        this.canvas = null;
        this._resizedCanvas = null;
        this._tempCanvas = null;
    },
    
    getCanvas: function() {
        return this.canvas;
    },
    
    getContext: function() {
        return this.canvas ? this.canvas.getContext('2d') : null;
    },
    
    getOffsetNode: function() {
        return this._inner;
    },
    
    restoreTempCanvasImage: function(copyClip) {
        var ctx = this._tempCanvas.getContext('2d');
        var oldGCO = ctx.globalCompositeOperation;
        ctx.globalCompositeOperation = 'copy';
        if (copyClip) {
            var sx = copyClip.left,
                sy = copyClip.top,
                sw = copyClip.width(),
                sh = copyClip.height();
                
            ctx.save();
            ctx.beginPath();
            ctx.rect(sx, sy, sw, sh);
            ctx.clip();
            ctx.drawImage(this.getResizedCanvas(), sx, sy, sw, sh, sx, sy, sw, sh);
            ctx.restore();
        } else {
            ctx.drawImage(this.getResizedCanvas(), 0, 0);
        }
        ctx.globalCompositeOperation = oldGCO;
    },
    
    getTempContext: function(copy, copyClip) {
        return this.getTempCanvas(copy, copyClip).getContext('2d');
    },
    
    getTempCanvas: function(copy, copyClip) {
        var size = this.rect.size();
        if (!this._tempCanvas) {
            this._tempCanvas = uiUtils.createCanvas(size);
            this._tempCanvas.className = 'jscpc-tempcanvas';
            this._inner.appendChild(this._tempCanvas);
        } else {
            if (size.width != this._tempCanvas.width) {
                this._tempCanvas.width = size.width;
            }
            if (size.height != this._tempCanvas.height) {
                this._tempCanvas.height = size.height;
            }
        }
        if (copy) {
            this.restoreTempCanvasImage(copyClip);
            this.hideCanvas();
        }
        
        this._tempCanvas.style.display = '';
        return this._tempCanvas;
    },
    
    hideCanvas: function() {
        this.canvas.style.display = 'none';
    },
    
    hideTempCanvas: function() {
        this.canvas.style.display = '';
        if (this._tempCanvas) {
            this._tempCanvas.style.display = 'none';
            this._tempCanvas.style.opacity = 1;
            var ctx = this._tempCanvas.getContext('2d');
            graphUtils.resetGlobals(ctx);
            ctx.clearRect(0, 0, this._tempCanvas.width, this._tempCanvas.height);
        }
    },
    
    SST_DATA: 'data',
    SST_CANVAS: 'canvas',
    
    _calcRectForSlice: function(rect, allowOut) {
        var thisRect = this._bufRect.set(this.rect).move(-this.rect.left, -this.rect.top);
        if (!rect) {
            rect = thisRect;
        } else {
            rect = (allowOut !== false) ? rect : thisRect.clip(rect);
        }
        return Rect.hasArea(rect) ? rect : null;
    },
    
    getImageData: function(rect) {
        rect = this._calcRectForSlice(rect);
        if (rect) {
            var ctx = this.getResizedCanvas().getContext('2d');
            return new graphUtils.ImageData(ctx, rect);
        } else {
            return null;
        }
    },
    
    getSnapshot: function(rect, allowOut) {
        rect = this._calcRectForSlice(rect, allowOut);
        if (rect) {
            var canvas = uiUtils.createCanvas(rect.size());
            var ctx = canvas.getContext('2d');
            ctx.drawImage(this.getResizedCanvas(), -rect.left, -rect.top);
            return canvas;
        } else {
            return null;
        }
    },
    
    getPixelColor: function(x, y) {
        var ctx = this.getResizedCanvas().getContext('2d');
        var data = ctx.getImageData(x, y, 1, 1);
        return data.data;
    },
    
    _testSize: function(canvas) {
        return !canvas || ((this.rect.width() == canvas.width) && (this.rect.height() == canvas.height));
    },
    
    resized: function() {
        var r = this.visible() && !this._testSize(this.canvas);
        if (!r || !this.canvas) {
            this._resizedCanvas = null;
        }
        return r;
    },
    
    getResizedCanvas: function() {
        if (!this.visible() || !this.canvas) {
            this._resizedCanvas = null;
            return null;
        }
        if (this._testSize(this.canvas)) {
            this._resizedCanvas = null;
            return this.canvas;
        }
        if (this._resizedCanvas) {
            if (!this._testSize(this._resizedCanvas)) {
                this._resizedCanvas = null;
            }
        }
        if (!this._resizedCanvas) {
            this._resizedCanvas = uiUtils.createCanvas(this.canvas, this.rect.size(), true);
        }
        return this._resizedCanvas;
    },
    
    clearResizedCanvas: function() {
        this._resizedCanvas = null;
    },
    
    replaceCanvas: function(newCanvas) {
        var oldCanvas = this.canvas;
        this.canvas = newCanvas;
        var parent = this._inner;
        if (oldCanvas) {
            if (newCanvas) {
                parent.replaceChild(newCanvas, oldCanvas);
            } else {
                parent.removeChild(oldCanvas);
            }
        } else {
            if (newCanvas) {
                parent.insertBefore(newCanvas, parent.firstChild);
            }
        }
        this._resizedCanvas = null;
        return oldCanvas;
    },
    
    resizeByCanvas: function(hideIfNoCanvas) {
        this._resizedCanvas = null;
        if (!this.canvas) {
            if (hideIfNoCanvas) {
                this.hide();
            }
            return this;
        }
        return this.show(this.rect.resize('rb', uiUtils.getImageSize(this.canvas)).saveProportions());
    }
});


var JSCPFrame = utils.createClass(JSCPPicture, {
    constructor: function(dom, elem) {
        JSCPPicture.call(this, dom, elem);
        this._inner.setAttribute('data-bordertype', 'outer');
    },
    
    create: function(srcObject, rect, copy) {
        if (!rect || this.visible()) {
            return this;
        }
        srcObject = srcObject || this._dom.getObject('bg');
        var canvas = srcObject.getSnapshot(rect);
        if (!copy) {
            graphUtils.drawImage(srcObject.canvas, rect, true);
        }
        return this.insert(canvas, rect);
    },
    
    insert: function(canvas, rect) {
        this.replaceCanvas(canvas);
        this.show(rect);
        return this;
    },
    
    draw: function(destObject) {
        if (!this.visible()) {
            return this;
        }
        destObject = destObject || this._dom.getObject('bg');
        graphUtils.drawImage(destObject.canvas, this.rect, false, this.getResizedCanvas());
        return this;
    },
    
    remove: function() {
        if (!this.visible()) {
            return this;
        }
        if (this.canvas) {
            this._inner.removeChild(this.canvas);
            this.canvas = null;
        }
        this._resizedCanvas = null;
        return this.hide();
    }
});

//-----------------------------------------------------------------
var JSCPBackground = utils.createClass(JSCPFrame, {
    constructor: function(dom, elem) {
        JSCPPicture.call(this, dom, elem);
    },
    
    _grips: ['r', 'b', 'rb'],
    _enabledMove: false
});