var graphUtils = graphUtils || {};

graphUtils.copyImage = function(src, dest, scale) {
    var ctx = dest.getContext('2d');
    var srcWidth = src.naturalWidth || src.width;
    var srcHeight = src.naturalHeight || src.height;
    if (!srcWidth || !srcHeight) {
        return dest;
    }
    var destWidth = scale ? dest.width : srcWidth;
    var destHeight = scale ? dest.height : srcHeight;
    ctx.drawImage(src, 0, 0, srcWidth, srcHeight, 0, 0, destWidth, destHeight);
    return dest;
};
        
graphUtils.drawImage = function(canvas, rect, clear, image) {
    var ctx = canvas.getContext('2d');
    var w = rect.right - rect.left, h = rect.bottom - rect.top;
    if (clear) {
        ctx.clearRect(rect.left, rect.top, w, h);
    }
    if (image) {
        ctx.drawImage(image, 0, 0, w, h, rect.left, rect.top, w, h);
    }
};

graphUtils.resetGlobals = function(ctx) {
    ctx.globalCompositeOperation = 'source-over';
};

graphUtils.setOptions = function(ctx, options) {
    if (options) {
        for (var i in options) {
            if (options.hasOwnProperty(i) && (options[i] != null)) {
                ctx[i] = options[i];
            }
        }
    }
};

graphUtils.setCtxShapeOptions = function(ctx, options) {
    ctx.strokeStyle = options.color;
    ctx.lineWidth = options.lineWidth;
    ctx.lineCap = options.lineCap;
    ctx.lineJoin = options.lineJoin;
    ctx.fillStyle = options.fillColor;
};
