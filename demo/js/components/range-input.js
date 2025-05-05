define(['react', 'app/actions'], 
function (react, actions) {

    function handleValueChange() {
        this.setState({
            value: actions.getValue(this.props.action, this.props.param)
        });
    }
    
    function handleEnableChange() {
        this.setState({
            disabled: this.isDisabled()
        });
    }

    return react.createClass({
        displayName: 'RangeInput',
        
        isDisabled: function() {
            return this.props && this.props.action && !actions.isEnabled(this.props.action, this.props.param);
        },
        
        getValue: function() {
            return this.props.action ?
                    actions.getValue(this.props.action, this.props.param) :
                    this.props.value;
        },
        
        getInitialState: function() {
            return {
                value: this.getValue(),
                disabled: this.isDisabled()
            };
        },
        
        componentWillReceiveProps: function(nextProps) {
            this.setState({
                value: this.props.action ?
                    actions.getValue(this.props.action, this.props.param) :
                    this.props.value,
                disabled: this.isDisabled()
            });
        },
        
        componentDidMount: function() {
            //this.refs.input.oninput = this.handleInput;
            this.refs.input.onchange = this.handleChange;
            
            if (this.props && this.props.action) {
            
                actions.on('change:' + this.props.action, handleValueChange, this);
                actions.on('enabled:' + this.props.action, handleEnableChange, this);
            }
        },
        
        componentWillUnmount: function() {
            //this.refs.input.oninput = null;
            this.refs.input.onchange = null;
            
            if (this.props && this.props.action) {
            
                actions.un('change:' + this.props.action, handleValueChange, this);
                actions.un('enabled:' + this.props.action, handleEnableChange, this);
            }
        },
        
        handleInput: function(e) {
            //var value = Math.max(this.props.min, Math.min(parseInt(e.target.value, 10), this.props.max));
            var value = e.target.value;
            this.setState({value: value});
            if (this.props.onInput) {
                this.props.onInput(e);
            }
        },
        
        handleChange: function(e) {
            if (!this.state.disabled) {
                if (this.props.action) {
                    actions.run(this.props.action, this.props.param, parseInt(this.state.value, 10));
                    return;
                }
                if (this.props.onChange) {
                    this.props.onChange(e);
                }
            }
        },
        
        render: function () {
        
            var inputConfig = {
                style: {
                    verticalAlign: 'top',
                    margin: 0
                },
                type: 'range',
                ref: 'input',
                'data-custom-id': this.props.customId,
                min: this.props.min,
                max: this.props.max,
                value: this.state.value + '',
                onChange: this.handleInput
            };
            
            if (this.state.disabled) {
                inputConfig.disabled = 'true';
            }
            
            var children = [
                react.DOM.input(inputConfig),
                react.DOM.b({
                    style: {
                        verticalAlign: 'top',
                        lineHeight: '22px',
                        display: 'inline-block',
                        paddingLeft: '9px'
                    }
                }, this.state.value + '')
            ];
            
            if (this.props.title) {
                children.unshift(react.DOM.span({
                    style: {
                        verticalAlign: 'top',
                        lineHeight: '22px',
                        display: 'inline-block',
                        paddingRight: '9px'
                    }
                }, this.props.title));
            }
        
            return react.DOM.span({
                className: 'range-input' + (this.state.disabled ? ' range-input-disabled' : ''),
                style: {
                    whiteSpace: 'nowrap'
                },
                children: children
            });
        }
    });
});