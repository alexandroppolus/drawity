require.config({
    baseUrl: 'js/lib',
    paths: {
        app: '../'
    }
});

require(['react', 'react-dom', 'app/actions', 'app/components/app'],
function (react, rDOM, actions, App) {

    actions.init();
    
    rDOM.render(
        react.createElement(App), 
        document.querySelector('#id_body')
    );
});