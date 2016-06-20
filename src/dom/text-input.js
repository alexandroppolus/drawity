var JSCPTextInput = utils.createClass(JSCPObject, function(base, baseConstr) {

    var bufBorders = [0, 0, 0, 0];
    var bufRect = Rect();
    
    var MIN_SIZE = {
        width: 76,
        height: 40
    };
    
    var SIZE_FOR_MEASURE = {
        width: 4,
        height: 4
    };
    
    var OFFSET = {
        x: 0, y: 0
    };

    return {
        constructor: function(dom, elem) {
            baseConstr.call(this, dom, elem);
            this._font = null;
            this._createAdditionalDOM();
            this._timer = new Timer(200, this._updateSize, this);
            
            this._lastText = null;
            this._lastFont = null;
            this._lastWidth = 0;
            
            var self = this;

            this._onblur = function() {
                self.mode(self.MODE_PREVIEW);
            };
            this._textarea.oninput = function() {
                self._updateSize();
            };
            
            this._textarea.onkeydown = function(e) {
                if (e.keyCode == 9) {
                    e.preventDefault();
                    self.emit('tab');
                    return false;
                }
                if (e.keyCode == 27) {
                    e.preventDefault();
                    self.emit('escape');
                    return false;
                }
            };
            
            this.mode(this.MODE_PREVIEW);
            this.enableDND(true);
        },
        
        _destroy: function() {
            this._textarea.onblur = null;
            this._onblur = null;
            this._timer.stop();
        },
        
        _beforeHide: function() {
            this._textarea.value = '';
            this._clearCanvas();
            this._strings = null;
            this.mode('');
        },
        
        _hide: function() {
            
        },
        
        _grips: [],
        _enabledMove: false,
        
        _frontClassName: 'jscpc-objparent-abs jscpc-objparent-text-front',
        
        _createAdditionalDOM: function() {
            var nodes = uiUtils.createNodes('\
<div class="jscpc-obj_inner jscpc-dashborder" data-bordertype="outer" data-grip="move" data-event-click="beginedit">\
<div class="jscpc-ti_editor"><textarea></textarea></div>\
<div class="jscpc-ti_toolbar" data-grip="none">\
<div class="jscpc-button24 jscpc-image-cancel24" data-event-click="btnclose"></div>\
<div class="jscpc-button24 jscpc-image-ok24" data-event-click="applytext"></div>\
</div>\
</div>\
<div class="jscpc-ti_preview">\
<canvas width="1" height="1"></canvas>\
</div>\
');
        
            this._frontInner = this.appendChild(nodes[0], 'front');
            
            var editor = this._frontInner.querySelector('.jscpc-ti_editor');
            this._textarea = editor.firstChild;
            
            var preview = this.appendChild(nodes[1], 'inner');
            this._canvas = preview.firstChild;
        },
        
        _selfHandlers: {
            btnclose: function() {
                this.hide();
            },
            beginedit: function() {
                this.mode(this.MODE_EDIT);
            }
        },
        
        showAt: function(left, top) {
            this.rect.moveTo(left, top);
            if (this.rect.width() < 1) {
                this.rect.right = left + MIN_SIZE.width;
            }
            if (this.rect.height() < 1) {
                this.rect.bottom = top + MIN_SIZE.height;
            }
            this.show(this.rect);
        },
        
        getMinSize: function() {
            return MIN_SIZE;
        },
        
        getStrings: function() {
            return this._strings;
        },
        
        getText: function() {
            return this._textarea.value;
        },
        
        setFont: function(opts) {
            this.ctxOptions = graphUtils.text.makeTextOptions(opts);
            this.lineHeight = opts.fontSize + 2;
            this._textarea.style.font = this.ctxOptions.font;
            this._textarea.style.lineHeight = this.lineHeight + 'px';
            this._updateUI();
        },
        
        getOffset: function() {
            return OFFSET;
        },
        
        _updateUI: function() {
            if (!this.visible()) {
                return;
            }
            this._updateSize();
            this._previewText();
        },
        
        _clearCanvas: function() {
            //this._canvas.width = this._canvas.width;
            var ctx = this._canvas.getContext('2d');
            ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
        },
        
        _previewText: function() {
            if (!this.visible() || (this.mode() !== this.MODE_PREVIEW)) {
                return;
            }
            if (this._canvas.width < this.rect.width()) {
                this._canvas.width = this.rect.width();
            }
            if (this._canvas.height < this.rect.height()) {
                this._canvas.height = this.rect.height();
            }
            var ctx = this._canvas.getContext('2d');
            ctx.clearRect(0, 0, this.rect.width(), this.rect.height());
            //console.log(this.ctxOptions);
            graphUtils.setOptions(ctx, this.ctxOptions);
            graphUtils.text.drawText(ctx, this._strings, this.getOffset(), this.lineHeight);
        },
        
        _updateSize: function() {
            if (!this.ctxOptions || !this.ctxOptions.font) {
                return;
            }
            var text = this._textarea.value;
            //var width = ...;
            
            if ((this._lastText === text) &&
                (this._lastFont === this.ctxOptions.font)) {
                return;
            }
            
            this._lastText = text;
            this._lastFont = this.ctxOptions.font;
            
            if (text) {
                uiUtils.setSize(this._textarea, SIZE_FOR_MEASURE);
                
                this.rect.setSize('rb', {
                    width: Math.max(this._textarea.scrollWidth, MIN_SIZE.width),
                    height: Math.max(this._textarea.scrollHeight + 5, MIN_SIZE.height)
                });
                //console.log(this._textarea.scrollHeight);
                this._textarea.style.height = this._textarea.style.width = '';
                
            } else {
                this.rect.setSize('rb', MIN_SIZE.width);
            }
            
            this.show(this.rect);
        },
        
        _changeMode: function(newValue, oldValue) {
            if (newValue === 'edit') {
                this._timer.start();
                this._textarea.focus();
                var self = this;
                setTimeout(function() {
                    self._textarea.onblur = self._onblur;
                }, 200);
            } else {
                this._textarea.onblur = null;
            }
            if (newValue === 'preview') {
                this._timer.stop();
                //if (!this._textarea.value) {
                 //   this.hide();
                //} else {
                if (this.visible()) {
                    this._strings = uiUtils.textSplit(this._textarea);
                    this._previewText();
                }
            }
        },
        
        MODE_EDIT: 'edit',
        MODE_PREVIEW: 'preview',
        
        insert: function(rect, text, font) {
            this.select(rect);
            this._textarea.value = text;
            this.setFont(font);
        }
    };
 });