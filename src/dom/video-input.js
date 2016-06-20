var JSCPVideoInput = utils.createClass(JSCPObject, function(base, baseConstr) {


    return {
        constructor: function(dom, elem) {
            baseConstr.call(this, dom, elem);
            this.enableDND(true);
        },
        
        _changeMode: function(newValue, oldValue) {
        }
    };
});