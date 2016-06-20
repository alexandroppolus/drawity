var html5 = (function() {

    var html5 = {
        getImage: function(blobOrUrl, corsOptions, callback, ctx) {
            if (!blobOrUrl) {
                callback.call(ctx, {img: null, error: 'noParam'});
                return;
            }
            if (typeof corsOptions == 'function') {
                ctx = callback;
                callback = corsOptions;
                corsOptions = null;
            }
            if (typeof blobOrUrl == 'string') {
                this.getImageFromURL(blobOrUrl, corsOptions, callback, ctx);
            } else {
                this.getImageFromBlob(blobOrUrl, callback, ctx)
            }
        },
        
        getImageFromBlob: function(blob, callback, ctx) {
            if (!blob || (typeof Blob == 'undefined') || !(blob instanceof Blob)) {
                callback.call(ctx, {img: null, error: 'noBlob'});
                return;
            }
            var fileName = blob.name;
            var getImage = this.getImageFromURL;
            if ((typeof URL !== 'undefined') && URL && URL.createObjectURL) {
                var objUrl = URL.createObjectURL(blob);
                getImage(objUrl, null, function(imgInfo) {
                    URL.revokeObjectURL(objUrl);
                    imgInfo.fileName = fileName;
                    callback.call(ctx, imgInfo, blob);
                });
            } else {
                if (typeof FileReader === 'function') {
                    var fr = new FileReader();
                    fr.onload = function() {
                        getImage(this.result, null, function(imgInfo) {
                            imgInfo.fileName = fileName;
                            callback.call(ctx, imgInfo, blob);
                        });
                    };
                    fr.readAsDataURL(blob);
                }
            }
        },
        
        getImageFromURL: function(url, corsOptions, callback, ctx) {
            var img = new Image();
            if (corsOptions && utils.isCrossOrigin(location.href, url)) {
                var resolved = false;
                if (corsOptions.getProxyUrl) {
                    url = corsOptions.getProxyUrl.call(corsOptions.ctx || corsOptions, url);
                    resolved = !utils.isCrossOrigin(location.href, url);
                }
                if (!resolved) {
                    if (img.crossOrigin === undefined) {
                        //attr "crossorigin" not supported
                        callback.call(ctx, {img: null, error: 'crossOrigin'}, url);
                        return;
                    }
                    img.crossOrigin = corsOptions.useCredentials ? 'use-credentials' : 'anonymous';
                }
            }
            img.onload = function() {
                callback.call(ctx, {img: img, error: null}, url);
            };
            img.onerror = function() {
                callback.call(ctx, {img: null, error: 'onError'}, url);
            };
            img.src = url;
        },
        
        getImageFromEvent: function(e, callback, ctx, callbackStartTimer) {
            var el = e.target;
            if (e.type == 'paste') {
                getImageFromDT(e.clipboardData, e.type, function(blob, url, image) {
                    if (blob || url || image) {
                        e.stopPropagation();
                        e.preventDefault();
                    }
                    if (blob) {
                        html5.getImageFromBlob(blob, callback, ctx);
                        return;
                    }
                    if (url) {
                        callback.call(ctx, {url: url, img: null, error: null});
                        return;
                    }
                    if (image) {
                        callback.call(ctx, {url: null, img: image, error: null});
                        return;
                    }

                    if (callbackStartTimer) {
                        callbackStartTimer.call(ctx);
                    }
                    setTimeout(function() {
                        var pastedImg = el.getElementsByTagName('img')[0];
                        if (el.parentNode) {
                            el.parentNode.removeChild(el);
                        }
                        if (pastedImg) {
                            pastedImg.parentNode.removeChild(pastedImg);
                            if (pastedImg.complete) {
                                callback.call(ctx, {img: pastedImg, error: null});
                            } else {
                                pastedImg.onload = function() {
                                    callback.call(ctx, {img: pastedImg, error: null});
                                };
                            }
                        } else {
                            callback.call(ctx, {img: null, error: 'noImage'});
                        }
                    }, 200);
                });
                return;
            }
            
            if (e.type == 'drop') {
                getImageFromDT(e.dataTransfer, e.type, function(blob, url, image) {
                    if (blob) {
                        html5.getImageFromBlob(blob, callback, ctx);
                        return;
                    }
                    if (url) {
                        callback.call(ctx, {url: url, img: null, error: null});
                        return;
                    }
                    if (image) {
                        callback.call(ctx, {url: null, img: image, error: null});
                        return;
                    }
                });
                return;
            }
            
            callback.call(ctx, { img: null, name: null, event: e.type, error: 'notImplemented' });
        }
    };
    
    
    //---------------------------
    var imgTypeRX = /^image\/(?:bmp|ico|png|gif|jpe?g)$/;
    
    var getImageFromDT = function(dt, event, callback) {
        if (!dt) {
            callback(null, null, null);
            return;
        }
        
        var file, i;
        
        if (dt.files && dt.files.length) {
            for(i = 0; i < dt.files.length; ++i) {
                file = dt.files[i];
                if (imgTypeRX.test(file.type)) {
                    callback(file, null, null);
                    return;
                }
            }
        }
        
        if (dt.items) {
            for(i = 0; i < dt.items.length; ++i) {
                var dti = dt.items[i];
                if((dti.kind === 'file') && imgTypeRX.test(dti.type)) {
                    file = dti.getAsFile();
                    if (file) {
                        callback(file, null, null);
                        return;
                    }
                }
            }
        }
        
        getImageUrlFromDTItems(dt, event, callback);
    };
    
    var getImageUrlFromDTItems = function(dt, event, callback) {
        
        var str, type = (event === 'paste') ? 'text/plain' : 'text/html';
        
        try {
            str = dt.getData(type);
        } catch(exc) {}
        
        var image = html5.customImageClipboard.get(str);
        if (image) {
            callback(null, null, image);
            return;
        }
        
        
        var url = (image === false) ? getImageUrlFromDTItem(type, str) : null;
        callback(null, url, null);
    };
    
    var imgSrcRX = /^<img\s[^<>]*\bsrc\s*=\s*['"]((?:http|data:image)[^'"]+)/;
    var base64urlRX = /^data:image\/(?:bmp|ico|png|gif|jpe?g);base64,.{20}/;
    
    var getImageUrlFromDTItem = function(type, str) {
        if (type && str && (str.length < 8000)) {
            if (type === 'text/html') {
                var match = imgSrcRX.exec(str);
                return match ? match[1] : null;
            }
            if (type === 'text/plain') {
                return base64urlRX.test(str) ? str : null;
            }
        }
        return null;
    };
    
    var cbPrefix = 'cicb:jscp-img-51ebce89b51840b490e5469b5eb59c41#';
    
    html5.customImageClipboard = {
        _lastUrl: '',
        _canvas: null,
        
        _tryBase64: function(canvas) {
            if (canvas.width * canvas.height > 10000) {
                return null;
            }
            var url64 = canvas.toDataURL('image/png');
            return url64.length < 8000 ? url64 : null;
        },
    
        put: function(canvas) {
            this._canvas = null;
            this._lastUrl = '';
            
            if (canvas) {
                var url64 = this._tryBase64(canvas);
                if (url64) {
                    return url64;
                }
                
                var savedCanvas = document.createElement('canvas');
                savedCanvas.width = canvas.width;
                savedCanvas.height = canvas.height;
                var ctx = savedCanvas.getContext('2d');
                ctx.drawImage(canvas, 0, 0);
                
                this._canvas = savedCanvas;
                this._lastUrl = cbPrefix + (new Date()).valueOf();
                return this._lastUrl;
            }
            return '';
        },
        
        get: function(url) {
            if (this._lastUrl === url) {
                return this._canvas;
            }
            if (!url || (url.indexOf(cbPrefix) !== 0) || (url.length > cbPrefix.length + 30)) {
                return false;
            }
            return null;
        }
    };
    
    return html5;
})();
