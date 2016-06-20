/*!
 * Drawity JS - Pure JavaScript canvas-based paint engine
 * author Alexander Samsonov [alexandroppolus@yandex.ru]
 * version 0.1.0
 * licensed MIT
 */

/*{split}*/
(function(root, factory) {

    if (typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define(factory);
	else if(typeof exports === 'object')
		exports["drawity"] = factory();
	else
		root["drawity"] = factory();

})(this, function() {

/*{split}*/
    
    return {
        Paint: JSPaintCore,
        utils: {
            Rect: Rect,
            dnd: DND,
            createClass: utils.createClass,
            color: graphUtils.color,
            patterns: graphUtils.patterns,
            EventEmitter: EventEmitter
        }
    };
});
