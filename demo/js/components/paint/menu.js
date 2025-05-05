define(['react', 'app/components/button'], 
function (react, Button) {
    
    return react.createClass({
        displayName: 'PaintMenu',
        
        render: function () {

            return react.DOM.div({
                className: 'paint-menu clearfix gray-panel',
                children: [
                    react.createElement(Button, {
                        text: 'File',
                        parentClassName: 'paint-menu-item',
                        popupMenu: [
                            { text: 'New', action: 'newImage' },
                            { text: 'Open file...', action: 'open', param: 'openResource', fileInput: true },
                            { text: 'Open URL...', action: 'open', param: 'openResource' },
                            //'-',
                            { text: 'Save as PNG', action: 'save', param: 'png' },
                            { text: 'Save as GIF', action: 'save', param: 'gif' },
                            { text: 'Save as JPG', action: 'save', param: 'jpeg' }
                        ]
                    }),
                    
                    react.createElement(Button, {
                        text: 'Edit',
                        parentClassName: 'paint-menu-item',
                        popupMenu: [
                            { text: 'Undo', action: 'history', param: 'undo', observeState: true },
                            { text: 'Redo', action: 'history', param: 'redo', observeState: true },
                            { text: 'Select all', action: 'selectAll' },
                            { text: 'Hide selection', action: 'hideSelection' },
                            { text: 'Insert from file...', action: 'open', param: 'insertResource', fileInput: true },
                            { text: 'Insert from URL...', action: 'open', param: 'insertResource' }
                        ]
                    }),
                    
                    react.createElement(Button, {
                        text: 'Image',
                        parentClassName: 'paint-menu-item',
                        popupMenu: [
                            { text: 'Rotate 90 deg', action: 'rotate', param: '90' },
                            { text: 'Rotate 180 deg', action: 'rotate', param: '180' },
                            { text: 'Rotate 270 deg', action: 'rotate', param: '270' },
                            { text: 'Rotate X', action: 'rotate', param: 'X' },
                            { text: 'Rotate Y', action: 'rotate', param: 'Y' }
                        ]
                    }),
                    
                    react.createElement(Button, {
                        text: 'Filters',
                        parentClassName: 'paint-menu-item',
                        popupMenu: [
                            { text: 'Brightness', action: 'filter', value: 'brightness', observeState: true },
                            { text: 'Contrast', action: 'filter', value: 'contrast', observeState: true },
                            { text: 'Saturation', action: 'filter', value: 'saturation', observeState: true },
                            { text: 'Vibrance', action: 'filter', value: 'vibrance', observeState: true },
                            { text: 'Grayscale', action: 'filter', value: 'grayscale', observeState: true },
                            { text: 'Sepia', action: 'filter', value: 'sepia', observeState: true },
                            { text: 'Invert', action: 'filter', value: 'invert', observeState: true },
                            { text: 'Threshold', action: 'filter', value: 'threshold', observeState: true },
                            
                            { text: 'Sharpen', action: 'filter', value: 'sharpen', observeState: true },
                            { text: 'Relief', action: 'filter', value: 'relief', observeState: true }
                        ]
                    })
                ]
            });
        }
    });
});