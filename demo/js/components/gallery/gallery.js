define(['react', './item'],
function (react, Item) {

    var urls = [
        'images/13.png',
        'images/12.jpeg'
    ];

    return react.createClass({
        displayName: 'Gallery',
        
        shouldComponentUpdate: function() {
            return false;
        },

        render: function () {

            return react.DOM.div({
                className: 'gallery-content clearfix',
                children: urls.map(function(url) {
                    return react.createElement(Item, { url: url });
                })
            });
        }
    });
});