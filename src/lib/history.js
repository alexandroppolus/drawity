var CommandHistory = (function() {

    /* events: 
     - redoclear, 
     - clear, 
     - change (after undo/redo/run), 
     - changing (before undo/redo), 
     - running (before run), 
    */

    function CommandHistory(maxSize, eventEmitter) {
        this._maxSize = maxSize || 0;
        this._stack = [];
        this._batchCmd = null;
        this._batchDepth = 0;
        this._stackPtr = 0;
        this._eventEmitter = eventEmitter;
        this.readOnly = false;
    }

    CommandHistory.prototype = {
        constructor: CommandHistory,
        
        undoLength: function() {
            return this._stackPtr;
        },
        
        redoLength: function() {
            return this._stack.length - this._stackPtr;
        },
        
        isEmpty: function() {
            return !this._stack.length;
        },
        
        _emit: function(event, data) {
            if (this._eventEmitter) {
                this._eventEmitter.emit(event, data);
            }
        },
        
        _redoClear: function(eventChange) {
            if (this.redoLength()) {
                this._emit('redoclear');
                this._stack.length = this._stackPtr;
                if (eventChange) {
                    this._emit('change', 'redoclear');
                }
            }
        },
        
        clear: function(onlyRedo) {
            if (this._stack.length) {
                if (onlyRedo) {
                    this._redoClear(true);
                } else {
                    this._emit('clear');
                    this._stack = [];
                    this._stackPtr = 0;
                    this._batchCmd = null;
                    this._batchDepth = 0;
                    this._emit('change', 'clear');
                }
            }
            return this;
        },
        
        undo: function() {
            if (!this.undoLength() || this._readOnly()) {
                return this;
            }
            this._emit('changing', 'undo');
            this._stackPtr--;
            cmdUndo(this._stack[this._stackPtr]);
            this._emit('change', 'undo');
            return this;
        },
        
        redo: function() {
            if (!this.redoLength() || this._readOnly()) {
                return this;
            }
            this._emit('changing', 'redo');
            return this._redo('redo');
        },
        
        _redo: function(from) {
            cmdRedo(this._stack[this._stackPtr]);
            this._stackPtr++;
            this._emit('change', from);
            return this;
        },
        
        run: function(cmd, groupId) {
            if (!cmd || this.readOnly) {
                return this;
            }
            this._emit('running');
            
            if (this.redoLength()) {
                this._redoClear(false);
            }
            
            cmd.groupId = cmd.groupId || groupId;
            
            var parentCmd = this._batchCmd ||
                (!this._batchDepth && cmd.groupId && this._stackPtr &&
                    (this._stack[this._stackPtr - 1].groupId === cmd.groupId) &&
                     this._stack[this._stackPtr - 1]);
            
            if (parentCmd) {
                cmdAppend(parentCmd, cmd);
            } else {
                if ((this._maxSize > 0) && (this._stack.length == this._maxSize)) {
                    this._stack.shift();
                    this._stackPtr--;
                }
                
                this._stack.push(cmd);
                if (this._batchDepth) {
                    this._batchCmd = cmd;
                }
                this._redo('run');
            }
            return this;
        },
        
        beginBatch: function() {
            this._batchDepth++;
            return this;
        },
        
        endBatch: function(all) {
            if (this._batchDepth) {
                this._batchDepth = all ? 0 : this._batchDepth - 1;
                if (!this._batchDepth) {
                    this._batchCmd = null;
                }
            }
            return this;
        },
        
        isBatchMode: function() {
            return !!this._batchDepth;
        },
        
        _readOnly: function() {
            return this.readOnly || this._batchDepth;
        }
    };
    
    function cmdUndo(cmd) {
        if (cmd.__tail) {
            for (var i = cmd.__tail.length - 1; i >= 0; --i) {
                cmd.__tail[i].undo();
                cmd.__tail[i].done = false;
            }
        }
        cmd.undo();
        cmd.done = false;
    }
    
    function cmdRedo(cmd) {
        cmd.redo();
        cmd.done = true;
        if (cmd.__tail) {
            for (var i = 0; i < cmd.__tail.length; ++i) {
                cmd.__tail[i].redo();
                cmd.__tail[i].done = true;
            }
        }
    }
    
    function cmdAppend(parentCmd, cmd) {
        var added = false;
        var lastCmd = parentCmd.__tail ? parentCmd.__tail[parentCmd.__tail.length - 1] : parentCmd;
        
        if (lastCmd.groupId && (lastCmd.groupId === cmd.groupId) && (typeof lastCmd.appendCommand === 'function')) {
            added = lastCmd.appendCommand(cmd);
        }
        
        if (!added) {
            if (!parentCmd.__tail) {
                parentCmd.__tail = [];
            }
            parentCmd.__tail.push(cmd);
        }
        cmd.redo();
        cmd.done = true;
    }
    
    return CommandHistory;
})();