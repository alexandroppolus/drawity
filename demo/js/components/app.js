define(['react', './paint/paint', './gallery/gallery'], 
function (react, Paint, Gallery) {

    return  react.createClass({

        render: function(){
            return react.DOM.div({
                className: 'demo-app',
                children: [
                    react.DOM.h2({}, 'Drawity demo'),
                    react.DOM.div({className: 'component-desc'}, 'This is a simple user interface for the DrawityJS web component.'),
                    
                    react.createElement(Paint),
                    
                    react.DOM.div({className: 'component-title'}, 'Images'),
                    react.DOM.div({className: 'component-desc'}, 'This is ordinary < img > elements. Each of them you can open or insert, or drag-n-drop into image editor. Also, you can copy image in context menu and paste (Ctrl-V) into image editor.'),
                    
                    react.createElement(Gallery)
                ]
            });
        }
        
    });
});