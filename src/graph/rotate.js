var graphUtils = graphUtils || {};

graphUtils.rotate = (function() {
    
    var transforms = {
        'x'  : function(w, h) { return [-1,  0,  0,  1, w, 0]; },
        'y'  : function(w, h) { return [ 1,  0,  0, -1, 0, h]; },
        '90' : function(w, h) { return [ 0,  1, -1,  0, h, 0]; },
        '180': function(w, h) { return [-1,  0,  0, -1, w, h]; },
        '270': function(w, h) { return [ 0, -1,  1,  0, 0, w]; }
    };
    
    return {
        // angle: 'x', 'y', '90', '180', '270'
        rotateOrto: function(srcCanvas, destCtx, type) {
            var t = transforms[String(type).toLowerCase()];
            if (t) {
                destCtx.save();
                var w = srcCanvas.width, h = srcCanvas.height;
                destCtx.setTransform.apply(destCtx, t(w, h));
                destCtx.drawImage(srcCanvas, 0, 0, w, h, 0, 0, w, h);
                destCtx.restore();
            }
        }
    };
})();