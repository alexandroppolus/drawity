var ToolManager = utils.createClass(EventEmitter, {
    constructor: function(config, paint, runner, keyManager) {
        EventEmitter.call(this);
        
        this._config = config;
        this._paint = paint;
        this._runner = runner;
        this._keyManager = keyManager;
        
        this.options = new JSCPOptions(false, jscpConfig.toolOptionsConfig);
        this.options.on('_optionsHandlers', this);

        this._tool = null;
        this._toolName = '';
        this._toolMap = {};
        
        this._rgba = { };
        this._updateColor('color');
        this._updateColor('fillColor');
    },
    
    setDOM: function(dom, mouseManager) {
        if (!this._dom) {
            this._dom = dom;
            this._mouseManager = mouseManager;
            this._addTool('crop', new CropTool());
            this._addTool('select', new SelectTool());
            this._addTool('bgresize', new BGResizeTool());
            this._addTool('pen', new PenTool(false));
            this._addTool('eraser', new PenTool(true));
            this._addTool('line', new LineTool());
            this._addTool('rect', new ShapeTool('rect'));
            this._addTool('roundrect', new ShapeTool('roundrect'));
            this._addTool('ellipse', new ShapeTool('ellipse'));
            this._addTool('fill', new FillTool());
            this._addTool('picker', new ColorPickerTool());
            this._addTool('curve', new CurveTool());
            this._addTool('text', new TextTool());
        }
    },
    
    destroy: function() {
        this.un();
        this.options.un();
        this._end();
        
        for (var i in this._toolMap) {
            if (this._toolMap.hasOwnProperty(i) && this._toolMap[i]) {
                this._toolMap[i].destroy();
            }
        }
        
        this._toolMap = null;
        this._mouseManager = null;
        this._keyManager = null;
        this._dom = null;
        this._config = null;
        this._paint = null;
        this._runner = null;
    },
    
    _addTool: function(name, tool) {
        if (name && tool && !this._toolMap[name]) {
            this._toolMap[name] = tool;
            tool.init(this._config, this._paint, this._runner, this._dom, this._mouseManager, this._keyManager);
        }
    },
    
    _updateColor: function(name) {
        this._rgba[name] = graphUtils.color.getRGBA(this.options.get(name));
    },
    
    _optionsHandlers: {
        set: function(e) {
            if ((e.name === 'color') || (e.name === 'fillColor')) {
                this._updateColor(e.name);
            }
        }
    },
    
    getColor: function() {
        return this._rgba.color;
    },
    
    getFillColor: function() {
        return this._rgba.fillColor;
    },
    
    current: function(toolName) {
        if (!this._paint) {
            return this;
        }
        if (toolName === undefined) {
            return this._toolName;
        }
        var oldTool;
        if (!toolName) {
            if (this._toolName) {
                oldTool = this._endTool();
                this.emit('change', { name: '', oldName: oldTool });
            }
            return this;
        }
        if ((typeof toolName !== 'string') || !this._toolMap.hasOwnProperty(toolName) || (this._toolName === toolName)) {
            return this;
        }
        oldTool = this._endTool();
        this._paint.filters.cancel();
        this._toolName = toolName;
        this._tool = this._toolMap[toolName];
        this._tool.begin();
        this.emit('change', { name: toolName, oldName: oldTool });
        return this;
    },
    
    _endTool: function() {
        if (this._tool) {
            var toolName = this._toolName;
            this._tool.end();
            this._toolName = '';
            this._tool = null;
            this.emit('end', toolName);
            return toolName;
        }
        return this._toolName;
    }
});
