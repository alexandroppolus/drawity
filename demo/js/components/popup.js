define(['react'], function (react) {

    function elemClick(e) {
        e.stopPropagation();
    }

    return {
        createClass: function(obj) {
            var oldGetInitialState = obj.getInitialState;
            
            obj.getInitialState = function() {
                var state = oldGetInitialState ? oldGetInitialState.call(this) : {};
                state.visible = this.props.visible;
                return state;
            };
            
            var oldComponentWillReceiveProps  = obj.componentWillReceiveProps;
            
            obj.componentWillReceiveProps = function(nextProps) {
                this.setState({
                    visible: nextProps.visible
                });
                if (oldComponentWillReceiveProps) {
                    oldComponentWillReceiveProps.call(this, nextProps);
                }
            };
            
            
            var oldComponentDidUpdate = obj.componentDidUpdate;
            
            obj.componentDidUpdate = function(prevProps, prevState) {
                if (!prevState.visible && this.state.visible) {
                
                    var self = this;
                    var elem = this.refs.popupelement;
                    var closeByClick = this.closeByClick;
                    
                    function docClick(e) {
                        if (e.type === 'mousedown') {
                            var node = e.target;
                            while (node) {
                                if (node == elem) {
                                    return;
                                }
                                node = node.parentNode;
                            }
                        }
                        document.removeEventListener('mousedown', docClick, false);
                        if (closeByClick) {
                            elem.removeEventListener('click', docClick, false);
                        }
                        try {
                            self.setState({ visible: false });
                        } catch(exc){}
                    }
                    
                    setTimeout(function()	{
                        if (closeByClick) {
                            elem.addEventListener('click', docClick, false);
                        }
                        document.addEventListener('mousedown', docClick, false);
                    }, 50);
                    
                    if (this.onPopupShow) {
                        this.onPopupShow();
                    }
                }
                
                if (oldComponentDidUpdate) {
                    oldComponentDidUpdate.apply(this, arguments);
                }
                
                if (prevState.visible && !this.state.visible && this.props.onPopupClose) {
                    this.props.onPopupClose();
                }
            };
            
            return react.createClass(obj);
        },
        
        element: function(obj, renderObj) {
            renderObj.style = renderObj.style || {};
            renderObj.style.display = obj.state.visible ? '' : 'none';
            renderObj.style.position = 'absolute';
            renderObj.ref = 'popupelement';
            return renderObj;
        }
    };
});