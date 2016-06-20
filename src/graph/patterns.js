var graphUtils = graphUtils || {};

graphUtils.patterns = (function() {

    var MAX_LAST_COUNT = 16;
    var lastPatterns = [];
    
    var patterns = {
        'dots': {
            pixels: [
                [0, 0, 0],
                [0, 1, 0],
                [0, 0, 0]
            ]
        },
        
        'dotsd': {
            pixels: [
                [0, 0, 0, 0],
                [0, 1, 0, 0],
                [0, 0, 0, 0],
                [0, 0, 0, 0]
            ]
        },
        
        'dotsb': {
            pixels: [
                [0, 0, 0, 0],
                [0, 1, 1, 0],
                [0, 1, 1, 0],
                [0, 0, 0, 0]
            ]
        },
        
        'dotsbd': {
            pixels: [
                [0, 0, 0, 0, 0],
                [0, 1, 1, 0, 0],
                [0, 1, 1, 0, 0],
                [0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0]
            ]
        },
    
        'lines0': {
            pixels: [
                [0],
                [1],
                [0]
            ]
        },
        
        'lines0d': {
            pixels: [
                [0],
                [1],
                [0],
                [0]
            ]
        },
        
        'lines0b': {
            pixels: [
                [0],
                [1],
                [1],
                [0]
            ]
        },
        
        'lines0bd': {
            pixels: [
                [0],
                [1],
                [1],
                [0],
                [0]
            ]
        },
        
        'lines45': {
            pixels: [
                [1, 0, 0, 0, 0],
                [0, 1, 0, 0, 0],
                [0, 0, 1, 0, 0],
                [0, 0, 0, 1, 0],
                [0, 0, 0, 0, 1]
            ]
        },
        
        'lines45d': {
            pixels: [
                [1, 0, 0, 0, 0, 0],
                [0, 1, 0, 0, 0, 0],
                [0, 0, 1, 0, 0, 0],
                [0, 0, 0, 1, 0, 0],
                [0, 0, 0, 0, 1, 0],
                [0, 0, 0, 0, 0, 1]
            ]
        },
        
        'lines45b': {
            pixels: [
                [1, 1, 0, 0, 0, 0],
                [0, 1, 1, 0, 0, 0],
                [0, 0, 1, 1, 0, 0],
                [0, 0, 0, 1, 1, 0],
                [0, 0, 0, 0, 1, 1],
                [1, 0, 0, 0, 0, 1]
            ]
        },
        
        'lines45bd': {
            pixels: [
                [1, 1, 0, 0, 0, 0, 0],
                [0, 1, 1, 0, 0, 0, 0],
                [0, 0, 1, 1, 0, 0, 0],
                [0, 0, 0, 1, 1, 0, 0],
                [0, 0, 0, 0, 1, 1, 0],
                [0, 0, 0, 0, 0, 1, 1],
                [1, 0, 0, 0, 0, 0, 1]
            ]
        },
        
        'lines90': {
            pixels: [
                [0, 1, 0]
            ]
        },
        
        'lines90d': {
            pixels: [
                [0, 1, 0, 0]
            ]
        },
        
        'lines90b': {
            pixels: [
                [0, 1, 1, 0]
            ]
        },
        
        'lines90bd': {
            pixels: [
                [0, 1, 1, 0, 0]
            ]
        },
        
        'lines135': {
            pixels: [
                [0, 0, 0, 0, 1],
                [0, 0, 0, 1, 0],
                [0, 0, 1, 0, 0],
                [0, 1, 0, 0, 0],
                [1, 0, 0, 0, 0]
            ]
        },
        
        'lines135d': {
            pixels: [
                [0, 0, 0, 0, 0, 1],
                [0, 0, 0, 0, 1, 0],
                [0, 0, 0, 1, 0, 0],
                [0, 0, 1, 0, 0, 0],
                [0, 1, 0, 0, 0, 0],
                [1, 0, 0, 0, 0, 0]
            ]
        },
        
        'lines135b': {
            pixels: [
                [0, 0, 0, 0, 1, 1],
                [0, 0, 0, 1, 1, 0],
                [0, 0, 1, 1, 0, 0],
                [0, 1, 1, 0, 0, 0],
                [1, 1, 0, 0, 0, 0],
                [1, 0, 0, 0, 0, 1]
            ]
        },
        
        'lines135bd': {
            pixels: [
                [0, 0, 0, 0, 0, 1, 1],
                [0, 0, 0, 0, 1, 1, 0],
                [0, 0, 0, 1, 1, 0, 0],
                [0, 0, 1, 1, 0, 0, 0],
                [0, 1, 1, 0, 0, 0, 0],
                [1, 1, 0, 0, 0, 0, 0],
                [1, 0, 0, 0, 0, 0, 1]
            ]
        }
    };
    
    var pttrns = {
        getAllTypes: function(withEmpty) {
            var types = Object.keys(patterns);
            if (withEmpty) {
                types.unshift('');
            }
            return types;
        },
        
        checkName: function(name) {
            return (typeof name === 'string' && (name === '' || patterns.hasOwnProperty(name)));
        },
        
        getPattern: function(type, color, offsetX, offsetY) {
            var obj = this._getPattern(type, color, offsetX, offsetY);
            return obj ? obj.pattern : null;
        },
        
        getPatternUrl: function(type, color, offsetX, offsetY) {
            var obj = this._getPattern(type, color, offsetX, offsetY);
            return obj ? obj.url : null;
        },
    
        _getPattern: function(type, color, offsetX, offsetY) {
            if (!type || !color || !patterns.hasOwnProperty(type)) {
                return null;
            }
            
            var config = patterns[type];
            var width = config.pixels[0].length;
            var height = config.pixels.length;
            
            offsetX = (offsetX || 0) % width;
            offsetY = (offsetY || 0) % height;
            if (offsetX < 0) {
                offsetX = width + offsetX;
            }
            if (offsetY < 0) {
                offsetY = height + offsetY;
            }
            
            for (var i = 0; i < lastPatterns.length; ++i) {
                if (lastPatterns[i].isMatch(type, color, offsetX, offsetY)) {
                    return lastPatterns[i];
                }
            }
            
            var obj = new PatternWrapper(type, color, offsetX, offsetY);

            lastPatterns.push(obj);
            if (lastPatterns.length > MAX_LAST_COUNT) {
                lastPatterns.shift();
            }
            
            return obj;
        }
    };
    
    // ----------------------------------------------------------------------------------
    var tempCanvas;
    var transparent = [0, 0, 0, 0];
    
    function PatternWrapper(type, color, offsetX, offsetY) {
        this._type = type;
        this._color = color;
        this._offsetX = offsetX;
        this._offsetY = offsetY;
        
        var config = patterns[type];
        
        this.width = config.pixels[0].length;
        this.height = config.pixels.length;
        
        if (!tempCanvas) {
            tempCanvas = document.createElement('canvas');
        }
        tempCanvas.width = this.width;
        tempCanvas.height = this.height;
        
        var ctx = tempCanvas.getContext('2d');
        this._drawPattern(config, ctx);
        
        this.url = tempCanvas.toDataURL('image/png');
        this.pattern = ctx.createPattern(tempCanvas, 'repeat');
    }
    
    PatternWrapper.prototype._drawPattern = function(config, ctx) {
        if (!config._imageData) {
            config._imageData = ctx.createImageData(this.width, this.height);
        }
        
        var color = graphUtils.color.getRGBA(this._color);
        //color[3] = 255;
        
        for (var y = 0; y < this.height; ++y) {
            var destY = this.y(y);
            
            for (var x = 0; x < this.width; ++x) {
                var destX = this.x(x);
                
                graphUtils.imageData.setPixelColor(config._imageData, 
                        destX, destY, config.pixels[y][x] ? color : transparent, true);
            }
        }
        
        ctx.putImageData(config._imageData, 0, 0);
    };
    
    PatternWrapper.prototype.isMatch = function(type, color, offsetX, offsetY) {
        return (this._type === type) &&
                    (this._color === color) &&
                    (this._offsetX === offsetX) &&
                    (this._offsetY === offsetY);
    };
    
    PatternWrapper.prototype.x = function(x) {
        return (this.width + x - this._offsetX) % this.width;
    };
    
    PatternWrapper.prototype.y = function(y) {
        return (this.height + y - this._offsetY) % this.height;
    };
    
    return pttrns;
})();