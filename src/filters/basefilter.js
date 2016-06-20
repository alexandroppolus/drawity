var BaseFilter = utils.createClass(null, {
    constructor: function() {
        this._started = false;
        
        this._valueCount = this._ranges.length;
        this._values = [];
        this._canRedraw = false;
    },
    
    _ranges: [],
    
    init: function(config, manager, filterRunner, runner, dom) {
        this._config = config;
        this._manager = manager;
        this._filterRunner = filterRunner;
        this._runner = runner;
        this._dom = dom;
        this._init();
    },
    
    destroy: function() {
        this.cancel();
        this._destroy();
        this._config = null;
        this._manager = null;
        this._runner = null;
        this._dom = null;
        this._filterRunner = null;
    },
    
    begin: function() {
        if (!this._started) {
            this._started = true;
            for (var i = 0; i < this._valueCount; ++i) {
                this._values[i] = this._ranges[i][1];
            }
            this._begin();
        }
    },

    end: function() {
        if (this._started) {
            this._started = false;
            this._end();
            this._values = [];
            this._canRedraw = false;
        }
    },
    
    redraw: function() {
        this._canRedraw = true;
        this._redraw();
    },
    
    valueCount: function() {
        return this._valueCount;
    },
    
    minValue: function(i) {
        return i < this._valueCount ? this._ranges[i][0] : null;
    },
    
    maxValue: function(i) {
        return i < this._valueCount ? this._ranges[i][2] : null;
    },
    
    getValue: function(i) {
        return i < this._valueCount ? this._values[i] : null;
    },
    
    setValue: function(i, value) {
        if (i < this._valueCount && typeof value === 'number') {
            value = utils.between(this._ranges[i][0], Math.round(value), this._ranges[i][2]);
            if (value !== this._values[i]) {
                this._values[i] = value;
                this._redraw();
            }
        }
    },
    
    _redraw: function() {
        if (!this._canRedraw) {
            return;
        }
        var srcImageData = this._filterRunner.getSourceImageData();
        var destImageData = this._filterRunner.getDestinationImageData();
        
        this._calcImageData(srcImageData, destImageData,
                    srcImageData.width, srcImageData.height,
                    srcImageData.data.length);
                    
        this._filterRunner.preview();
    },
    
    // virtual functions
    _calcImageData: function(src, dest, width, height, length) {},
    _init: function() {},
    _destroy: function() {},
    _begin: function() {},
    _end: function() {}
});
