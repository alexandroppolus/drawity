define(['react', 'drawity', 'app/components/popup', 
'app/paint-inst', 'app/actions', '../range-input'], 
function (react, drawity, popup, 
paintInst, actions, RangeInput) {

    var safeColors = null;
    
    function getSafeColors() {
        if (!safeColors) {
            safeColors = drawity.utils.color.getSafeColors();
        }
        return safeColors;
    }
    
    var patternUrl = {};
    
    function getPatternBG(pattern) {
        if (pattern) {
            if (!patternUrl[pattern]) {
                patternUrl[pattern] = drawity.utils.patterns.getPatternUrl(pattern, '#000000');
            }
            var url = patternUrl[pattern];
            pattern = '#fff url("' + url + '") 0 0 repeat';
        } else {
            pattern = '#000000';
        }
        return pattern;
    }
    
    //------------------------------------------------------------------------------
    
    var ColorPopup = popup.createClass({
        displayName: 'ColorPopup',
        
        getInitialState: function() {
            return { alpha: 255 };
        },
        
        onPopupShow: function() {
            if (this.props.type != 'drawPattern') {
                var color = drawity.utils.color.extactAlpha(paintInst().tools.options.get(this.props.type));
                this.setState({
                    alpha: Math.round(color.alpha * 255)
                });
                this._savedColor = color.color;
            }
        },
        
        calcValue: function() {
            return drawity.utils.color.addAlpha(this._savedColor, this.state.alpha);
        },
        
        itemClick: function(e) {
            var value = e.target.getAttribute('data-value');
            if (this.props.type != 'drawPattern') {
                this._savedColor = value;
                this.props.onSelect(this.calcValue());
            } else {
                this.props.onSelect(value);
            }
        },
        
        handleRange: function(e) {
            this.setState({
                alpha: parseInt(e.target.value, 10)
            });
            this.props.onSelect(this.calcValue());
        },

        render: function () {
        
            var isPattern = (this.props.type == 'drawPattern');
            
            var arr = isPattern ? drawity.utils.patterns.getAllTypes(true) : getSafeColors();
            
            var children = [
            
                react.DOM.div({
                    className: 'component-caption'
                },
                this.props.type),
                
                react.DOM.div({
                    className: 'color-popup-items clearfix',
                    children: [
                        arr.map(function(value) {
                            return react.DOM.div({
                                className: 'color-popup-item',
                                'data-value': value,
                                title: value,
                                style: {
                                    background: isPattern ? getPatternBG(value) : value
                                },
                                onClick: this.itemClick
                            });
                        }, this)
                    ]
                })
            ];
            
            if (!isPattern) {
                //children.push(react.DOM.span({ className: 'color-popup-alpha-title' }, 'Alpha:'));
                
                children.push(react.createElement(RangeInput, {
                    min: 0,
                    max: 255,
                    value: this.state.alpha,
                    title: 'Alpha',
                    onChange: this.handleRange
                }));
            }

            return react.DOM.div(popup.element(this, {
                className: 'color-popup component-form gray-panel clearfix',
                'data-type': this.props.type,
                children: children
            }));
        }
    });
    
    //------------------------------------------------------------------------------

    var Color = react.createClass({
        displayName: 'Color',
        
        getInitialState: function() {
            return { color: this._getValue(), openPopup: false }
        },
        
        componentDidMount: function () {
            paintInst().tools.options.on('set', this.updateColor, this);
        },
        
        _getValue: function() {
            var value = paintInst().tools.options.get(this.props.type);
            if (this.props.type == 'drawPattern') {
                value = getPatternBG(value);
            }
            return value;
        },
        
        updateColor: function(data) {
            if (data.name === this.props.type) {
                this.setState({
                    color: this._getValue()
                });
            }
        },
        
        handleSelect: function(value) {
            actions.run('option', this.props.type, value);
        },
        
        handleClick: function(e) {
            if (!this.state.openPopup && (e.nativeEvent.which == 1)) {
                this.setState({ openPopup: true });
            }
        },
        
        handlePopupClose: function() {
            this.setState({ openPopup: false });
        },

        render: function () {

            return react.DOM.div({
                className: 'paint-color',
                children: [
                    react.DOM.span({ className: 'paint-color-title' }, this.props.type),
                    react.DOM.div({
                        className: 'paint-color-value transback',
                        children: [
                            react.DOM.div({
                                style: { background: this.state.color },
                                onMouseDown: this.handleClick
                            }),
                            react.createElement(ColorPopup, {
                                visible: this.state.openPopup,
                                type: this.props.type,
                                onSelect: this.handleSelect,
                                onPopupClose: this.handlePopupClose
                            })
                        ]
                    })
                ]
            });
        }
    });
    
    //------------------------------------------------------------------------------

    return react.createClass({
        displayName: 'Colors',
        
        render: function () {

            return react.DOM.div({
                className: 'paint-colors gray-panel',
                children: [
                    react.createElement(Color, {type: 'color'}),
                    react.createElement(Color, {type: 'fillColor'}),
                    react.createElement(Color, {type: 'drawPattern'})
                ]
            });
        }
    });
});