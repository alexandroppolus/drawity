define(['react', 'app/paint-inst', 'app/components/button'], 
function (react, paintInst, Button) {

    var tools = [
        { tool: 'crop', pos: 14, title: 'Crop' },
        { tool: 'bgresize', pos: 15, title: 'Background resize' },
        { tool: 'select', pos: 7, title: 'Select' },
        { tool: 'text', pos: 1, title: 'Text' },
        { tool: 'pen', pos: 3, title: 'Pen' },
        { tool: 'picker', pos: 4, title: 'Color picker' },
        { tool: 'eraser', pos: 0, title: 'Eraser' },
        { tool: 'fill', pos: 5, title: 'Fill' },
        { tool: 'line', pos: 8, title: 'Line' },
        { tool: 'curve', pos: 16, title: 'Curve' },
        { tool: 'rect', pos: 9, title: 'Rect' },
        { tool: 'roundrect', pos: 10, title: 'Round rect' },
        { tool: 'ellipse', pos: 11, title: 'Ellipse' }
    ];
    
    var options = [
        { option: 'curve', value: 'bezier3', pos: 0, title: 'Cubic Bezier' },
        { option: 'curve', value: 'bezier2', pos: 1, title: 'Quadratic Bezier' },
        { option: 'curve', value: 'arc', pos: 2, title: 'Arc' },
        
        { option: 'drawLine', value: 'stroke', pos: 3, title: 'Stroke' },
        { option: 'drawLine', value: 'erase', pos: 4, title: 'Erase' },
        
        { option: 'drawShape', value: 'stroke', pos: 5, title: 'Stroke' },
        { option: 'drawShape', value: 'both', pos: 6, title: 'Both' },
        { option: 'drawShape', value: 'fill', pos: 7, title: 'Fill' },
        { option: 'drawShape', value: 'erase', pos: 8, title: 'Erase' },
        
        { option: 'picker', value: 'color', pos: 9, title: 'Pick color' },
        { option: 'picker', value: 'fillColor', pos: 10, title: 'Pick fill color' }
    ];
    
    return react.createClass({
        displayName: 'Toolbar',

        render: function () {

            return react.DOM.div({
                className: 'paint-toolbar gray-panel',
                children: [
                    react.DOM.div({
                        className: 'paint-toolgroup gray-panel-down clearfix',
                        children: tools.map(function(tool) {
                            return react.createElement(Button, {
                                observeState: true,
                                className: 'tool-button',
                                hasIcon: true,
                                title: tool.title,
                                action: 'tool',
                                value: tool.tool,
                                iconPos: -tool.pos * 25
                            });
                        }, this)
                    }),
                    
                    react.DOM.div({
                        className: 'paint-toolgroup gray-panel-down clearfix',
                        children: options.map(function(option) {
                            return react.createElement(Button, {
                                observeState: true,
                                className: 'tool-option-button',
                                hasIcon: true,
                                title: option.title,
                                action: 'option',
                                param: option.option,
                                value: option.value,
                                iconPos: -option.pos * 25
                            });
                        }, this)
                    })
                ]
            });
        }
    });
});