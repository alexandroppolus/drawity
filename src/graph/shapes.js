var graphUtils = graphUtils || {};

graphUtils.shapes = (function() {

    var shapes = {
        squarePenLine: function(ctx, x1, y1, x2, y2, widthMinus, widthPlus) {
            var x0, y0;
            if ((x1 === x2) || (y1 === y2)) {
                //if ((x1 === x2) && (y1 === y2)) { return; }
                x0 = Math.min(x1, x2);
                y0 = Math.min(y1, y2);
                ctx.rect(x0 - widthMinus, y0 - widthMinus, Math.max(x1, x2) - x0 + widthMinus + widthPlus, Math.max(y1, y2) - y0 +  widthMinus + widthPlus);
                return;
            }
            if (x2 < x1) {
                x0 = x1;
                x1 = x2;
                x2 = x0;
                y0 = y1;
                y1 = y2;
                y2 = y0;
            }
            ctx.moveTo(x1 - widthMinus, y1 - widthMinus);
            if (y2 > y1) {
                ctx.lineTo(x1 + widthPlus, y1 - widthMinus);
            } else {
                ctx.lineTo(x2 - widthMinus, y2 - widthMinus);
            }
            ctx.lineTo(x2 + widthPlus, y2 - widthMinus);
            ctx.lineTo(x2 + widthPlus, y2 + widthPlus);
            if (y2 > y1) {
                ctx.lineTo(x2 - widthMinus, y2 + widthPlus);
            } else {
                ctx.lineTo(x1 + widthPlus, y1 + widthPlus);
            }
            ctx.lineTo(x1 - widthMinus, y1 + widthPlus);
        },
        
        useFillPath: function(lineWidth, penForm) {
            return (penForm !== 'round') && (lineWidth > 2);
        },
        
        _drawStrokePath: function(ctx, path, width) {
            var add = (width % 2) ? 0.5 : 0;
            
            if (path.length < 4) {
                ctx.arc(path[0] + add, path[1] + add, width / 2, 0, Math.PI * 2);
                ctx.fillStyle = ctx.strokeStyle;
                ctx.fill();
                return;
            }
            
            ctx.moveTo(path[0] + add, path[1] + add);
            for (var i = 3; i < path.length; i += 2) {
                ctx.lineTo(path[i - 1] + add, path[i] + add);
            }
            ctx.stroke();
        },
        
        _drawFillPath: function(ctx, path, width) {
            var widthMinus = Math.floor(width / 2 + 0.000001);
            var widthPlus = Math.ceil(width / 2 - 0.000001);
            
            if (path.length < 4) {
                this.squarePenLine(ctx, path[0], path[1], path[0], path[1], widthMinus, widthPlus);
                ctx.fill();
                return;
            }
            
            for (var i = 3; i < path.length; i += 2) {
                this.squarePenLine(ctx, path[i - 3], path[i - 2], path[i - 1], path[i], widthMinus, widthPlus);
            }
            ctx.fill();
        },
        
        // path: [x0, y0, x1, y1, ..., xN, yN]
        drawPath: function(ctx, path, lineWidth, penForm) {
            if (!path || (path.length < 2)) {
                return;
            }
            lineWidth = lineWidth || 1;
            var useFillPath = this.useFillPath(lineWidth, penForm);
            ctx.beginPath();
            if (useFillPath) {
                this._drawFillPath(ctx, path, lineWidth);
            } else {
                this._drawStrokePath(ctx, path, lineWidth);
            }
        },
        
        _getColor: function(color, drawValue) {
            return (drawValue === 'erase') ? '#000000' : color;
        },
        
        isEraser: function(drawValue) {
            return ((drawValue === 'erase') || (drawValue === 'parterase'));
        },
        
        _setGCO: function(options, drawValue) {
            if (this.isEraser(drawValue)) {
                options.globalCompositeOperation = 'destination-out';
            }
        },
        
        getDrawStyle: function(config, color, rect) {
            return config.drawPattern ?
                graphUtils.patterns.getPattern(config.drawPattern, color, rect ? rect.left : 0, rect ? rect.top : 0) :
                color;
        },
        
        makePenOptions: function(config, forcedColor, rect, eraser) {
            var options = {};
            var color = this._getColor(forcedColor || config.color, eraser && 'erase'/*config.drawPen*/);
            color = this.getDrawStyle(config, color, rect);
            var lineWidth = config.lineWidth || 1;
            options.fillStyle = color;
            var useFillPath = this.useFillPath(lineWidth, config.penForm);
            if (!useFillPath) {
                options.strokeStyle = color;
                options.lineWidth = lineWidth;
                options.lineCap = lineWidth > 1 ? 'round' : 'square';
                options.lineJoin = 'round';
            }
            this._setGCO(options, eraser && 'erase'/*config.drawPen*/);
            return options;
        },
        
        compressPath: function(path) {
            if (!path || (path.length < 6)) {
                return path;
            }
            var pos = 3;
            var x1 = path[0], y1 = path[1], x2 = path[2], y2 = path[3];
            for (var i = 5; i < path.length; i += 2) {
                var x3 = path[i - 1], y3 = path[i];
                
                var canCollapse = ((x1 === x2) && (x2 === x3) && (y1 >= y2 === y2 >= y3)) ||
                                    ((y1 === y2) && (y2 === y3) && (x1 >= x2 === x2 >= x3)) ||
                                    ((y3 - y2 === y2 - y1) && (x3 - x2 === x2 - x1));
                
                if (canCollapse) {
                    x2 = path[pos - 1] = x3;
                    y2 = path[pos] = y3;
                } else {
                    x1 = x2;
                    y1 = y2;
                    x2 = path[i - 1];
                    y2 = path[i];
                    pos += 2;
                    if (pos + 2 <= i) {
                        path[pos - 1] = path[i - 1];
                        path[pos] = path[i];
                    }
                }
            }
            path.length = pos + 1;
            return path;
        },
        
        drawLine: function(ctx, rect) {
            var add = (ctx.lineWidth % 2) ? 0.5 : 0;
            ctx.beginPath();
            ctx.moveTo(rect.left + add, rect.top + add);
            ctx.lineTo(rect.right + add, rect.bottom + add);
            ctx.stroke();
        },
        
        drawBezier: function(ctx, points) {
            var add = (ctx.lineWidth % 2) ? 0.5 : 0;
            ctx.beginPath();
            ctx.moveTo(points[0] + add, points[1] + add);
            if (points.length == 4) {
                ctx.lineTo(points[2] + add, points[3] + add);
            }
            if (points.length == 6) {
                ctx.quadraticCurveTo(points[2] + add, points[3] + add, points[4] + add, points[5] + add);
            }
            if (points.length == 8) {
                ctx.bezierCurveTo(points[2] + add, points[3] + add, points[4] + add, points[5] + add, points[6] + add, points[7] + add);
            }
            ctx.stroke();
        },
        
        makeLineOptions: function(config, canErase, rect) {
            var options = {};
            var color = canErase ? this._getColor(config.color, config.drawLine) : config.color;
            color = this.getDrawStyle(config, color, rect);
            var lineWidth = config.lineWidth || 1;
            options.strokeStyle = color;
            options.lineWidth = lineWidth;
            options.lineCap = lineWidth > 1 ? (config.lineCap || 'round') : 'square';
            if (canErase) {
                this._setGCO(options, config.drawLine);
            }
            return options;
        },
        
        makeShapeOptions: function(config, shape, rect) {
            var options = {};
            var lineWidth = config.lineWidth || 1;
            options.strokeStyle = config.color;
            var fillColor = this._getColor(config.fillColor, config.drawShape);
            fillColor = this.getDrawStyle(config, fillColor, rect);
            options.fillStyle = fillColor;
            options.lineWidth = lineWidth;
            
            if ((lineWidth > 1) && (config.lineJoin === 'round')) {
                options.lineCap = 'round';
                options.lineJoin = 'round';
            } else {
                options.lineCap = 'square';
                options.lineJoin = 'miter';
            }
            
            this._setGCO(options, config.drawShape);
            return options;
        },
        
        drawShape: function(ctx, shape, rect, drawShape, options) {
            var lineWidth = (drawShape === 'stroke') || (drawShape === 'both') ? ctx.lineWidth : 0;
            var fill = (drawShape !== 'stroke');
            
            if (!fill && !lineWidth) {
                return;
            }
            
            if (typeof drawShapeFuncs[shape] === 'function') {
                drawShapeFuncs[shape](ctx, rect, fill, lineWidth, options);
            }
        }
    };
    
    var drawShapeFuncs = {
        rect: function(ctx, rect, fill, lineWidth) {
            if (!lineWidth) {
                ctx.fillRect(rect.left, rect.top, rect.right - rect.left + 1, rect.bottom - rect.top + 1);
                return;
            }

            if (fill) {
                var fillDelta = Math.ceil(lineWidth / 2);
                var fillDelta2 = lineWidth - fillDelta;
                var rectWidth = rect.right - rect.left - lineWidth;
                var rectHeight = rect.bottom - rect.top - lineWidth;
                if (rectWidth > 0 && rectHeight > 0) {
                    ctx.fillRect(rect.left + fillDelta, rect.top + fillDelta, rectWidth, rectHeight);
                }
            }

            var add = (lineWidth % 2) ? 0.5 : 0;
            ctx.beginPath();
            ctx.moveTo(rect.left + add, rect.top + add);
            ctx.lineTo(rect.right + add, rect.top + add);
            ctx.lineTo(rect.right + add, rect.bottom + add);
            ctx.lineTo(rect.left + add, rect.bottom + add);
            ctx.lineTo(rect.left + add, rect.top + add);
            ctx.stroke();
        },
        
        _roundrectPath: function(ctx, x1, y1, x2, y2, radius) {
            ctx.beginPath();
            ctx.moveTo(x1 + radius, y1);
            ctx.arcTo(x2, y1, x2, y2, radius);
            ctx.arcTo(x2, y2, x1, y2, radius);
            ctx.arcTo(x1, y2, x1, y1, radius);
            ctx.arcTo(x1, y1, x2, y1, radius);
        },
        roundrect: function(ctx, rect, fill, lineWidth, options) {
            var radius = options.rectRadius || 1;
            radius = Math.min(radius, (rect.right - rect.left) / 2, (rect.bottom - rect.top) / 2);
            if (!lineWidth) {
                this._roundrectPath(ctx, rect.left, rect.top, rect.right + 1, rect.bottom + 1, radius);
                ctx.fill();
                return;
            }

            if (fill) {
                var fillDelta = Math.ceil(lineWidth / 2);
                var fillDelta2 = lineWidth - fillDelta;
                var r = radius - ctx.lineWidth / 2;
                var rectWidth = rect.right - rect.left - lineWidth;
                var rectHeight = rect.bottom - rect.top - lineWidth;
                if (rectWidth > 0 && rectHeight > 0) {
                    if (r > 0) {
                        this._roundrectPath(ctx, rect.left + fillDelta, rect.top + fillDelta,
                                            rect.right - fillDelta2, rect.bottom - fillDelta2, r);
                        ctx.fill();
                    } else {
                        ctx.fillRect(rect.left + fillDelta, rect.top + fillDelta, rectWidth, rectHeight);
                    }
                }
            }

            var add = (lineWidth % 2) ? 0.5 : 0;
            
            this._roundrectPath(ctx, rect.left + add, rect.top + add, rect.right + add, rect.bottom + add, radius);
            ctx.stroke();
        },
        
        _setEllipsTransform: function(ctx, cx, cy, rect, radius, width, height) {
            ctx.translate(rect.left + cx, rect.top + cy);
            if (width > height) {
                ctx.scale(1, height / width);
            } else {
                ctx.scale(width / height, 1);
            }
        },
        
        ellipse: function(ctx, rect, fill, lineWidth) {
            var width = rect.right - rect.left + 1,
                height = rect.bottom - rect.top + 1;

            var cx = width / 2, cy = height / 2;
            var add = (lineWidth % 2) ? 0.5 : 0;
            
            var radius = (width > height ? cx : cy);

            ctx.save();
            
            this._setEllipsTransform(ctx, cx, cy, rect, radius, width, height);
            /*
            ctx.translate(rect.left + cx, rect.top + cy);
            
            var radius;
            if (width > height) {
                radius = cx;
                ctx.scale(1, height / width);
            } else {
                radius = cy;
                ctx.scale(width / height, 1);
            }
            */

            if (!lineWidth) {
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, 2 * Math.PI);
                ctx.restore();
                ctx.fill();
                
            } else {
                if (fill && (width > lineWidth) && (height > lineWidth)) {
                    var delta = lineWidth / 2;
                    ctx.beginPath();
                    ctx.arc(0, 0, radius, 0, Math.PI * 2);
                    ctx.restore();
                    ctx.fill();
                    ctx.save();
                    this._setEllipsTransform(ctx, cx, cy, rect, radius, width, height);
                }
                ctx.beginPath();
                ctx.arc(0, 0, radius + add, 0, Math.PI * 2);
                ctx.restore();
                ctx.stroke();
            }
        }
    };
    
    return shapes;
})();