define(['react', 'app/paint-inst'],
function(react, paintInst) {

    return react.createClass({
        displayName: 'Canvas',

        componentDidMount: function () {
            paintInst().renderTo(this.refs.drawityparent);
        },
        
        shouldComponentUpdate: function() {
            return false;
        },

        render: function(){
            return react.DOM.div({
                className: 'paint-canvas',
                children: [
                    react.DOM.div({
                        ref: 'drawityparent'
                    })
                ]
            });
        }
        
    });
    
});