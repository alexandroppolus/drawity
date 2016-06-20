var FilterManager = utils.createClass(EventEmitter, {
    constructor: function(config, paint, runner) {
        EventEmitter.call(this);
        
        this._filterRunner = null;
        this._config = config;
        this._runner = runner;
        this._paint = paint;
        
        this._lastPaintTool = null;
        
        this._filter = null;
        this._filterName = '';
        this._filterMap = {};
    },
    
    setDOM: function(dom) {
        if (!this._dom) {
            this._dom = dom;
            this._filterRunner = new FilterManager.Runner(dom, this._runner);
            
            this._addFilter('brightness', new simpleFilters.Brightness());
            this._addFilter('contrast', new simpleFilters.Contrast());
            this._addFilter('grayscale', new simpleFilters.Grayscale());
            this._addFilter('sepia', new simpleFilters.Sepia());
            this._addFilter('invert', new simpleFilters.Invert());
            this._addFilter('threshold', new simpleFilters.Threshold());
            this._addFilter('saturation', new simpleFilters.Saturation());
            this._addFilter('vibrance', new simpleFilters.Vibrance());
            
            this._addFilter('sharpen', new convolvingFilters.Sharpen());
            this._addFilter('relief', new convolvingFilters.Relief());
            
            this._runner.historyEventEmitter.on('_historyHandlers', this);
        }
    },
    
    destroy: function() {
        this.un();
        this.cancel();
        
        for (var i in this._filterMap) {
            if (this._filterMap.hasOwnProperty(i) && this._filterMap[i]) {
                this._filterMap[i].destroy();
            }
        }
        
        if (this._filterRunner) {
            this._filterRunner.destroy();
        }
        
        this._filterMap = null;
        this._dom = null;
        this._filterRunner = null;
        this._config = null;
        this._paint = null;
        this._runner = null;
    },
    
    _addFilter: function(name, filter) {
        if (name && filter && !this._filterMap[name]) {
            this._filterMap[name] = filter;
            filter.init(this._config, this, this._filterRunner, this._runner, this._dom);
        }
    },
    
    _callFilterMethod: function(method, arg1, srg2) {
        return this._filter ? this._filter[method](arg1, srg2) : null;
    },
    
    current: function(name) {
        if (!this._paint) {
            return this;
        }
        if (name === undefined) {
            return this._filterName;
        }
        var oldFilter = this._filterName;
        if (!name) {
            if (this._filter) {
                this._cancel(null);
                this.emit('change', { name: '', oldName: oldFilter });
            }
            return this;
        }
        if ((typeof name !== 'string') || !this._filterMap.hasOwnProperty(name) || (this._filterName === name)) {
            return this;
        }
        this._cancel(name);
        //this._lastPaintTool = this._paint.tools.current();
        this._paint.tools.current(null);
        this._filterName = name;
        this._filter = this._filterMap[name];
        this._filter.begin();
        //this.emit('begin', {name: name});
        this.emit('change', { name: name, oldName: oldFilter });
        this._filter.redraw();
        return this;
    },
    
    //------------------------------------------------------------
    valueCount: function() {
        return this._callFilterMethod('valueCount') || 0;
    },
    
    minValue: function(i) {
        return this._callFilterMethod('minValue', i);
    },
    
    maxValue: function(i) {
        return this._callFilterMethod('maxValue', i);
    },
    
    getValue: function(i) {
        return this._callFilterMethod('getValue', i);
    },
    
    setValue: function(i, value) {
        this._callFilterMethod('setValue', i, value);
    },
    
    apply: function() {
        if (this._filter) {
            this._applying = true;
            this._filterRunner.apply();
            this._applying = false;
            var oldFilter = this._filterName;
            this._end(null);
            this.emit('change', { name: '', oldName: oldFilter });
        }
    },
    
    cancel: function() {
        this.current(null);
    },
    
    _cancel: function(replaceFilter) {
        if (this._filter) {
            this._filterRunner.end();
            this._end(replaceFilter);
        }
    },
    
    _end: function(replaceFilter) {
        this._filter.end();
        var name = this._filterName;
        this._filter = null;
        this._filterName = '';
        this.emit('end', name);
        //this.emit('end', {name: name, replaceTo: replaceFilter});
        //if (restoreTool !== false) {
            // to-do: restore tool
        //}
    },
    
    _cancelFromHistory: function() {
        if (!this._applying) {
            this.cancel();
            this._filterRunner.clear();
        }
    },
    
    _historyHandlers: {
        changing: function() {
            this._cancelFromHistory();
        },
        running: function() {
            this._cancelFromHistory();
        }
    }
});

FilterManager.Runner = utils.createClass(null, {
    constructor: function(dom, runner) {
        this._dom = dom;
        this._runner = runner;
        this._srcData = null;
        this._destData = null;
    },
    
    destroy: function() {
        this._dom = null;
        this._runner = runner;
        this.clear();
    },
    
    getSourceImageData: function() {
        if (!this._srcData) {
            var obj = this._dom.getActiveLayer();
            var ctx = obj.getResizedCanvas().getContext('2d');
            this._srcData = ctx.getImageData(0, 0, obj.rect.width(), obj.rect.height());
        }
        return this._srcData;
    },
    
    getDestinationImageData: function() {
        if (!this._destData) {
            var obj = this._dom.getActiveLayer();
            var ctx = obj.getResizedCanvas().getContext('2d');
            this._destData = ctx.createImageData(obj.rect.width(), obj.rect.height());
        }
        return this._destData;
    },
    
    preview: function() {
        var obj = this._dom.getActiveLayer();
        var ctx = obj.getTempContext();
        ctx.putImageData(this._destData, 0, 0);
        obj.hideCanvas();
    },
    
    apply: function() {
        if (this._destData) {
            var obj = this._dom.getActiveLayer();
            var objName = obj.getName();
            var command = new PrintCommand(this._destData, 0, 0);
            this._srcData = this._destData;
            this._destData = null;
            this._runner.runToolCommand(objName, command.setConfig(objName, obj.rect.clone(), null));
        }
        this.end();
    },
    
    end: function() {
        this._dom.getActiveLayer().hideTempCanvas();
    },
    
    clear: function() {
        this._srcData = null;
        this._destData = null;
    }
});