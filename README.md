## Drawity JS
Pure JavaScript canvas-based paint engine.

This is only surface for drawing, which can handled mouse and keyboard events, and contains picture. With the simple API, you can manage this component, and easily create a user interface for it.

<b><a href="https://alexandroppolus.github.io/drawity/demo/" target="_blank">Demo</a></b> is example of user interface for Drawity. There are several buttons and drop-down lists that simply call the methods and handle events of the component.

#### Features
 - Open image from file or URL
 - Create empty image
 - Save images as PNG, JPG, GIF
 - Insert image as top "layer" from file, URL, drag-n-drop file or < img >, or clipboard
 - Select rectangle area and create top "layer"
 - Transparency support
 - N levels undo/redo
 - Crop: inside, outside
 - Rotate image (90/180/270 deg or around the X/Y axis)
 - Resize image
 - Edit image, using tools: pen, eraser, text, floodfill, lines, curves and shapes
 - Color picker
 - Image filters and color corrections
 - Keyboard shortcuts
 
In the future, the list will increase.
 
#### Using the component

<b>AMD:</b>
```
require(['drawity'], function(drawity) {
  var paint = new drawity.Paint(...);
  ...
});
```

<b>CommonJS:</b>
```
var drawity = require('drawity');
var paint = new drawity.Paint(...);
```

<b>"classic" variant:</b>
```
var paint = new window.drawity.Paint(...);
```

 
#### API Documentation

Will be later
