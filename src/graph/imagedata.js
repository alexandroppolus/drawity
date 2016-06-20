var graphUtils = graphUtils || {};

graphUtils.imageData = {

    copy: function(src, dest) {
        var max = Math.max(src.data.length, dest.data.length);
        src = src.data;
        dest = dest.data;

        for (var i = 0; i < max; ++i) {
            dest[i] = src[i];
        }
    /*
        var left = rect ? Math.max(rect.left, 0) : 0,
            top = rect ? Math.max(rect.top, 0) : 0,
            right = rect ? Math.min(rect.right, imgData.width) : imgData.width,
            bottom = rect ? Math.min(rect.bottom, imgData.height) : imgData.height,
            data = imgData.data;
            
        src = src.data;
        dest = dest.data;
            
        for (var j = top; y < bottom; ++y) {
            var right1 = (imgData.width * y + right) * 4;
            for (var i = right1 - (right - left) * 4; i < right1; ++i) {
                data[i] = color[0];
                data[++i] = color[1];
                data[++i] = color[2];
                data[++i] = color[3];
            }
        }
        */
    },
    
    fillRect: function(imgData, color, rect) {
        var left = rect ? Math.max(rect.left, 0) : 0,
            top = rect ? Math.max(rect.top, 0) : 0,
            right = rect ? Math.min(rect.right, imgData.width) : imgData.width,
            bottom = rect ? Math.min(rect.bottom, imgData.height) : imgData.height,
            width = imgData.width;
            
        imgData = imgData.data;
            
        for (var y = top; y < bottom; ++y) {
            var right1 = (width * y + right) * 4;
            for (var i = right1 - (right - left) * 4; i < right1; ++i) {
                data[i] = color[0];
                data[++i] = color[1];
                data[++i] = color[2];
                data[++i] = color[3];
            }
        }
    },
    
    setPixelColor: function(imgData, x, y, color, alpha) {
        var b = (y * imgData.width + x) * 4,
            d = imgData.data;
        d[b] = color[0];   // r
        d[b + 1] = color[1]; // g
        d[b + 2] = color[2]; // b
        if (alpha) {
            d[b + 3] = color[3]; // a
        }
    }
};

graphUtils.ImageData = (function() {

    var Class = utils.createClass(null, {
        constructor: function(ctx, rect, blank) {
            if (ctx.data && ctx.width && ctx.height) {
                this._imgData = ctx;
            } else {
                if (!rect || typeof rect === 'boolean') {
                    blank = rect;
                    rect = {
                        left: 0,
                        top: 0,
                        right: ctx.canvas.width,
                        bottom: ctx.canvas.height
                    };
                }
                var width = rect.right - rect.left,
                    height = rect.bottom - rect.top;
                this._imgData = blank ?
                    ctx.createImageData(width, height) :
                    ctx.getImageData(rect.left, rect.top, width, height);
            }
            this._rect = {
                left: 0,
                top: 0,
                right: this._imgData.width,
                bottom: this._imgData.height
            };
        },
        
        getData: function() {
            return this._imgData;
        },
        
        width: function() {
            return this._rect.right;
        },
        
        height: function() {
            return this._rect.bottom;
        },
        
        getPixelColor: function(x, y, colorBuf) {
            colorBuf = colorBuf || graphUtils.color.createColor();
            var b = (y * this._imgData.width + x) * 4,
                d = this._imgData.data;
            colorBuf[0] = d[b];   // r
            colorBuf[1] = d[b + 1]; // g
            colorBuf[2] = d[b + 2]; // b
            colorBuf[3] = d[b + 3]; // a
            return colorBuf;
        },
        
        setPixelColor: function(x, y, color, alpha) {
            var b = (y * this._imgData.width + x) * 4,
                d = this._imgData.data;
            d[b] = color[0];   // r
            d[b + 1] = color[1]; // g
            d[b + 2] = color[2]; // b
            if (alpha) {
                d[b + 3] = color[3]; // a
            }
        },
        
        floodFill: function(x, y, newVal, cmpAlpha, replaceAlpha) {
            var isEqvColor = cmpAlpha ? graphUtils.color.isEqvRGBA : graphUtils.color.isEqvRGB;
        
            var beginX = 0, beginY = 0, 
                endX = this._imgData.width, endY = this._imgData.height,
                oldv = this.getPixelColor(x, y),
                buf = graphUtils.color.createColor();
            
            if ((x < 0) || (y < 0) || (x >= endX) || (y >= endY)) { return null; }

            var minX = x, minY = y, maxX = x + 1, maxY = y;
                
            if(isEqvColor(newVal, oldv)) {
                return null;
            }
            if (cmpAlpha && !replaceAlpha && graphUtils.color.isEqvRGB(newVal, oldv)) {
                return null;
            }
            
            var self = this;
            
            function left(x, y) {
                var x0 = x;
                while (x0 > beginX) {
                    if (!isEqvColor(oldv, self.getPixelColor(x0 - 1, y, buf))) { break; }
                    x0--;
                }
                return x0;
            }
            function line(x0, x, y) {
                var x1;
                for (x1 = x0; x1 <= x || ((x1 < endX) && isEqvColor(oldv, self.getPixelColor(x1, y, buf))); ++x1) {
                    self.setPixelColor(x1, y, newVal, replaceAlpha);
                }
                return x1;
            }
            function cicle (x0, x1, y) {
                while (x0 < x1) {
                    if (isEqvColor(oldv, self.getPixelColor(x0, y, buf))) {
                        x0 = fill(x0, y);
                    } else {
                        x0++;
                    }
                }
            }
            function fill (x, y) {
                var x0 = left(x, y);
                var x1 = line(x0, x, y);
                if (y > beginY) { cicle(x0, x1, y - 1); }
                if (y < endY - 1) { cicle(x0, x1, y + 1); }
                if (x0 < minX) { minX = x0; }
                if (x1 > maxX) { maxX = x1; }
                if (y < minY) { minY = y; }
                if (y > maxY) { maxY = y; }
                return x1;
            }
            fill(x, y);
            
            return { 
                left: minX,
                top: minY,
                right: Math.min(maxX, endX),
                bottom: Math.min(maxY + 1, endY)
            };
        },
        
        slice: function(ctx, rect) {
            rect = rect || this._rect;
            var ret = new Class(ctx, rect, true);
            return ret.copyFrom(this, rect);
        },
        
        copyFrom: function(src, srcRect, x, y) {
            srcRect = srcRect || src._rect;
            x = x || 0;
            y = y || 0;
            
            var dx = srcRect.left - x;
            var dy = srcRect.top - y;
            var right = srcRect.left + Math.min(this.width() - x, srcRect.right - srcRect.left);
            var bottom = srcRect.top + Math.min(this.height() - y, srcRect.bottom - srcRect.top);
            var bufColor = graphUtils.color.createColor();
            
            for (var i = srcRect.left; i < right; ++i) {
                for (var j = srcRect.top; j < bottom; ++j) {
                    src.getPixelColor(i, j, bufColor);
                    this.setPixelColor(i - dx, j - dy, bufColor, true);
                }
            }
            
            return this;
        },
        
        fillRect: function(color, rect) {
            rect = rect || this._rect;
            for (var i = rect.left; i < rect.right; ++i) {
                for (var j = rect.top; j < rect.bottom; ++j) {
                    this.setPixelColor(i, j, color, true);
                }
            }
        },
        
        isImageDataWrapper: true
    });
    
    return Class;
})();