YUI.add('dd-drag-offset', function(Y) {

    /**
     * Adds plugin capability to allow for controlling delta of dragged element
     * @module dd-drag
     * @submodule dd-drag-offset
     */     
    /**
     * Provides the ability to drag a Node.
     * @class Drag
     * @extends Base
     * @constructor
     * @namespace DD
     */

    var DDM = Y.DD.DDM,
        NODE = 'node',
        DRAG_NODE = 'dragNode',
        HOST = 'host',
        OFFSET_HEIGHT = 'offsetHeight',
        OFFSET_WIDTH = 'offsetWidth',
        TRUE = true, proto,
        DRAG_START = 'dragstart',
        START_POSITION_FN = '_setTouchStartPosition',
        OFFSET_TYPE_PIXELS  = 0,
        OFFSET_TYPE_COORD = 1,
        YTOUCH = (parseFloat(Y.version) >= 3.2),
        DDO = function(config) {
            DDO.superclass.constructor.apply(this, arguments);
        };
        
    DDO.NAME = "dragoffset";
    DDO.ATTRS = {
        "offsetXY": { value: [0.5, 0.5] },
        "touchOffsetXY": { value: false },
        "offsetType": { value: OFFSET_TYPE_COORD }
    };
    
    DDO.NS = "offset";
    var proto = {
        initializer: function(cfg) {
            var host = this.get(HOST);
            host.set("startCentered", true);
            
            this.beforeHostMethod("_setStartPosition", this._setStartPosition );
            
        },

        _calculateDelta: function(evtXY, nodeXY, nodeWH) {
            try {
            var host = this.get(HOST), touchEnabled, pageXOffset, pageYOffset, proxy, pre4_1;

            // check for pre iOS 4.1
            pre4_1 = ( Y.UA.webkit && Y.UA.webkit < 532);

            touchEnabled = (YTOUCH) ? Y.UA.ios || Y.UA.android : (host.touch && host.touch.get("touchEnabled"));
            proxy = (host.proxy) ? true : false;
            if( YTOUCH ) {
                pageXOffset = ( touchEnabled && proxy && !pre4_1 ) ? 0 - window.pageXOffset : 0;
                pageYOffset = ( touchEnabled && proxy && !pre4_1 ) ? 0 - window.pageYOffset : 0;
            } else {
                pageXOffset = ( touchEnabled && proxy && pre4_1 ) ? window.pageXOffset : 0;
                pageYOffset = ( touchEnabled && proxy && pre4_1 ) ? window.pageYOffset : 0;
            }            
            //pageXOffset and pageYOffset correct for scroll in webkit touch devices
            
            var offsetXY = (touchEnabled && this.get("touchOffsetXY")) ? this.get("touchOffsetXY") : this.get("offsetXY");
            var offsetType = this.get("offsetType");
            
            if(offsetType) {
                return [(offsetXY[0] * nodeWH[0]) - pageXOffset, (offsetXY[1] * nodeWH[1]) - pageYOffset];
            }
            else {
                return [offsetXY[0], offsetXY[1]];
            }
            } 
            catch(e) {
                Y.log("Error in calculateDelta");
            }
        },
        
        _setStartPosition: function(xy) {
            try {
            var host = this.get(HOST), ow, oh, node, dragnode, pageXOffset, pageYOffset, _pageXOffset, _pageYOffset, nodeXY, pre4_1;
            
            // check for pre iOS 4.1
            pre4_1 = (Y.UA.webkit && Y.UA.webkit < 532);
            
            touchEnabled = (YTOUCH) ? Y.UA.ios || Y.UA.android : (host.touch && host.touch.get("touchEnabled"));
//            touchEnabled = Y.UA.ios || Y.UA.android; // (host.touch && host.touch.get("touchEnabled")) ? true : false;
            
            _pageXOffset = window.pageXOffset;
            _pageYOffset = window.pageYOffset;
            
            if( YTOUCH ) {
                pageXOffset = ( touchEnabled && !pre4_1 ) ? 0 - window.pageXOffset : 0;
                pageYOffset = ( touchEnabled && !pre4_1 ) ? 0 - window.pageYOffset : 0;
            } else {
                pageXOffset = ( touchEnabled && pre4_1 ) ? window.pageXOffset : 0;
                pageYOffset = ( touchEnabled && pre4_1 ) ? window.pageYOffset : 0;
            }            
            
            
            dragnode = host.get(DRAG_NODE);
            ow = dragnode.get(OFFSET_WIDTH);
            oh = dragnode.get(OFFSET_HEIGHT);

            // fix top and left when page is scrolled in Webkit Mobile
            xy[0] = xy[0] + pageXOffset;
            xy[1] = xy[1] + pageYOffset;

            nodeXY   = host.get(NODE).getXY();
            nodeXY[0] = nodeXY[0] - pageXOffset;
            nodeXY[1] = nodeXY[1] - pageYOffset;


            host.startXY = xy;
            
            
            host.nodeXY = host.lastXY = host.realXY = nodeXY;
            
            host.deltaXY = this._calculateDelta(xy, host.nodeXY, [ow, oh]);        
            
            return new Y.Do.Prevent();
            } catch(e) { 
                alert("error in _setStartPosition");
            }
        }
    }

    Y.extend(DDO, Y.Plugin.Base, proto);
    Y.Plugin.DDDragOffset = DDO;

}, '3.1.1', {requires:['plugin', 'dd-drag']});
