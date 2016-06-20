var simpleFilters = {};

simpleFilters.Brightness = utils.createClass(BaseFilter, {
    constructor: function() {
        BaseFilter.call(this);
    },
    
    _ranges: [[-100, 0, 100]],
    
    _calcImageData: function(src, dest, width, height, length) {
        var add = this.getValue(0) * 2;
        src = src.data;
        dest = dest.data;
        
        for (var i = 0; i < length; i += 4) {
            if (src[i + 3] > 1) {
                dest[i] = src[i] + add;
                dest[i + 1] = src[i + 1] + add;
                dest[i + 2] = src[i + 2] + add;
            }
            dest[i + 3] = src[i + 3];
        }
    }
});

simpleFilters.Invert = utils.createClass(BaseFilter, {
    constructor: function() {
        BaseFilter.call(this);
    },
    
    _ranges: [[0, 0, 100]],
    
    _calcImageData: function(src, dest, width, height, length) {
        var k = this.getValue(0) / this.maxValue(0);
        var k1 = 1 - k;
        src = src.data;
        dest = dest.data;
        
        for (var i = 0; i < length; i += 4) {
            if (src[i + 3] > 1) {
                dest[i] = k * (255 - src[i]) + k1 * src[i];
                dest[i + 1] = k * (255 - src[i + 1]) + k1 * src[i + 1];
                dest[i + 2] = k * (255 - src[i + 2]) + k1 * src[i + 2];
            }
            dest[i + 3] = src[i + 3];
        }
    }
});

simpleFilters.Grayscale = utils.createClass(BaseFilter, {
    constructor: function() {
        BaseFilter.call(this);
    },
    
    _ranges: [[0, 0, 100]],
    
    _calcImageData: function(src, dest, width, height, length) {
        var k = this.getValue(0) / this.maxValue(0);
        var k1 = 1 - k;
        src = src.data;
        dest = dest.data;
        
        for (var i = 0; i < length; i += 4) {
            if (src[i + 3] > 1) {
                var r = src[i];
                var g = src[i + 1];
                var b = src[i + 2];
                var v = k * (0.2126 * r + 0.7152 * g + 0.0722 * b);
                //var v = k * (0.333 * r + 0.334 * g + 0.333 * b);
                dest[i] = v + k1 * r;
                dest[i + 1] = v + k1 * g;
                dest[i + 2] = v + k1 * b;
            }
            dest[i + 3] = src[i + 3];
        }
    }
});

simpleFilters.Sepia = utils.createClass(BaseFilter, {
    constructor: function() {
        BaseFilter.call(this);
    },
    
    _ranges: [[0, 0, 100]],
    
    _calcImageData: function(src, dest, width, height, length) {
        var k = this.getValue(0) / this.maxValue(0);
        var k1 = 1 - k;
        src = src.data;
        dest = dest.data;
        
        for (var i = 0; i < length; i += 4) {
            dest[i + 3] = src[i + 3];
            
            if (src[i + 3] > 1) {
                var r = src[i];
                var g = src[i + 1];
                var b = src[i + 2];
                
                dest[i]     = k * ((r * 0.393)+(g * 0.769)+(b * 0.189)) + k1 * r; // red
                dest[i + 1] = k * ((r * 0.349)+(g * 0.686)+(b * 0.168)) + k1 * g; // green
                dest[i + 2] = k * ((r * 0.272)+(g * 0.534)+(b * 0.131)) + k1 * b; // blue
            }
        }
    }
});

simpleFilters.Threshold = utils.createClass(BaseFilter, {
    constructor: function() {
        BaseFilter.call(this);
    },
    
    _ranges: [[0, 40, 255], [0, 60, 255], [0, 90, 255], [0, 140, 255]],
    
    _calcImageData: function(src, dest, width, height, length) {
        src = src.data;
        dest = dest.data;
        var cmpValue0 = this.getValue(0);
        var cmpValue1 = this.getValue(1);
        var cmpValue2 = this.getValue(2);
        var cmpValue3 = this.getValue(3);
        
        for (var i = 0; i < length; i += 4) {
            if (src[i + 3] > 1) {
                var v = (0.2126 * src[i] + 0.7152 * src[i + 1] + 0.0722 * src[i + 2]);
                //v = v < cmpValue0 ? 0 : (v < cmpValue1 ? 128 : 255);
                v = v < cmpValue0 ? 0 : (v < cmpValue1 ? 64 : (v < cmpValue2 ? 128 : (v < cmpValue3 ? 192 : 255)));
                dest[i] = v;
                dest[i + 1] = v;
                dest[i + 2] = v;
            }
            dest[i + 3] = src[i + 3];
        }
    }
});

simpleFilters.Saturation = utils.createClass(BaseFilter, {
    constructor: function() {
        BaseFilter.call(this);
    },
    
    _ranges: [[-100, 0, 100]],
    
    _calcImageData: function(src, dest, width, height, length) {
        src = src.data;
        dest = dest.data;
        var k = -this.getValue(0) / (this.getValue(0) < 0 ? 100 : 25);
 
        for (var i = 0; i < length; i += 4) {
            dest[i + 3] = src[i + 3];
            if (src[i + 3] > 1) {
                var r = src[i];
                var g = src[i + 1];
                var b = src[i + 2];
                
                var max = Math.max(r, g, b);
                
                dest[i] = r + (max - r) * k;
                dest[i + 1] = g + (max - g) * k;
                dest[i + 2] = b + (max - b) * k;
            }
        }
    }
});

simpleFilters.Vibrance = utils.createClass(BaseFilter, {
    constructor: function() {
        BaseFilter.call(this);
    },
    
    _ranges: [[-100, 0, 100]],
    
    _calcImageData: function(src, dest, width, height, length) {
        src = src.data;
        dest = dest.data;
        
        var k = -this.getValue(0) / (this.getValue(0) < 0 ? 100 : 25);

        for (var i = 0; i < length; i += 4) {
            dest[i + 3] = src[i + 3];
            
            if (src[i + 3] > 1) {
                var r = src[i];
                var g = src[i + 1];
                var b = src[i + 2];
                
                var max = Math.max(r, g, b);
                var avg = (r + g + b) / 3;
                var amt = (Math.abs(max - avg) * 2 / 255) * k;
                
                dest[i] = r + (max - r) * amt;
                dest[i + 1] = g + (max - g) * amt;
                dest[i + 2] = b + (max - b) * amt;
            }
        }
    }
});

simpleFilters.Contrast = utils.createClass(BaseFilter, {
    constructor: function() {
        BaseFilter.call(this);
    },
    
    _ranges: [[-100, 0, 100]],
    
    _calcImageData: function(src, dest, width, height, length) {
        src = src.data;
        dest = dest.data;
        
        var k = Math.pow((this.getValue(0) + 100) / 100, 2);

        for (var i = 0; i < length; i += 4) {
            dest[i + 3] = src[i + 3];
            
            if (src[i + 3] > 1) {
                dest[i]     = (((src[i] / 255) - 0.5) * k + 0.5) * 255;
                dest[i + 1] = (((src[i + 1] / 255) - 0.5) * k + 0.5) * 255;
                dest[i + 2] = (((src[i + 2] / 255) - 0.5) * k + 0.5) * 255;
            }
        }
    }
});
