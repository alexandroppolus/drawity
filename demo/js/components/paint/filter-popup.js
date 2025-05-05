define(['react', 'app/actions', 'app/paint-inst', '../range-input', 'app/components/button'], 
function (react, actions, paintInst, RangeInput, Button) {

    return react.createClass({
        displayName: 'FilterPopup',
        
        getInitialState: function() {
            return {
                visible: false,
                valueCount: 0
            };
        },
        
        componentDidMount: function() {
            var filterManager = paintInst().filters;
            
            filterManager.on('change', function() {
                var filter = filterManager.current();
                this.setState({
                    filter: filter,
                    visible: !!filter,
                    valueCount: filterManager.valueCount()
                });
            }, this);
        },
        
        filterValueChange: function(e) {
            var input = e.target;
            actions.run(
                'filter',
                parseInt(input.getAttribute('data-custom-id'), 10), 
                parseInt(input.value, 10)
            );
        },
        
        render: function () {
            var filterManager = paintInst().filters;
        
            var ranges = [];
            
            for (var i = 0; i < this.state.valueCount; ++i) {
                ranges.push(react.createElement(RangeInput, {
                    min: filterManager.minValue(i),
                    max: filterManager.maxValue(i),
                    value: filterManager.getValue(i),
                    customId: i,
                    onChange: this.filterValueChange
                }));
            }
            
            return react.DOM.div({
                className: 'filter-values gray-panel',
                style: {
                    display: this.state.visible ? '' : 'none'
                },
                children: [
                    react.DOM.span({
                        className: 'filter-values-title'
                    },
                    this.state.filter + ':'),
                    
                    react.DOM.span({
                        children: ranges
                    }),
                    
                    react.createElement(Button, {
                        text: 'Apply',
                        action: 'filter',
                        param: 'apply'
                    }),
                    
                    react.createElement(Button, {
                        text: 'Cancel',
                        action: 'filter',
                        param: 'cancel'
                    })
                ]
            });
        }
    });
});