var CurveTool = utils.createClass(BaseTool, function (base, baseConstr) {

    var bufRect = new Rect();

    var BezierCommand = utils.createClass(ToolCommand, {
        constructor: function(points) {
            this._points = points;
        },
        
        _apply: function(ctx) {
            graphUtils.shapes.drawBezier(ctx, this._points);
        }
    });
    
    var ArcCommand = utils.createClass(ToolCommand, {
        constructor: function(arc) {
            this._arc = arc;
        },
        
        _apply: function(ctx) {
            this._arc.draw(ctx);
        }
    });
    
    var EditCommand = utils.createClass(BaseCommand, {

        setConfig: function(toolOptions, rect, objName) {
            this._toolOptions = toolOptions;
            this._objName = objName;
            this._ctxOptions = null;
            this._canDraw = false;
            this._grips = null;
            this._rect = new Rect();
            
            this._movingTimer = new Timer(100, function() {
                this.setMoving(false);
            }, this, true);
            
            this._calcInitPoints(rect, toolOptions.curve);
        },
        
        _init: function() {
            this._calcRect();
        },
        
        undo: function() {
            for (var i = 0; i < this._grips.length; ++i) {
                this._grips[i].parentNode.removeChild(this._grips[i]);
            }
            this._grips = null;
            this._dom.getObject(this._objName).hideTempCanvas();
        },
        
        redo: function() {
            var obj = this._dom.getObject(this._objName);
            this._grips = [];
            var pointNum = 0;
            for (var i = 0; i < this._points.length; i += 2) {
                var grip = obj.createGrip('move', 'front');
                grip.__pointNum = pointNum++;
                uiUtils.setPos(grip, this._points[i], this._points[i + 1]);
                this._grips.push(grip);
            }
            
            this._createOptions();
            this._draw();
        },
        
        setMoving: function(moving) {
            if (this._grips) {
                for (var i = 0; i < this._grips.length; ++i) {
                    this._grips[i].setAttribute('data-moving', moving);
                }
            }
        },
        
        createResultCommand: function() {
            this._createOptions();
            var command = this._createResultCommand();
            return command.setConfig(this._objName, this._rect, this._ctxOptions);
        },
        
        changeOptions: function() {
            if (this.done) {
                this._createOptions();
                this._draw();
            }
        },
        
        _updateGrips: function() {
            for (var j = 0; j < this._grips.length; ++j) {
                uiUtils.setPos(this._grips[j], this._points[j * 2], this._points[j * 2 + 1]);
            }
        },
        
        changePoint: function(i, left, top) {
            this._setNewPointPos(i, left, top);
            if (this.done) {
                this._updateGrips();
                this._draw();
            }
            this._calcRect();
        },
        
        movePoints: function(dx, dy, timeout) {
            if (dx || dy) {
                if (timeout) {
                    this.setMoving(true);
                    this._movingTimer.stop().setInterval(timeout).start();
                }
                for (var i = 0; i < this._points.length; i += 2) {
                    this._points[i] = this._points[i] + dx;
                    this._points[i + 1] = this._points[i + 1] + dy;
                }
                if (this.done) {
                    this._updateGrips();
                    this._draw();
                }
                this._calcRect();
            }
        },
        
        _calcRect: function() {
            this._calcRectByCurveData(this._rect);
            this._rect.toolResultRect(this._dom.getObject(this._objName), this._toolOptions.lineWidth);
        },
        
        _createOptions: function() {
            this._ctxOptions = graphUtils.shapes.makeLineOptions(this._toolOptions, false, this._dom.getObject(this._objName).rect);
        },
        
        _draw: function() {
            if (this._canDraw) {
                var ctx = this._dom.getObject(this._objName).getTempContext();
                
                ctx.clearRect(this._rect.left, this._rect.top, this._rect.width(), this._rect.height());
                graphUtils.setOptions(ctx, this._ctxOptions);
                this._drawCurve(ctx);
            } else {
                this._canDraw = true;
            }
        },
        
        //------- virtuals -------------------------
        
        _calcInitPoints: function(rect, type) {},
        _setNewPointPos: function(i, left, top) {
            this._points[i * 2] = left;
            this._points[i * 2 + 1] = top;
        },
        _calcRectByCurveData: function(rect) {},
        _drawCurve: function(ctx) {},
        _createResultCommand: function() {}
    });
    
    var BezierEditCommand = utils.createClass(EditCommand, {
        _calcInitPoints: function(rect, type) {
            this._points = [rect.left, rect.top];
            if (/^bezier([23])$/.test(type)) {
                var n = parseInt(RegExp.$1, 10);
                for (var i = 1; i < n; ++i) {
                    this._points.push(
                        Math.round(((n - i) * rect.left + i * rect.right) / n),
                        Math.round(((n - i) * rect.top + i * rect.bottom) / n)
                    );
                }
            }
            this._points.push(rect.right, rect.bottom);
        },
        
        _calcRectByCurveData: function(rect) {
            rect.fromPoints(this._points, true);
        },
        
        _drawCurve: function(ctx) {
            graphUtils.shapes.drawBezier(ctx, this._points);
        },
        
        _createResultCommand: function() {
            return new BezierCommand(this._points);
        }
    }, {
        drawByRect: function(ctx, rect) {
            graphUtils.shapes.drawLine(ctx, rect);
        },
        
        calcClearRect: function(rect, result) {
            result.set(rect);
        }
    });
    
    var ArcData = utils.createClass(EditCommand, {
        constructor: function(rect) {
            if (rect) {
                this.set(rect);
            }
        },
        set: function(rect) {
            this.raduis = rect.diagonal();
            this.angles = this.angles || [];
            this.angles[0] = 0;
            this.angles[1] = rect.angle() || 2 * Math.PI;
            this.points = this.points || [];
            this.points[0] = rect.left;
            this.points[1] = rect.top;
            this.points[2] = rect.left + Math.round(this.raduis);
            this.points[3] = rect.top;
            this.points[4] = rect.right;
            this.points[5] = rect.bottom;
            return this;
        },
        draw: function(ctx) {
            ctx.beginPath();
            ctx.arc(this.points[0], this.points[1], this.raduis, this.angles[0], this.angles[1]);
            ctx.stroke();
        },
        calcRect: function(result) {
            var r = Math.ceil(this.raduis),
                cx = this.points[0],
                cy = this.points[1];
            result.set(cx - r, cy - r, cx + r, cy + r);
        }
    });
    
    var ArcEditCommand = utils.createClass(EditCommand, {
        _calcInitPoints: function(rect) {
            this._arc = new ArcData(rect);
            this._points = this._arc.points;
        },
        
        _setNewPointPos: function(i, left, top) {
            if (i === 0) {
                this.movePoints(left - this._points[0], top - this._points[1]);
            } else {
                this._points[i * 2] = left;
                this._points[i * 2 + 1] = top;
                this._arc.raduis = Rect.diagonal(this._points[0], this._points[1], left, top);
                var angle = Rect.angle(this._points[0], this._points[1], left, top);
                this._arc.angles[i - 1] = (i === 2 && !angle) ? 2 * Math.PI : angle;
                var j = 3 - i;
                this._points[j * 2] = this._points[0] + Math.round(this._arc.raduis * Math.cos(this._arc.angles[j - 1]));
                this._points[j * 2 + 1] = this._points[1] + Math.round(this._arc.raduis * Math.sin(this._arc.angles[j - 1]));
            }
        },
        
        _calcRectByCurveData: function(rect) {
            this._arc.calcRect(rect);
        },
        
        _drawCurve: function(ctx) {
            this._arc.draw(ctx);
        },
        
        _createResultCommand: function() {
            return new ArcCommand(this._arc);
        }
        
    }, {
        _arcBuf: new ArcData(),
        drawByRect: function(ctx, rect) {
            this._arcBuf.set(rect).draw(ctx);
        },
        
        calcClearRect: function(rect, result) {
            this._arcBuf.set(rect).calcRect(result);
        }
    });
    
//--------- tool -----------------------------------------------------------------

    return {
        constructor: function() {
            baseConstr.call(this);
            this._editCmd = null;
            this._parentCmd = null;
        },
        
        _mouseHandlers: {
            dndMouseDown: function(e, callback) {
                if (e.data.mm.grip == 'root') {
                    this._apply()
                } else {
                    this._editCmd.setMoving(true);
                }
            },
            dndStart: function(e) {
                //this._dom.getSelection().hide();
                if (e.data.mm.grip == 'root') {
                    var opts = this._paint.tools.options.getData(true);
                    
                    e.data.activeLayer = this._dom.getActiveLayer();
                    e.data.tempCanvas = e.data.activeLayer.getTempCanvas();
                    e.data.tempCtx = e.data.tempCanvas.getContext('2d');
                    e.data.CmdClass = this._getEditCommandClass(opts.curve);
                    e.data.clearRect = new Rect();
                    
                    e.data.toolOptions = graphUtils.shapes.makeLineOptions(opts, false, e.data.activeLayer.rect);
                
                    graphUtils.setOptions(e.data.tempCtx, e.data.toolOptions);
                }
            },
            dndMove: function(e) {
                if (e.data.mm.grip == 'root') {
                    if (e.data.clearRect.minSize() > 0) {
                        e.data.tempCtx.clearRect(e.data.clearRect.left, e.data.clearRect.top, e.data.clearRect.width(), e.data.clearRect.height());
                        e.data.clearRect.zero();
                    }
                    if (e.data.mm.rect.maxSize(true) > 3) {
                        //graphUtils.shapes.drawLine(e.data.tempCtx, e.data.mm.rect);
                        e.data.CmdClass.drawByRect(e.data.tempCtx, e.data.mm.rect);
                        this._calcClearRect(e.data);
                    }
                } else {
                    var pointNum = e.data.mm.gripNode.__pointNum;
                    this._editCmd.changePoint(pointNum, e.current.nodeX, e.current.nodeY);
                }
            },
            dndStop: function(e) {
                if (e.data.mm.grip == 'root') {
                    var object = e.data.activeLayer;
                    var objName = object.getName();
                    
                    var rect = this._calcClearRect(e.data);

                    if ((rect.minSize() > 0) && (e.data.mm.rect.maxSize(true) > 3)) {
                        this._editCmd = new e.data.CmdClass();
                        var opts = this._paint.tools.options.getData(true);
                        this._editCmd.setConfig(opts, e.data.mm.rect, objName);
                        this._parentCmd = new ParentCommand(this._editCmd);
                        
                        this._runner.historyEventEmitter.un('_historyHandlers', this);
                        this._runner.runToolCommand(objName, this._parentCmd);
                        this._runner.historyEventEmitter.on('_historyHandlers', this);
                    }
                }
            },
            dndMouseUp: function(e) {
                if (e.data.mm.grip == 'move') {
                    this._editCmd.setMoving(false);
                }
            }
        },
        
        _calcClearRect: function(eData) {
            eData.CmdClass.calcClearRect(eData.mm.rect, eData.clearRect);
            return eData.clearRect
                .toolResultRect(eData.activeLayer, eData.toolOptions.lineWidth);
        },
        
        _keyHandlers: {
            move: function(e) {
                if (this._parentCmd && this._parentCmd.done) {
                    this._editCmd.movePoints(e.direction.dx, e.direction.dy, 700);
                }
            },
            
            escape: function(e) {
                if (this._parentCmd && this._parentCmd.done) {
                    this._runner.history.undo();
                }
            },
            
            enter: function(e) {
                this._apply();
            }
        },
        
        _toolOptionsHandlers: {
            set: function() {
                if (this._editCmd && this._paint.tools.options.get('curveApplyOptions')) {
                    this._editCmd.changeOptions();
                }
            }
        },
        
        _historyHandlers: {
            redoclear: function() {
                this._endEdit();
            },
            clear: function() {
                this._endEdit();
            },
            running: function() {
                this._apply();
            }
        },
        
        _getEditCommandClass: function(curve) {
            if (/^bezier/.test(curve)) {
                return BezierEditCommand;
            }
            if (curve === 'arc') {
                return ArcEditCommand;
            }
            return BezierEditCommand;
        },
        
        _endEdit: function() {
            if (!this._editCmd) {
                return;
            }
            if (this._editCmd.done) {
                this._apply();
            }
            this._editCmd = this._parentCmd = null;
        },
        
        _apply: function() {
            if (!this._editCmd) {
                return;
            }
            this._parentCmd.replaceInnerCommand(this._editCmd.createResultCommand());
            this._editCmd = this._parentCmd = null;
        },
        
        _begin: function() {
            this._mouseMgr.setMode(this._mouseMgr.MODE_RECT, {
                useActiveLayer: true,
                shiftRootResizeType: Rect.RT_R8
            });
            this._runner.historyEventEmitter.on('_historyHandlers', this);
        },
        
        _end: function() {
            this._runner.historyEventEmitter.un('_historyHandlers', this);
            this._apply();
        }
    };
});