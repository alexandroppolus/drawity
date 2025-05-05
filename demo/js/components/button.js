define(['react', 'app/actions', 'app/components/popup'], 
function (react, actions, popup) {

    var PopupMenu = popup.createClass({
        displayName: 'PopupMenu',
        
        closeByClick: true,
        
        render: function () {
        
            return react.DOM.div(popup.element(this, {
                className: 'popup-menu gray-panel' + (this.props.className ? ' ' + this.props.className : ''),
                children: this.props.items.map(function(item) {
                    return react.createElement(Button, item);
                })
            }));
        }
    });
    
    var FileInput = popup.createClass({
        displayName: 'FileInput',
        
        _createInput: function() {
            var input = document.createElement('input');
            input.type = 'file';
            input.style.cursor = 'pointer';
            input.style.position = 'absolute';
            input.style.fontSize = '200px';
            input.style.right = '0px';
            input.style.opacity = '0.01';
            input.style.top = '0px';
            input.onchange = this.handleFileSelect;
            return input;
        },
        
        componentDidMount: function () {
            this.fileInput = this._createInput();
            this.refs.parent.appendChild(this.fileInput);
        },
        
        shouldComponentUpdate: function() {
            return false;
        },
        
        componentWillUnmount: function () {
            if (this.fileInput) {
                this.fileInput.onchange = null;
                this.fileInput.parentNode.removeChild(this.fileInput);
                this.fileInput = null;
            }
        },
        
        handleFileSelect: function(e) {
            var f = e.target.files[0];
            this.fileInput = this._createInput();
            this.refs.parent.replaceChild(this.fileInput, e.target);
            e.target.onchange = null;
            if (this.props.onChange) {
                this.props.onChange(f);
            }
        },
        
        render: function () {
            return react.DOM.span({
                className: 'file-input',
                ref: 'parent'
            });
        }
    });

    var Button = react.createClass({
        displayName: 'Button',
        
        isDisabled: function() {
            return this.props.observeState && !actions.isEnabled(this.props.action, this.props.param, this.props.value);
        },
        
        addViewInfoToState: function(state) {
            var value = actions.getValue(this.props.action, this.props.param);
            state.checked = (this.props.value != null) && (value === this.props.value);
            
            if (this.props.getValueState) {
                this.props.getValueState.call(this, value, state);
            } else {
                state.text = this.props.text || (this.props.valueAsText ? (value || '') + '' : '');
                state.iconPos = this.props.iconPos;
            }
            
            return state;
        },
        
        getInitialState: function() {
            return this.addViewInfoToState({
                disabled: this.isDisabled(),
                popupVisible: false
            });
        },
        
        componentDidMount: function() {
            if (this.props.observeState) {
                actions.on('enabled:' + this.props.action, function() {
                    this.setState({ 
                        disabled: this.isDisabled()
                    });
                }, this);
                
                actions.on('change:' + this.props.action, function() {
                    this.setState(this.addViewInfoToState({}));
                }, this);
            }
        },
        
        showPopup: function(e) {
            if (!this.state.disabled && !this.state.popupVisible && (e.nativeEvent.which == 1)) {
                this.setState({ popupVisible: true });
            }
        },
        
        handlePopupClose: function() {
            this.setState({ popupVisible: false });
        },
        
        handleClick: function(e) {
            if (!this.props.fileInput && !this.state.disabled && !this.props.popupMenu) {
                if (this.props.action) {
                    var value = this.props.value;
                    if (value === true) {
                        value = !this.state.checked;
                    }
                    actions.run(this.props.action, this.props.param, value);
                    return;
                }
                if (this.props.onClick) {
                    this.props.onClick(e);
                }
            }
        },
        
        handleFileSelect: function(f) {
            console.log(f);
            if (this.props.action) {
                actions.run(this.props.action, this.props.param, f);
            }
        },

        render: function () {
            
            var className = 'button button-' +
                (this.state.disabled ? 'disabled' : 'enabled') +
                (this.state.checked || this.state.popupVisible ? ' button-checked gray-panel-down' : ' gray-panel') +
                (this.props.className ? ' ' + this.props.className : '');
                
            var button, popup = null;
            
            if (typeof this.props.popupMenu === 'function') {
                popup = this.props.popupMenu.call(this);
            }
            
            if (!popup && this.props.popupMenu) {
                popup = react.createElement(PopupMenu, {
                    items: this.props.popupMenu,
                    visible: this.state.popupVisible,
                    className: this.props.popupClassName,
                    onPopupClose: this.handlePopupClose
                });
            }
            
            if (this.props.renderButton) {
                button = this.props.renderButton.call(this, className);
            } else {
                var buttonChildren = [];
                
                if (this.props.hasIcon) {
                    buttonChildren.push(react.DOM.i({
                        style: (this.state.iconPos != null) ? {
                            backgroundPosition: '50% ' + (this.state.iconPos || 0) + 'px'
                        } : {}
                    }));
                }
                
                if (this.state.text) {
                    buttonChildren.push(this.state.text);
                    if (!this.props.hasIcon) {
                        className = className + ' text-button';
                    }
                }
                
                var btnStyle = {};
                if (this.props.fileInput) {
                    btnStyle.position = 'relative';
                    btnStyle.overflow = 'hidden';
                    
                    buttonChildren.push(react.createElement(FileInput, {
                        onChange: this.handleFileSelect
                    }));
                }
                
                button = react.DOM.div({
                    className: className,
                    style: btnStyle,
                    onClick: this.handleClick,
                    onMouseDown: popup ? this.showPopup : null,
                    title: this.props.title,
                    children: buttonChildren
                });
            }
            
            if (popup) {
                return react.DOM.div({
                    className: 'button-with-popup' + (this.props.parentClassName ? ' ' + this.props.parentClassName : ''),
                    children: [
                        button,
                        popup
                    ]
                });
            } else {
                return button;
            }
        }
    });
    
    return Button;
});
