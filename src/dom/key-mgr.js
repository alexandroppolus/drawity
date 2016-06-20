var KeyManager = (function() {

    /*
    events: 
        copy
        cut
        pasteImage
        del
        enter
        move
        escape
        requestCopyData
    */
    
    var Class = utils.createClass(EventEmitter, {
        constructor: function(config) {
            EventEmitter.call(this);
            this._config = config;
            this._kbEvents = utils.bindAll(this._kbEvents, this);
            this._createDOM();
            
            //this._focusByTimer = utils.bind(this.focus, this);
            this._focusTimer = new Timer(300, this.focus, this, true);
        },
        
        destroy: function() {
            this.un();
            this._focusTimer.stop();
            uiUtils.removeListeners(this._kbHandler, this._kbEvents);
            this._parent.parentNode.removeChild(this._parent);
            this._parent = null;
            this._kbEvents = null;
            this._kbHandler = null;
        },
        
        _createDOM: function() {
            this._parent = uiUtils.createElement('.jscpc-kbparent');
            document.body.appendChild(this._parent);
            this._replaceHandler(false);
        },
        
        _replaceHandler: function(focus) {
            //console.log('_replaceHandler', focus);
            uiUtils.removeListeners(this._kbHandler, this._kbEvents);
            this._kbHandler = uiUtils.createElement('.jscpc-kb-handler');
            this._kbHandler.setAttribute('contenteditable', 'true');
            this._parent.appendChild(this._kbHandler);
            uiUtils.addListeners(this._kbHandler, this._kbEvents);
            if (focus !== false) {
                //console.log('restart timer');
                this._focusTimer.stop().start();
            }
        },
        
        _kbEvents: {
            paste: function(e) {
                html5.getImageFromEvent(e, this._pasteImage, this, this._replaceHandler);
            },
            
            copy: function(e) {
                this._handleCopyEvent(e);
            },
            
            cut: function(e) {
                if (this._handleCopyEvent(e)) {
                    this.emit('del', { event: e });
                }
            },
            
            keydown: function(e) {
                var param;
                e = e || window.event;
                var eventData = keyCodeMap[e.keyCode];
                if (eventData) {
                    if (eventData.preventDefault) {
                        e.preventDefault();
                    } else {
                        //setTimeout(this._focusByTimer, 100);
                        this._focusTimer.stop().start();
                    }
                    if (!eventData.cmdKeyTest || e.ctrlKey || e.metaKey) {
                        param = { event: e };
                        if (eventData.command === 'move') {
                            param.direction = moveCodeMap[e.keyCode];
                        }
                        this.emit(eventData.command, param);
                    }
                    return;
                }
                //setTimeout(this._focusByTimer, 300);
                this._focusTimer.stop().start();
            }
        },
        
        _handleCopyEvent: function(e) {
            var text = this.emit('requestCopyData', e.type, true);
            if (text) {
                if (this._insertToCB(text, e) === false) {
                    e.preventDefault();
                }
                return true;
            }
            return false;
        },
        
        _setSelection: function() {
            if (!this._kbHandler) {
                return;
            }
            if (!this._kbHandler.firstChild || this._kbHandler.firstChild.nextSibling || (this._kbHandler.firstChild.nodeType != 3)) {
                this._kbHandler.innerHTML = '1';
            } else {
                if (!this._kbHandler.firstChild.data || (this._kbHandler.firstChild.data.length > 5)) {
                    this._kbHandler.firstChild.data = '1';
                }
            }
            //console.log(this._kbHandler.firstChild);
            try {
                window.getSelection().selectAllChildren(this._kbHandler);
            } catch(exc) {
                //console.log('********* error getSelection **********');
            }
        },
        
        focus: function() {
            if (!this._focusTimer.started()) {
                this._setSelection();
                this._kbHandler.focus();
            }
        },
        
        _insertToCB: function(data, event) {
            if (event.clipboardData && event.clipboardData.setData) {
                try {
                    event.clipboardData.setData('text/plain', data);
                    return false;
                } catch (exc1) {}
            }
            
            if (window.clipboardData && window.clipboardData.setData) {
                try {
                    if (window.clipboardData.setData('Text', data)) {
                        return false;
                    }
                } catch (exc2) {}
            }
            
            this._kbHandler.innerHTML = data;
            window.getSelection().selectAllChildren(this._kbHandler);
            this._focusTimer.stop().start();
            //setTimeout(this._focusByTimer, 100);
        },
        
        _pasteImage: function(imgData) {
            if (imgData.img || imgData.url) {
                this.emit('pasteImage', imgData);
            }
        }
    });
    
    var keyCodeMap = {
        /* tab */
        9: { 
            preventDefault: true,
            command: 'tab'
        },
        
        /* tab */
        13: {
            preventDefault: true,
            command: 'enter'
        },
        
        /* escape */
        27: {
            preventDefault: true,
            command: 'escape'
        },
        
        /* delete */
        46: {
            preventDefault: true,
            command: 'del'
        },
        
        /* move */
        37: {
            preventDefault: true,
            command: 'move'
        },
        
        /* a (selectAll) */
        65: {
            preventDefault: true,
            command: 'selectAll',
            cmdKeyTest: true
        },
        
        /* y (redo) */
        89: {
            preventDefault: true,
            command: 'redo',
            cmdKeyTest: true
        },
        
        /* z (undo) */
        90: {
            preventDefault: true,
            command: 'undo',
            cmdKeyTest: true
        }
    };
    
    keyCodeMap[38] = keyCodeMap[39] = keyCodeMap[40] = keyCodeMap[37];
    
    var moveCodeMap = {
        37: { name: 'left', dx: -1, dy: 0 },
        38: { name: 'top', dx: 0, dy: -1 },
        39: { name: 'right', dx: 1, dy: 0 },
        40: { name: 'bottom', dx: 0, dy: 1 }
    };
    
    return Class;
})();