define(['react', 'app/components/button'],
function (react, Button) {

    return react.createClass({
        displayName: 'Item',

        render: function () {
        
            return react.DOM.div({
                className: 'gallery-item',
                children: [
                    react.DOM.img({ className: 'transback', src: this.props.url }),
                    react.DOM.div({
                        className: 'gallery-item-buttons',
                        children: [
                            react.createElement(Button, {
                                text: 'Open',
                                action: 'open',
                                param: 'openResource',
                                value: this.props.url
                            }),
                            
                            react.createElement(Button, {
                                text: 'Insert',
                                action: 'open',
                                param: 'insertResource',
                                value: this.props.url
                            })
                        ]
                    })
                ]
            });
        }
    });
});