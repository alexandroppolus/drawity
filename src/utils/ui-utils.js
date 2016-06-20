var uiUtils = {
    getCoords: function(element, inPage, coords){
        coords = coords || new Rect();
        var r = element.getBoundingClientRect();
        coords.set(Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom));
        if (inPage) {
            coords.move(window.pageXOffset, window.pageYOffset);
        }
        return coords;
    },
    
    setStyle: function(element, obj) {
        this.copy(obj, element.style, true);
    },
    
    setPos: function(element, left, top) {
        if (left && (typeof left === 'object')) {
            top = (left.top || left.y || 0);
            left = (left.left || left.x || 0);
        }
        if (element) {
            element.style.left = left + 'px';
            element.style.top = top + 'px';
        }
    },
    
    setSize: function(element, obj) {
        if (element && obj) {
            element.style.width = ((typeof obj.width === 'function') ? obj.width() : (obj.width || 0)) + 'px';
            element.style.height = ((typeof obj.height === 'function') ? obj.height() : (obj.height || 0)) + 'px';
        }
    },
    
    setBound: function(element, rect, parentRect) {
        if (element && rect) {
            this.setPos(element, rect);
            if (parentRect) {
                element.style.right = (parentRect.right - rect.right) + 'px';
                element.style.bottom = (parentRect.bottom - rect.bottom) + 'px';
            } else {
                this.setSize(element, rect);
            }
        }
    },
    
    removeChilds: function(node, buf) {
        while (node.lastChild) {
            if (buf) {
                buf.unshift(node.lastChild);
            }
            node.removeChild(node.lastChild);
        }
        return buf;
    },
    
    createElement: function(descr) {
        if (!descr) {
            return document.createElement('div');
        }
        descr = descr.split('.');
        var elem = document.createElement(descr[0] || 'div');
        if (descr[1]) {
            elem.className = descr[1];
        }
        return elem;
    },
    
    appendChilds: function(node, childs) {
        for (var i = 0; i < childs.length; ++i) {
            node.appendChild(childs[i]);
        }
    },
    
    isParent: function(parent, child) {
        while (child) {
            if (child == parent) {
                return true;
            }
            child = child.parentNode;
        }
        return false;
    },
    
    _addOrRemoveListeners: function(method, node, listeners, capturing) {
        if (!node || !listeners) {
            return;
        }
        method = method + 'EventListener';
        for (var i in listeners) {
            if (listeners.hasOwnProperty(i) && (typeof listeners[i] === 'function')) {
                node[method](i, listeners[i], !!capturing);
            }
        }
    },
    
    addListeners: function(node, listeners, capturing) {
        this._addOrRemoveListeners('add', node, listeners, capturing);
    },
    
    removeListeners: function(node, listeners, capturing) {
        this._addOrRemoveListeners('remove', node, listeners, capturing);
    },
    
    getImageSize: function(image) {
        var sz = image ? { 
            width: image.naturalWidth || image.width,
            height: image.naturalHeight || image.height
        } : null;
        return sz && (typeof sz.width === 'number') ? sz : null;
    },
    
    isTaintedImage: function(imgOrCv) {
        if (!imgOrCv) {
            return false;
        }
        if (imgOrCv.tagName == 'IMG') {
            return utils.isCrossOrigin(location.href, imgOrCv.src);
        }
        if (imgOrCv.tagName == 'CANVAS') {
            try {
                imgOrCv.getContext('2d').getImageData(0, 0, 1, 1);
                return false;
            } catch(exc) {
                return true;
            }
        }
        return false;
    },
    
    isGoodImage: function(imgOrCv) {
        return (imgOrCv && (imgOrCv.nodeType === 1) && /^(?:IMG|CANVAS)$/.test(imgOrCv.tagName) && !uiUtils.isTaintedImage(imgOrCv));
    },
    
    _tempDiv: null,
    createCanvas: function(image, size, scale) {
        size = size || this.getImageSize(image);
        if (!size) {
            return null;
        }
        if (!this._tempDiv) {
            this._tempDiv = document.createElement('div');
        }
        this._tempDiv.innerHTML = utils.applyTemplate('<canvas width="${width}" height="${height}"></canvas>', size);
		var cv = this._tempDiv.firstChild;
        this._tempDiv.removeChild(cv);
        if (this.isGoodImage(image)) {
            graphUtils.copyImage(image, cv, scale);
        }
		return cv;
	},
    
    createNodes: function(html) {
        if (!html) {
            return [];
        }
        if (!this._tempDiv) {
            this._tempDiv = document.createElement('div');
        }
        
        this._tempDiv.innerHTML = html;
        return this.removeChilds(this._tempDiv, []);
	},
    
    bgImageUrl: function(size, color1, color2) {
        var cv = this.createCanvas({width: size * 2, height: size * 2});
        var ctx = cv.getContext('2d');
        ctx.fillStyle = color1;
        ctx.fillRect(0, 0, size, size);
        ctx.fillRect(size, size, size, size);
        ctx.fillStyle = color2;
        ctx.fillRect(0, size, size, size);
        ctx.fillRect(size, 0, size, size);
        return cv.toDataURL('image/png');
    },
    
    getInsertPoint: function(size, parentSize, elem) {
        var point = {x: 0, y: 0};
        if (size.width < parentSize.width) {
            point.x = Math.round((parentSize.width - size.width) / 2);
        }
        if (size.height < parentSize.height) {
            point.y = Math.round((parentSize.height - size.height) / 2);
        }
        return point;
    },
    
    textSplit: function(textarea) {
        var arr = textarea.value.split(/\r?\n/);
        // to-do: breaks
        return arr;
    }
};