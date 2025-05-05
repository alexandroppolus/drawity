define(['react', './canvas', './menu', './toolbar', './colors', './filter-popup', './options'], 
function (react, Canvas, Menu, Toolbar, Colors, FilterPopup, Options) {

    return react.createClass({
        displayName: 'Paint',

        render: function () {

            return react.DOM.div({
                className: 'component-form paint',
                children: [
                    react.DOM.div({className: 'component-caption'}, 'Image editor'),
                    react.createElement(Menu),
                    react.createElement(Options),
                    react.createElement(FilterPopup),
                    react.DOM.div({
                        className: 'paint-middle',
                        children: [
                            react.createElement(Toolbar),
                            react.createElement(Canvas)
                        ]
                    }),
                    react.createElement(Colors)
                ]
            });
        }
    });
});