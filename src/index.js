var JSPaintCore = utils.createClass(EventEmitter, function(base, baseConstr) {

    function emptyFunc() { }

    return {
        constructor: function(rootNode, config) {
            baseConstr.call(this);
            var c = this._config = utils.copy({}, jscpConfig.defConfig, config);
            
            c.minWidth = Math.max(c.minWidth, jscpConfig.constValues.minWidth);
            c.minHeight = Math.max(c.minHeight, jscpConfig.constValues.minHeight);
            c.width = utils.between(c.minWidth, c.width, null /*c.maxWidth*/);
            c.height = utils.between(c.minHeight, c.height, null /*c.maxHeight*/);
            c._minSize = { width: c.minWidth, height: c.minHeight };
            c._minRect = new Rect(c._minSize);
            
            this._dom = null;
            
            this._keyManager = new KeyManager(c);
            this._keyManager.on('_eventsKeyBoard', this);
            
            this._runner = new CommandRunner(c, this);
            
            this.tools   = new ToolManager  (c, this, this._runner, this._keyManager);
            this.filters = new FilterManager(c, this, this._runner);
            this.history = this._runner.getHistory();
            
            this.renderTo(rootNode);
        },
        
        renderTo: function(rootNode) {
            if (!this._dom && rootNode && rootNode.tagName && rootNode.parentNode) {
                var c = this._config
                
                this._dom = new JSCPDOM(rootNode, c);
                this._dom.on('_eventsDOM', this);
                
                this._mouseManager = new MouseManager(c, this._dom, this._dom.root);
                this._mouseManager.on('_eventsMouse', this);
                
                this._runner.setDOM(this._dom);
                this.tools.setDOM(this._dom, this._mouseManager);
                this.filters.setDOM(this._dom);
            }
        },
        
        created: function() {
            return !!this._dom;
        },
        
        destroy: function() {
            this.un();
            this.history.un();
            this._mouseManager.destroy();
            this._keyManager.destroy();
            this._runner.destroy();
            this.tools.destroy();
            this.filters.destroy();
            this._dom.destroy();
            
            this.tools = null;
            this.filters = null;
            this.history = null;
            
			this._dom = null;
            this._mouseManager = null;
            this._keyManager = null;
            this._runner = null;
		},
        
        //------------------------------------------------------------------------------
        
        _eventsDOM: {
            resize: function() {
                this.emit('resize');
            }
        },
        
        _eventsMouse: {
            keyManagerFocus: function() {
                this._keyManager.focus();
            },
            dropImage: function(e) {
                this._insertImageFromEvent(e);
            }
        },
        
        _eventsKeyBoard: {
            pasteImage: function(e) {
                this._insertImageFromEvent(e);
            },
            
            selectAll: function(e) {
                this.createObject('all');
            },
        
            undo: function(e) {
                this.history.undo();
            },
            redo: function(e) {
                this.history.redo();
            }
        },
        
        _insertImageFromEvent: function(data) {
            if (data.img) {
                if (data.fileName && this._config.openDDFiles) {
                    this.openImage(data.img);
                } else {
                    this.insertImage(data.img, data.point);
                }
                return;
            }
            
            if (data.url) {
                this.insertResource(data.url, data.point);
            }
        },
		
		//-- create&run commands ---------------------------------------------------------------------------------------

        resize: function(size) {
            if (!size || !this.created()) {
                return;
            } else {
                size = utils.sizeBetween(this._config._minSize, size);
            }
            if ((size.width == this.width()) && (size.height == this.height())) {
                return;
            }
            
            this._runner.moveObject('bg', new Rect(size));
            this._keyManager.focus();
        },
        
        focus: function() {
            this._keyManager.focus();
        },
        
        crop: function(rect) {
            if (!this.created()) {
                return;
            }
            this._runner.crop(rect);
            this._keyManager.focus();
        },
        
        // --- objects ---
        createObject: function(rect, copy) {
            if (!this.created()) {
                return;
            }
            this.tools.current('select');
            this._runner.createObject(rect, copy);
            this._keyManager.focus();
        },
        
        insertImage: function(image, point) {
            if (!this.created()) {
                return;
            }
            if (!uiUtils.isGoodImage(image)) {
                return;
            }
            var size = uiUtils.getImageSize(image);
            if (!size.width || !size.height) {
                return;
            }
            this.tools.current('select');
            this._runner.insertImage(image, point, size);
            this._keyManager.focus();
        },
        
        removeObject: function(draw) {
            if (!this.created()) {
                return;
            }
            this._runner.removeObject(draw);
            this._keyManager.focus();
        },
        
        //---------------------------------
        newImage: function(size) {
            if (!this.created()) {
                return;
            }
            size = size || {width: this._config.width, height: this._config.height};
            size = utils.sizeBetween(this._config._minSize, size);
            this._runner.newImage(size);
            this._keyManager.focus();
        },
        
        openImage: function(image) {
            if (!this.created()) {
                return;
            }
            if (!uiUtils.isGoodImage(image)) {
                return;
            }
            var size = uiUtils.getImageSize(image);
            if (!size.width || !size.height) {
                return;
            }
            size = utils.sizeBetween(this._config._minSize, size);
            this._runner.newImage(size, image);
        },
        
        //---------------------------------------------------------------------
        
        _getProxyUrl: function(url) {
            return this.emit('getProxyUrl', url, true) || url;
        },
        _getImage: function(blobOrUrl, callback, ctx, success) {
            if (!this.created()) {
                return;
            }
            callback = callback || emptyFunc;
            if (!blobOrUrl) {
                callback.call(ctx, null, this);
                return;
            }
            html5.getImage(blobOrUrl, {
                ctx: this,
                getProxyUrl: this._getProxyUrl,
                useCredentials: false
            }, function(data) {
                if (data.img) {
                    success.call(this, data.img);
                }
                callback.call(ctx, data.error, this);
            }, this);
        },
        
        insertResource: function(blobOrUrl, point, callback, ctx) {
            this._getImage(blobOrUrl, callback, ctx, function(img) {
                this.insertImage(img, point);
            });
        },
        
        openResource: function(blobOrUrl, callback, ctx) {
            this._getImage(blobOrUrl, callback, ctx, this.openImage);
        },
        
        hideSelection: function() {
            if (!this.created()) {
                return;
            }
            this._dom.getSelection().hide();
        },
        
        // type: 'x', 'y', '90', '180', '270'
        rotate: function(type, bgOnly) {
            if (!this.created()) {
                return;
            }
            this.hideSelection();
            var bg = this._dom.getBG();
            var obj = bgOnly ? bg : this._dom.getActiveLayer();
            var newRect = null;
            var oldCanvas = obj.getCanvas();
            var size = uiUtils.getImageSize(oldCanvas);
            if (type === '90' || type === '270') {
                var rcenter = obj.rect.left || obj.rect.top;
                newRect = obj.rect.clone(true).rotate90(rcenter);
                var t = size.width;
                size.width = size.height;
                size.height = t;
            }
            var newCanvas = uiUtils.createCanvas(size);
            graphUtils.rotate.rotateOrto(oldCanvas, newCanvas.getContext('2d'), type);
            
            this._runner.replaceCanvas(obj.getName(), newCanvas, newRect);
        },
        
        //---------------------------------------------------------------------
        
		width: function(outer) {
			return this.created() ? (outer ? this._dom : this._dom.getBG()).rect.width() : 0;
		},
        height: function(outer) {
			return this.created() ? (outer ? this._dom : this._dom.getBG()).rect.height() : 0;
		},
        
        offsetWidth: function(withPadding) {
			return this.created() ? this._dom.rect.width() + (withPadding ? this._config.padding * 2 : 0) : 0;
		},
        offsetHeight: function(withPadding) {
			return this.created() ? this._dom.rect.height() + (withPadding ? this._config.padding * 2 : 0) : 0;
		},
        
		getRootNode: function() {
			return this.created() ? this._dom.root : null;
		},
        
        _getCanvasForSave: function() {
            var cv = this._dom.getBG().getResizedCanvas();
            var frame = this._dom.getObject('frame', true);
            if (!frame) {
                return cv;
            }
            cv = uiUtils.createCanvas(cv);
            var frameCv = frame.getResizedCanvas();
            cv.getContext('2d').drawImage(frameCv, frame.rect.left, frame.rect.top);
            return cv;
        },
        
        _getMimeType: function(mimeType) {
            if (mimeType && !/^image/i.test(mimeType)) {
                mimeType = 'image/' + mimeType;
            }
            return mimeType;
        },
		
		toDataURL: function(mimeType, quality) {
            if (!this.created()) {
                return null;
            }
			mimeType = this._getMimeType(mimeType);
			return this._getCanvasForSave().toDataURL(mimeType, quality);
		},
        
        toBlob: function(callback, mimeType, quality) {
            if (!this.created()) {
                callback && callback(null);
                return null;
            }
			mimeType = this._getMimeType(mimeType);
			return this._getCanvasForSave().toBlob(callback, mimeType, quality);
		}
	};
});
