var DND = (function() {
    var dragInfo = null;
    var dragInfoInner = null;
    
    var eventItems = ['nodeX', 'nodeY', 'clientX', 'clientY', 'pageX', 'pageY', 'shiftKey', 'altKey', 'ctrlKey', 'metaKey'];
    function copyEventData(src, dest) {
        dest = dest || {};
        for (var i = 0; i < eventItems.length; ++i) {
            dest[eventItems[i]] = src[eventItems[i]];
        }
        dest.cmdKey = dest.ctrlKey || dest.metaKey;
        return dest;
    }
    
    function calcOffset(obj) {
        if (dragInfoInner.offsetNode) {
            var bound = dragInfoInner.offsetNode.getBoundingClientRect();
            obj.nodeX = obj.clientX - Math.round(bound.left);
            obj.nodeY = obj.clientY - Math.round(bound.top);
        }
    }
    
    function getArray(items) {
        if (!items) {
            return null;
        }
        return (items.sort && items.splice) ? items : [items];
    }
    
    function testStart(config, md) {
        var distance = config.options.distance;
        if (distance && (typeof distance == 'number') && (distance > 0)) {
            if (md) { return false; }
            if (Math.abs(dragInfo.start.pageX - dragInfo.current.pageX) +
                    Math.abs(dragInfo.start.pageY - dragInfo.current.pageY) < distance) {
                return false;
            }
        }
    
        if (config.events.dndStart) {
            return (config.events.dndStart.call(config.options.ctx || config.events, dragInfo, md) !== false);
        }
        
        return true;
    }
    
    function onMD(e) {
        if (e.which != 1) {
            return;
        }
        MU(e, true);
        if (!this._dndEnabled || !this._dndConfig) {
            return;
        }
        
        dragInfo = {
            target: e.target || e.srcElement,
            thisElement: this,
            data: {},
            start: copyEventData(e)
        };
        var config = this._dndConfig;
        
        dragInfoInner = {
            started: false,
            offsetNode: config.options.calcOffset
                ? (config.events.dndGetOffsetNode
                    ? config.events.dndGetOffsetNode.call(config.options.ctx || config.events, dragInfo)
                    : dragInfo.thisElement)
                : null
        };
        calcOffset(dragInfo.start);
        dragInfo.current = dragInfo.start;
        
        if (config.events.dndMouseDown) {
            if (config.events.dndMouseDown.call(config.options.ctx || config.events, dragInfo, e) === false) {
                dragInfo = null;
                dragInfoInner = null;
                //console.log('cancel');
                return;
            }
        }
        dragInfo.old = dragInfo.start;
        
        //e.stopPropagation();
        dragInfoInner.started = testStart(config, true);
        setDocEvents(true);
    }
    
    function onMM(e) {
        if (!dragInfo) { return; }
        if (e.which != 1) {
            MU(e, false);
            return;
        }
        var config = dragInfo.thisElement._dndConfig;
        if (dragInfoInner.started) {
            dragInfo.old = copyEventData(dragInfo.current, dragInfo.old == dragInfo.start ? null : dragInfo.old);
        }
        dragInfo.current = copyEventData(e, dragInfo.current == dragInfo.start ? null : dragInfo.current);
        calcOffset(dragInfo.current);
        
        if (!dragInfoInner.started) {
            dragInfoInner.started = testStart(config, false);
            if (!dragInfoInner.started) {
                return;
            }
        }
        if (config.events.dndMove) {
            config.events.dndMove.call(config.options.ctx || config.events, dragInfo);
        }
    }
    
    function MU(e, fromMD) {
        if (dragInfo) {
            var config = dragInfo.thisElement._dndConfig;
            setDocEvents(false);
            if (config) {
                var eventName = dragInfoInner.started ? 'dndStop' : 'dndSkip';
                if (config.events[eventName]) {
                    config.events[eventName].call(config.options.ctx || config.events, dragInfo, fromMD);
                }
                if (config.events.dndMouseUp) {
                    dragInfo.started = dragInfoInner.started;
                    config.events.dndMouseUp.call(config.options.ctx || config.events, dragInfo, fromMD);
                }
            }
            dragInfo = null;
            dragInfoInner = null;
        }
    }
    function onMU(e) {
        return MU(e, false);
    }
    
    function retFalse(e) {
        //console.log("DS!!!!!!!!! " + e.type, this);
        e.preventDefault();
        return false;
    }
    
    function setDocEvents(add) {
        var func = add ? 'addEventListener' : 'removeEventListener';
        document[func]('mousemove', onMM, false);
        document[func]('mouseup', onMU, false);
        document[func]('dragstart', retFalse, false);
    }
    
    return {
        //events { dndGetOffsetNode, dndMouseDown, dndStart, dndMove, dndMouseUp, dndStop, dndSkip }
        //options { ctx, distance, calcOffset }
        create: function(elems, events, options) {
            elems = getArray(elems);
            for(var i = 0; i < elems.length; ++i) {
                if (!elems[i]._dndConfig) {
                    elems[i].addEventListener('mousedown', onMD, false);
                    elems[i].addEventListener('dragstart', retFalse, false);
                }
                elems[i]._dndConfig = {
                    events: events || {},
                    options: options || {}
                };
                elems[i]._dndEnabled = true;
            }
        },
        destroy: function(elems) {                          
            elems = getArray(elems);                    
            for(var i = 0; i < elems.length; ++i) {
                if (elems[i]._dndConfig) {
                    elems[i]._dndConfig = null;
                    elems[i].removeEventListener('mousedown', onMD, false);
                    elems[i].removeEventListener('dragstart', retFalse, false);
                }
            }
        },
        disable: function(elems) {
            elems = getArray(elems);
            for(var i = 0; i < elems.length; ++i) {
                elems[i]._dndEnabled = false;
            }
        },
        enable: function(elems) {
            elems = getArray(elems);
            for(var i = 0; i < elems.length; ++i) {
                elems[i]._dndEnabled = true;
            }
        }
    };
})();
