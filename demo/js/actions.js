define(['event-emitter', 'app/paint-inst', 'file-saver'],
function(EventEmitter, paintInst) {

    var optionForTools = {
        curve: ['curve'],
        drawLine: ['line'],
        drawShape: ['rect', 'roundrect', 'ellipse'],
        picker: ['picker'],
        
        penForm: ['pen', 'eraser'],
        lineCap: ['line', 'curve'],
        lineWidth: ['pen', 'eraser', 'line', 'curve', 'rect', 'roundrect', 'ellipse'],
        rectRadius: ['roundrect'],
        
        fontBold: ['text'],
        fontItalic: ['text'],
        fontSize: ['text'],
        fontFamily: ['text']
    };

    return EventEmitter.mixin({
        init: function() {
            var paint = paintInst();
            window.__paint = paint; // for experiments in console
            paint.history.on('change', this._historyChange, this);
            paint.tools.on('change', this._toolChange, this);
            paint.filters.on('change', this._filterChange, this);
            paint.tools.options.on('set', this._optionChange, this);
        },
        
        run: function(action, param, value) {
            //console.log(action, param, value);
            action = this._actions[action];
            if (action) {
                action(param, value);
            }
        },
        
        _actions: {
            newImage: function() {
                paintInst().newImage();
            },
        
            open: function(param, value) {
                if (!value) {
                    value = prompt('Url:');
                }
                paintInst()[param](value);
            },

            save: function(param) {
                paintInst().toBlob((blob) => {
                    saveAs(blob, 'drawityimage.' + param);
                }, 'image/' + param);
            },

            
            selectAll: function() {
                paintInst().createObject('all');
            },
            
            hideSelection: function() {
                paintInst().hideSelection();
                paintInst().removeObject(true);
            },
        
            history: function(param) {
                paintInst().history[param]();
            },
            
            rotate: function(param) {
                paintInst().rotate(param);
            },
        
            tool: function(param, value) {
                paintInst().tools.current(value);
            },
            
            option: function(param, value) {
                paintInst().tools.options.set(param, value);
            },
            
            filter: function(param, value) {
                if (typeof param == 'number') {
                    paintInst().filters.setValue(param, value);
                    return;
                }
                if (!param) {
                    paintInst().filters.current(value);
                    return;
                }
                if (param == 'apply' || param == 'cancel') {
                    paintInst().filters[param]();
                    paintInst().focus();
                }
            }
        },
        
        getValue: function(action, param) {
            var v = this._value[action];
            return v ? v(param) : void(0);
        },
        
        _value: {
            tool: function() {
                return paintInst().tools.current();
            },
            
            filter: function() {
                return paintInst().filters.current();
            },
            
            option: function(param) {
                return paintInst().tools.options.get(param);
            }
        },
        
        
        isEnabled: function(action, param, value) {
            action = this._enables[action];
            return action ? action(param, value) : true;
        },
        
        _enables: {
            history: function(param, value) {
                return paintInst().history[param + 'Length']() > 0
            },
            
            option: function(param, value) {
                var tools = optionForTools[param];
                var tool = paintInst().tools.current();
                return !!tools && !!tool && (tools.indexOf(tool) >= 0);
            }
        },
        
        _toolChange: function() {
            this.emit('change:tool');
            this.emit('enabled:option');
        },
        
        _filterChange: function() {
            this.emit('change:filter');
        },
        
        _optionChange: function() {
            this.emit('change:option');
        },
        
        _historyChange: function() {
            this.emit('enabled:history');
        }
    });
});