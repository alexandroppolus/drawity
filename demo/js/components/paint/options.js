define(['react', 'app/actions', 'app/paint-inst', '../range-input', 'app/components/button'], 
function (react, actions, paintInst, RangeInput, Button, popup) {

    var Splitter = react.createClass({
        displayName: 'Splitter',
        render: function () {
            return react.DOM.span({
                className: 'paint-options-splitter'
            });
        }
    });
    
    return react.createClass({
        displayName: 'Options',
        
        getInitialState: function() {
            return {
                visible: true
            };
        },
        
        componentDidMount: function() {
            paintInst().filters.on('change', function(data) {
                this.setState({
                    visible: !data.name
                });
            }, this);
        },
        
        render: function () {
        
            var iconHeight = 20;
            
            return react.DOM.div({
                className: 'paint-options gray-panel clearfix',
                style: {
                    display: this.state.visible ? '' : 'none'
                },
                children: [
                    react.createElement(Splitter),
                    
                    'Pen: ',
                    react.createElement(Button, {
                        observeState: true,
                        hasIcon: true,
                        action: 'option',
                        param: 'penForm',
                        title: 'Round',
                        value: 'round',
                        iconPos: -iconHeight * 0
                    }),
                    react.createElement(Button, {
                        observeState: true,
                        hasIcon: true,
                        action: 'option',
                        param: 'penForm',
                        title: 'Square',
                        value: 'square',
                        iconPos: -iconHeight * 1
                    }),
                    
                    react.createElement(Splitter),
                    
                    'Line cap: ',
                    react.createElement(Button, {
                        observeState: true,
                        hasIcon: true,
                        action: 'option',
                        param: 'lineCap',
                        value: 'round',
                        title: 'Round',
                        iconPos: -iconHeight * 2
                    }),
                    react.createElement(Button, {
                        observeState: true,
                        hasIcon: true,
                        action: 'option',
                        param: 'lineCap',
                        value: 'butt',
                        title: 'Butt',
                        iconPos: -iconHeight * 4
                    }),
                    react.createElement(Button, {
                        observeState: true,
                        hasIcon: true,
                        action: 'option',
                        param: 'lineCap',
                        value: 'square',
                        title: 'Square',
                        iconPos: -iconHeight * 3
                    }),
                    
                    react.createElement(Splitter),
                    
                    'Line width: ',
                    react.createElement(RangeInput, {
                        min: 1,
                        max: 50,
                        action: 'option',
                        param: 'lineWidth'
                    }),
                    
                    react.createElement(Splitter),
                    
                    'Font: ',
                    
                    react.createElement(Button, {
                        observeState: true,
                        hasIcon: true,
                        action: 'option',
                        param: 'fontBold',
                        title: 'Bold',
                        value: true,
                        iconPos: -iconHeight * 5
                    }),
                    react.createElement(Button, {
                        observeState: true,
                        hasIcon: true,
                        action: 'option',
                        param: 'fontItalic',
                        title: 'Italic',
                        value: true,
                        iconPos: -iconHeight * 6
                    }),
                    
                    react.createElement(Button, {
                        observeState: true,
                        action: 'option',
                        param: 'fontSize',
                        title: 'Font size',
                        valueAsText: true,
                        popupMenu: [
                            { action: 'option', param: 'fontSize', value: 7, text: '7' },
                            { action: 'option', param: 'fontSize', value: 8, text: '8' },
                            { action: 'option', param: 'fontSize', value: 9, text: '9' },
                            { action: 'option', param: 'fontSize', value: 10, text: '10' },
                            
                            { action: 'option', param: 'fontSize', value: 12, text: '12' },
                            { action: 'option', param: 'fontSize', value: 14, text: '14' },
                            { action: 'option', param: 'fontSize', value: 16, text: '16' },
                            { action: 'option', param: 'fontSize', value: 18, text: '18' },
                            { action: 'option', param: 'fontSize', value: 20, text: '20' },
                            { action: 'option', param: 'fontSize', value: 24, text: '24' },
                            { action: 'option', param: 'fontSize', value: 32, text: '32' },
                            { action: 'option', param: 'fontSize', value: 48, text: '48' }
                        ]
                    }),
                    
                    react.createElement(Button, {
                        observeState: true,
                        action: 'option',
                        param: 'fontFamily',
                        title: 'Font',
                        valueAsText: true,
                        popupMenu: [
                            { action: 'option', param: 'fontFamily', value: 'arial', text: 'Arial' },
                            { action: 'option', param: 'fontFamily', value: 'sans-serif', text: 'Sans-serif' },
                            { action: 'option', param: 'fontFamily', value: 'courier new', text: 'Courier New' },
                            { action: 'option', param: 'fontFamily', value: 'tahoma', text: 'Tahoma' },
                            { action: 'option', param: 'fontFamily', value: 'verdana', text: 'Verdana' }
                        ]
                    }),
                    
                    react.createElement(Splitter),
                    
                    'Rect radius: ',
                    react.createElement(RangeInput, {
                        min: 1,
                        max: 50,
                        action: 'option',
                        param: 'rectRadius'
                    }),
                ]
            });
        }
    });
});