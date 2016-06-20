var graphUtils = graphUtils || {};

graphUtils.text = (function() {

    return {
        makeFont: function(options) {
            return (options.fontBold ? 'bold ' : '') +
                    (options.fontItalic ? 'italic ' : '') +
                    options.fontSize + 'px ' + options.fontFamily;
        },
        
        makeTextOptions: function(config) {
            var options = {};
            options.fillStyle = config.color;
            options.font =  this.makeFont(config);
            return options;
        },
        
        drawText: function(ctx, strings, pos, lineHeight) {
            if (!strings) {
                return;
            }
            ctx.textBaseline = 'top';
            var top = pos.y;
            for (var i = 0; i < strings.length; ++i) {
                ctx.fillText(strings[i], pos.x, top);
                top += lineHeight;
            }
        },
        
        checkFont: function(font) {
            return true;
        }
    };
})();