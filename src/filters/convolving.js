convolvingFilters = {
    convolving: function(src, dest, width, height, matrix) {
        var src = src.data;
        var dest = dest.data;

        var width4 = width * 4;
        
        for (var y = 0; y < height; ++y) {
            var lastY = (y === height - 1);
            for (var x = 0; x < width; ++x) {
                var pos = (y * width + x) * 4;
                dest[pos + 3] = src[pos + 3];
                
                if (dest[pos + 3] > 1) {
                    var lastX = (x === width - 1);
                    var r = 0, g = 0, b = 0;
                    var matrixPos = -1;
                
                    for (var i = -width4; i <= width4; i += width4) {
                        for (var j = -4; j <= 4; j += 4) {
                            var srcPos = pos +
                                (!y && i < 0 || lastY && i > 0 ? 0 : i) +
                                (!x && j < 0 || lastX && j > 0 ? 0 : j);
                                
                            var k = matrix[++matrixPos];
                            
                            r += src[srcPos] * k;
                            g += src[srcPos + 1] * k;
                            b += src[srcPos + 2] * k;
                        }
                    }
                    
                    dest[pos] = r;
                    dest[pos + 1] = g;
                    dest[pos + 2] = b;
                }
            }
        }
    }
};

convolvingFilters.Sharpen = utils.createClass(BaseFilter, {
    constructor: function() {
        BaseFilter.call(this);
        this._matrix = [
           0, 0, 0,
           0, 1, 0,
           0, 0, 0
        ];
    },
    
    _levels: [0, 0.2, 0.5, 1, 2, 3],
    
    _ranges: [[0, 0, 5]],
    
    _calcImageData: function(src, dest, width, height, length) {
        var level = this._levels[this.getValue(0)];
        if (level) {
            this._matrix[1] = this._matrix[3] = this._matrix[5] = this._matrix[7] = -level;
            this._matrix[4] = level * 4 + 1;
            convolvingFilters.convolving(src, dest, width, height, this._matrix);
        } else {
            graphUtils.imageData.copy(src, dest);
        }
    }
});

convolvingFilters.Relief = utils.createClass(BaseFilter, {
    constructor: function() {
        BaseFilter.call(this);
        this._matrix = [
           0, 0, 0,
           0, 1, 0,
           0, 0, 0
        ];
    },
    
    _ranges: [[0, 0, 10], [0, 0, 24]],
    
    _calcImageData: function(src, dest, width, height, length) {
        var k = this.getValue(0);
        var angle = Math.PI * this.getValue(1) / 12;
        
        if (k) {
            var a = 0;
            var deltaA = Math.PI / 4;
            for (var i = 0; i < 9; ++i) {
                if (i != 4) {
                    this._matrix[i] = -k * Math.cos(angle - a);
                    a += deltaA;
                }
            }
            
            convolvingFilters.convolving(src, dest, width, height, this._matrix);
        } else {
            graphUtils.imageData.copy(src, dest);
        }
    }
});