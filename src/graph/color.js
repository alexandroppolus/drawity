var graphUtils = graphUtils || {};

graphUtils.color = (function() {

    var colorUtils = {
        extactAlpha: function(color) {
            var m = colorAlphaRx.exec(color);
            if (m) {
                return { color: m[1] + m[2] + ')', alpha: parseFloat(m[3]) };
            } else {
                return { color: color, alpha: 1 };
            }
        },
        
        addAlpha: function(color, alpha) {
            var rgba = colorUtils.getRGBA(color);
            rgba[3] = alpha;
            return colorUtils.colorStr(rgba);
        },
        
        checkColor: function(color) {
            return !!colorUtils.getRGBA(color, bufRGBA);
        },
        
        createColor: function() {
            return new ColorConstructor(4);
        },
        
        getRGBA: function(color, buf) {
            if (!color || (typeof color !== 'string')) {
                return null;
            }
            
            color = color.replace(/\s+/g, '').toLowerCase();
            
            if (colorsDict.hasOwnProperty(color)) {
                buf = buf || new ColorConstructor(4);
                return rgbaFromHex(colorsDict[color], buf);
            }
            
            if (hexRx.test(color)) {
                buf = buf || new ColorConstructor(4);
                return rgbaFromHex(color, buf);
            }
            
            var m = rgbaRx.exec(color);
            if (m) {
                if (!m[2] !== !m[6]) {
                    return null;
                }
                var r = parseColorPart(m[3]);
                var g = parseColorPart(m[4]);
                var b = parseColorPart(m[5]);
                var a = m[2] ? parseAlpha(m[6], 1) : 255;
                if (r === null || g === null || b === null || a === null) {
                    return null;
                }
                buf = buf || new ColorConstructor(4);
                buf[0] = r;
                buf[1] = g;
                buf[2] = b;
                buf[3] = a;
                return buf;
            }
            
            return null;
        },
        
        isEqvRGB: function(rgba1, rgba2) {
            return ((rgba1[3] === 0) && (rgba2[3] === 0)) ||
                    (rgba1[3] > 0) && (rgba2[3] > 0) &&
                    (rgba1[0] === rgba2[0]) &&
                    (rgba1[1] === rgba2[1]) &&
                    (rgba1[2] === rgba2[2]);
        },
        
        isEqvRGBA: function(rgba1, rgba2) {
            return ((rgba1[3] === 0) && (rgba2[3] === 0)) ||
                    (rgba1[0] === rgba2[0]) &&
                    (rgba1[1] === rgba2[1]) &&
                    (rgba1[2] === rgba2[2]) &&
                    (rgba1[3] === rgba2[3]);
        },
        
        colorStr: function(rgba) {
            if (rgba[3] > 254) {
                return '#' + hex(rgba[0]) + hex(rgba[1]) + hex(rgba[2]);
            } else {
                return 'rgba(' + rgba[0].toString() + ',' +
                                rgba[1].toString() + ',' +
                                rgba[2].toString() + ',' +
                                (rgba[3] / 255).toFixed(4) + ')';
            }
        },
        
        format: function(color) {
            if (!color || fullHexRx.test(color)) {
                return color && color.toLowerCase();
            }
            var rgba = colorUtils.getRGBA(color, bufRGBA);
            return rgba && colorUtils.colorStr(rgba);
        },
        
        getSafeColors: function() {
            var arr = [];
            for (var r = 0; r < 256; r += 51) {
                for (var g = 0; g < 256; g += 51) {
                    for (var b = 0; b < 256; b += 51) {
                        arr.push('#' + hex(r) + hex(g) + hex(b));
                    }
                }
            }
            return arr;
        }
    };


    var colorAlphaRx = /^\s*(rgb|hsl)a\s*(\([^,]+,[^,]+,[^,]+),\s*([^\)]+)\)\s*$/;
    var fullHexRx = /^#[0-9a-fA-F]{6}$/;
    var hexRx = /^#(?:[0-9a-fA-F]{3}){1,2}$/;
    var rgbaRx = /^(rgb)(a?)\(([0-9]{1,3}%?),([0-9]{1,3}%?),([0-9]{1,3}%?)(,[0-9\.]+)?\)$/;
    var PERCENT_CODE = '%'.charCodeAt(0);
    var ColorConstructor = (typeof Uint8Array === 'function') ? Uint8Array : Array;
    var bufRGBA = new ColorConstructor(4);
    
    function checkCC(num, max) {
        return (typeof num === 'number') && (Math.floor(num) === num) && (0 <= num) && (num <= max);
    }
    
    function hex(n) {
        return n < 16 ? '0' + n.toString(16) : n.toString(16);
    }
    
    function parseColorPart(str) {
        var n = parseInt(str, 10);
        var percent = (str.charCodeAt(str.length - 1) === PERCENT_CODE);
        if (percent && (n > 100) || (n > 255)) {
            return null;
        }
        return percent ? Math.round(n / 100 * 255) : n;
    }
    
    function parseAlpha(str, start) {
        str = start ? str.substr(start) : str;
        var n = parseFloat(str);
        return (!isNaN(n) && n >= 0 && n <= 1) ? Math.round(n * 255) : null;
    }
    
    function rgbaFromHex(hex, buf) {
        var r, g, b;
        if (hex.length === 7) {
            r = hex.substr(1, 2);
            g = hex.substr(3, 2);
            b = hex.substr(5, 2);
        } else {
            r = hex.substr(1, 1);
            g = hex.substr(2, 1);
            b = hex.substr(3, 1);
            r = r + r;
            g = g + g;
            b = b + b;
        }
        buf[0] = parseInt(r, 16);
        buf[1] = parseInt(g, 16);
        buf[2] = parseInt(b, 16);
        buf[3] = 255;
        return buf;
    }
    /*
    var tempCanvasForRGBA = null;
    var tempImageData = null;
    
    function createTempCanvas() {
    
    }
    
    function getTranslateTableForRGB(rgb) {
        
    }
    
    function getResultColorForRGBA(rgba) {
        
    }
    */
    
    
    var colorsDict = {
        aliceblue: '#f0f8ff',
        antiquewhite: '#faebd7',
        aqua: '#00ffff',
        aquamarine: '#7fffd4',
        azure: '#f0ffff',
        beige: '#f5f5dc',
        bisque: '#ffe4c4',
        black: '#000000',
        blanchedalmond: '#ffebcd',
        blue: '#0000ff',
        blueviolet: '#8a2be2',
        brown: '#a52a2a',
        burlywood: '#deb887',
        cadetblue: '#5f9ea0',
        chartreuse: '#7fff00',
        chocolate: '#d2691e',
        coral: '#ff7f50',
        cornflowerblue: '#6495ed',
        cornsilk: '#fff8dc',
        crimson: '#dc143c',
        cyan: '#00ffff',
        darkblue: '#00008b',
        darkcyan: '#008b8b',
        darkgoldenrod: '#b8860b',
        darkgray: '#a9a9a9',
        darkgreen: '#006400',
        darkkhaki: '#bdb76b',
        darkmagenta: '#8b008b',
        darkolivegreen: '#556b2f',
        darkorange: '#ff8c00',
        darkorchid: '#9932cc',
        darkred: '#8b0000',
        darksalmon: '#e9967a',
        darkseagreen: '#8fbc8f',
        darkslateblue: '#483d8b',
        darkslategray: '#2f4f4f',
        darkturquoise: '#00ced1',
        darkviolet: '#9400d3',
        deeppink: '#ff1493',
        deepskyblue: '#00bfff',
        dimgray: '#696969',
        dodgerblue: '#1e90ff',
        feldspar: '#d19275',
        firebrick: '#b22222',
        floralwhite: '#fffaf0',
        forestgreen: '#228b22',
        fuchsia: '#ff00ff',
        gainsboro: '#dcdcdc',
        ghostwhite: '#f8f8ff',
        gold: '#ffd700',
        goldenrod: '#daa520',
        gray: '#808080',
        green: '#008000',
        greenyellow: '#adff2f',
        honeydew: '#f0fff0',
        hotpink: '#ff69b4',
        indianred : '#cd5c5c',
        indigo : '#4b0082',
        ivory: '#fffff0',
        khaki: '#f0e68c',
        lavender: '#e6e6fa',
        lavenderblush: '#fff0f5',
        lawngreen: '#7cfc00',
        lemonchiffon: '#fffacd',
        lightblue: '#add8e6',
        lightcoral: '#f08080',
        lightcyan: '#e0ffff',
        lightgoldenrodyellow: '#fafad2',
        lightgrey: '#d3d3d3',
        lightgreen: '#90ee90',
        lightpink: '#ffb6c1',
        lightsalmon: '#ffa07a',
        lightseagreen: '#20b2aa',
        lightskyblue: '#87cefa',
        lightslateblue: '#8470ff',
        lightslategray: '#778899',
        lightsteelblue: '#b0c4de',
        lightyellow: '#ffffe0',
        lime: '#00ff00',
        limegreen: '#32cd32',
        linen: '#faf0e6',
        magenta: '#ff00ff',
        maroon: '#800000',
        mediumaquamarine: '#66cdaa',
        mediumblue: '#0000cd',
        mediumorchid: '#ba55d3',
        mediumpurple: '#9370d8',
        mediumseagreen: '#3cb371',
        mediumslateblue: '#7b68ee',
        mediumspringgreen: '#00fa9a',
        mediumturquoise: '#48d1cc',
        mediumvioletred: '#c71585',
        midnightblue: '#191970',
        mintcream: '#f5fffa',
        mistyrose: '#ffe4e1',
        moccasin: '#ffe4b5',
        navajowhite: '#ffdead',
        navy: '#000080',
        oldlace: '#fdf5e6',
        olive: '#808000',
        olivedrab: '#6b8e23',
        orange: '#ffa500',
        orangered: '#ff4500',
        orchid: '#da70d6',
        palegoldenrod: '#eee8aa',
        palegreen: '#98fb98',
        paleturquoise: '#afeeee',
        palevioletred: '#d87093',
        papayawhip: '#ffefd5',
        peachpuff: '#ffdab9',
        peru: '#cd853f',
        pink: '#ffc0cb',
        plum: '#dda0dd',
        powderblue: '#b0e0e6',
        purple: '#800080',
        red: '#ff0000',
        rosybrown: '#bc8f8f',
        royalblue: '#4169e1',
        saddlebrown: '#8b4513',
        salmon: '#fa8072',
        sandybrown: '#f4a460',
        seagreen: '#2e8b57',
        seashell: '#fff5ee',
        sienna: '#a0522d',
        silver: '#c0c0c0',
        skyblue: '#87ceeb',
        slateblue: '#6a5acd',
        slategray: '#708090',
        snow: '#fffafa',
        springgreen: '#00ff7f',
        steelblue: '#4682b4',
        tan: '#d2b48c',
        teal: '#008080',
        thistle: '#d8bfd8',
        tomato: '#ff6347',
        turquoise: '#40e0d0',
        violet: '#ee82ee',
        violetred: '#d02090',
        wheat: '#f5deb3',
        white: '#ffffff',
        whitesmoke: '#f5f5f5',
        yellow: '#ffff00',
        yellowgreen: '#9acd32'
    };
    
    return colorUtils;
})();