YUI.add('dd-touch', function(Y) {
    var DDM = Y.DD.DDM,
        NODE = 'node',
        DRAG_NODE = 'dragNode',
        HOST = 'host',
        OFFSET_HEIGHT = 'offsetHeight',
        OFFSET_WIDTH = 'offsetWidth',
        TRUE = true, proto,
        TOUCH_START = 'longtouchstart',
        TOUCH_END   = 'touchend',
        TOUCH_MOVE  = 'touchmove',
        YTOUCH = (parseFloat(Y.version) >= 3.2),
        T = function(config) {
            var valid = DDM._setupTouchListeners(this);
            T.superclass.constructor.apply(this, arguments);
        },
        TD = function(config) {
            TD.superclass.constructor.apply(this, arguments);
        },
        EV_DRAG        = 'drag:drag',
        EV_END         = 'drag:end',
        EV_TOUCH_START = 'drag:touchStart',
        EV_TOUCH_MOVE  = 'drag:touchMove',
        EV_TOUCH_END   = 'drag:touchEnd',
        EV_AFTER_MOUSE_DOWN = 'drag:afterMouseDown',
        EV_AFTER_TOUCH_START = 'drag:afterTouchStart';
        
    T.NAME = 'DDTouch';
    T.NS = 'touch';
    T.ATTRS = {
        touchTimeThresh: { valueFn: function() {
            var host = this.get(HOST);
            return host.get("clickTimeThresh");
            
        }},
        touchHandles: { value: [] },
        invalidTouchHandles: { value: [] },
        useTransform: { value: false },
        offsetXY: { value: [0, 0] },
        touchEnabled: { value: false },
        handlers: { value: {} },
        guid: { 
            valueFn: function() {
                return Y.guid();
            },
            writeOnce: true
        }
    };
    
    TD.NAME = 'DDTouchDrop';
    TD.NS   = 'touchdrop';
    TD.ATTRS = {
    };
    
    proto = {
        _createEventsTouch: function() {
            var host = this.get(HOST);
            this.publish(EV_TOUCH_START, {
                defaultFn: this._defTouchStartFn,
                queuable: false,
                emitFacade: true,
                bubbles: true,
                prefix: 'drag'
            });

            host.publish(EV_TOUCH_END, {
                defaultFn: Y.bind(this._defTouchEndFn, this),
                queuable: false,
                emitFacade: true,
                bubbles: true,
                prefix: 'drag'
            });
            
            var ev = [];
            
            Y.each(ev, function(v, k) {
                this.publish(v, {
                    type: v,
                    emitFacade: true,
                    bubbles: true,
                    preventable: false,
                    queuable: false,
                    prefix: 'drag'
                });
            }, this);
        },
        initializer: function(cfg) {
            if(Y.UA.webkitTouch) {
                try {
                    var host = this.get(HOST);
                    this._createEventsTouch();
                    this._prepTouch();

                  
                    Y.each(this.get("touchHandles"), function(sel) {
                      host.addHandle( sel );
                    });
  
                    Y.each(this.get("invalidTouchHandles"), function(sel) {
                      host.addInvalid( sel );
                    });
    
                } catch(err) {
                    Y.log(err, "error", "DDTouch.initializer");
                }
                this.set("touchEnabled", true);
            }
        },
        destructor: function() {
            this._unprepTouch();
            this.detachAll();
        },
        _touching: false,
        _prepTouch: function() {
            if(YTOUCH) {
                this._prepTouch32();
                return;
            }
            var host = this.get(HOST);
            var node = host.get(NODE);
            var guid = this.get("guid");

            host._dragThreshMet = false;
            node.addClass(DDM.CSS_PREFIX + '-draggable');

            var handlers = this.get("handlers");
            handlers.touchstart = node.on(guid + "|" + TOUCH_START, Y.bind(this._handleTouchStart, this));
//            handlers.touchend   = node.on(TOUCH_END, Y.bind(this._handleTouchEnd, this));
            handlers.evdrag = host.on(EV_DRAG, Y.bind(this._defTouchDragFn, this));
            handlers.evend = host.on(EV_END, Y.bind(this._defTouchEndFn, this));
            handlers.evmousedown = node.on("mousedown", function(e){e.preventDefault();});
        },
        _prepTouch32: function() {
            var host = this.get(HOST);
            var node = host.get(NODE);

            Y.DD.Drag.START_EVENT = TOUCH_START;
            node.on(Y.DD.Drag.START_EVENT, Y.bind(host._handleMouseDownEvent, host), {
                minDistance: 0,
                minTime: 0
            });
            return;
        },
        _unprepTouch: function() {
            var handlers = this.get("handlers");
            for(var h in handlers) {
                Y.detach(handlers[h]);
//                handlers[h].detach();
            }
            this.set("handlers", {});
        },
        _handleTouchStart: function(e) {
            var ev = (e.details) ? e.details[0] : e; //.details[0];
            var host = this.get(HOST);
//            ev.preventDefault();
            this.fire(EV_TOUCH_START, { ev: ev });
            //this._defTouchStartFn({'ev':ev});
        },
        _handleTouchEnd: function(ev) {
            var host = this.get(HOST);
            host.fire(EV_TOUCH_END, { ev: ev });
        },
        /**
        * @private
        * @method _defTouchStartFn
        * @description Handler for the touchstart DOM event
        * @param {Event.Facade}
        */
        _defTouchStartFn: function(e) {
            try {
            var host = this.get(HOST);
            var ev = e.ev;
            // get individual touch instance
            var touches = ev._event.touches;
            if(touches.length > 1) {
                if(DDM.activeDrag) {
                    DDM.activeDrag.stopDrag();
                }
                return;
            }
            var touchEv = touches[0];
            
            // mix touch properties into touchEvent object to mimic 
            // mouse down event
            
            Y.mix(ev, touchEv, true, ['clientX', 'clientY', 'identifier', 'pageX', 'pageY', 'screenX', 'screenY']);

            host._dragThreshMet = false;
            host._ev_md = ev;

            if ( host.validClick(ev) ) {
                ev.halt();
                if(host.offset) {
                    host._setStartPosition([ev.pageX, ev.pageY]);
                }
                else {
                    this._setTouchStartPosition([ev.pageX, ev.pageY]);
                }

                DDM.activeDrag = host;
                
                host._clickTimeout = Y.later(this.get('touchTimeThresh'), host, host._timeoutCheck);
            }
            this.fire(EV_AFTER_MOUSE_DOWN, { ev: ev });
            this.fire(EV_AFTER_TOUCH_START, { ev: ev });
            this.touching = true;
          } catch(err) { Y.log(err, "error", "Y.DD.DDTouch"); }
        },
/*        _defTouchEndFn: function(e) {
            var host = this.get(HOST);
            var ev = e.ev;
            host._handleMouseUp(e);
        },*/
        _defTouchDragFn: function(e) {
        try {
            if(this.touching) {
                var host = this.get(HOST),
                    pageXOffset = window.pageXOffset,
                    pageYOffset = window.pageYOffset,
                    startXY,
                    translateX,
                    translateY;
                    
                if (host.get('move')) {
                    if (e.scroll) {
                        e.scroll.node.set('scrollTop', e.scroll.top);
                        e.scroll.node.set('scrollLeft', e.scroll.left);
                    }
                    translateX = e.info.offset[0];
                    translateY = e.info.offset[1];
    
    
                    host.get(DRAG_NODE).setStyle("webkitTransform", "translate(" + translateX + "px, " + translateY + "px)");
    //                host.get(DRAG_NODE).setXY([e.pageX, e.pageY]);
    //                host.realXY = [e.pageX, e.pageY];
                }
                e.preventDefault();
            }
        } catch(err) { Y.log(err, "error", "Y.DD.DDTouch"); }
        },
        _defTouchEndFn: function(e) {
            var host = this.get(HOST),
            dn = host.get(DRAG_NODE);
            
            dn.setStyle("webkitTransform", "translate(0, 0)");
            dn.setXY([host.lastXY[0], host.lastXY[1]]);
            host.realXY = [host.lastXY[0], host.lastXY[1]]; 
            this.touching = false;
            
        },
        _setTouchStartPosition: function(xy) {
            var host = this.get(HOST),
            pageXOffset = window.pageXOffset,
            pageYOffset = window.pageYOffset,
            offsetXY = this.get('offsetXY'),
            nodeXY   = host.get(NODE).getXY();

            // fix top and left when page is scrolled in Webkit Mobile
            xy[0] = xy[0] - pageXOffset;
            xy[1] = xy[1] - pageYOffset;

            nodeXY[0] = nodeXY[0] - pageXOffset;
            nodeXY[1] = nodeXY[1] - pageYOffset;

            host.startXY = xy;
            
            
            host.nodeXY = host.lastXY = host.realXY = nodeXY;
            
            
            
            if (host.get('offsetNode')) {
                host.deltaXY = [(host.startXY[0] - host.nodeXY[0]) + offsetXY[0], (host.startXY[1] - host.nodeXY[1]) + offsetXY[1]];
            } else {
                host.deltaXY = [offsetXY[0], offsetXY[1]];
            }
        }
        
    }


    Y.namespace('Plugin');
    Y.extend(T, Y.Plugin.Base, proto);
    Y.Plugin.DDTouch = T;


    var tdproto = {
        touchShim: false,
        initializer: function(cfg) {
            if(Y.UA.webkitTouch && (!YTOUCH || Y.UA.ios >= 4.1) ) {
//                Y.log("starting touch drop instance initialization");
                try {
                    var host = this.get(HOST);
                    this.beforeHostMethod("sizeShim", this._sizeTouchShim );
                    this._prepShimForTouch();
//                    this.afterHostMethod("_createShim", function() { Y.log("Host Drop Prepped") });
    
                } catch(err) {
                    Y.log(err);
                }
            }
            else {
//                Y.log("Client is not touch enabled, DDTouchDrop not initialized");
            }
        },
        _sizeTouchShim: function() {
            var host = this.get(HOST);
            if (!DDM.activeDrag) {
                return false; //Nothing is dragging, no reason to activate.
            }
            if (host.get(NODE) === DDM.activeDrag.get(NODE)) {
                return false;
            }
            if (host.get('lock') || !host.get('useShim')) {
                return false;
            }
            if (!host.shim) {
                Y.later(100, host, host.sizeShim);
                return false;
            }
            var node = host.get(NODE),
                nh = node.get(OFFSET_HEIGHT),
                nw = node.get(OFFSET_WIDTH),
                xy = node.getXY(),
                p = host.get('padding'),
                pageXOffset = 0, //window.pageXOffset,
                pageYOffset = 0, //window.pageYOffset,
                dd, dH, dW, pre4_1;
                
            // check for pre iOS 4.1
            pre4_1 = (Y.UA.webkit && Y.UA.webkit < 532);
            
            if(pre4_1 || ( Y.UA.ios && YTOUCH ) ) {
                pageXOffset = YTOUCH ? 0 - window.pageXOffset : window.pageXOffset;
                pageYOffset = YTOUCH ? 0 - window.pageYOffset : window.pageYOffset
            }

    
            // fix top and left when page is scrolled in Webkit Mobile
            xy[0] = xy[0] - pageXOffset;
            xy[1] = xy[1] - pageYOffset;

    
            //Apply padding
            nw = nw + p.left + p.right;
            nh = nh + p.top + p.bottom;
            xy[0] = xy[0] - p.left;
            xy[1] = xy[1] - p.top;
            
    
            if (DDM.activeDrag.get('dragMode') === DDM.INTERSECT) {
                //Intersect Mode, make the shim bigger
                dd = DDM.activeDrag;
                dH = dd.get(NODE).get(OFFSET_HEIGHT);
                dW = dd.get(NODE).get(OFFSET_WIDTH);
                
                nh = (nh + dH);
                nw = (nw + dW);
                xy[0] = xy[0] - (dW - dd.deltaXY[0]);
                xy[1] = xy[1] - (dH - dd.deltaXY[1]);
    
            }
            
            
            //Set the style on the shim
            host.shim.setStyles({
                height: nh + 'px',
                width: nw + 'px',
                top: xy[1] + 'px',
                left: xy[0] + 'px'
            });
            
            //Create the region to be used by intersect when a drag node is over us.
            host.region = {
                '0': xy[0], 
                '1': xy[1],
                area: 0,
                top: xy[1],
                right: xy[0] + nw,
                bottom: xy[1] + nh,
                left: xy[0]
            };
            
            
            return new Y.Do.Prevent();
            
          },
        _prepShimForTouch: function() {
            var host = this.get(HOST);
            if (!DDM._pg) {
                Y.later(10, this, this._prepShimForTouch);
                return;
            }
            if(!host.shim) {
                Y.later(10, this, this._prepShimForTouch);
                return;
            }
            if (this.touchShim) {
                return;
            }

            if (host.get('useShim')) {
                /*
                host.shim.on('mouseover', Y.bind(this._handleOverEvent, this));
                host.shim.on('mouseout', Y.bind(this._handleOutEvent, this));
                */
            }


            this.touchShim = true;
            
        }
        
    };

    Y.extend(TD, Y.Plugin.Base, tdproto);
    Y.Plugin.DDDropTouch = TD;
    

    // add some sugar to DDM
    Y.mix(DDM, {
        _touchActive: null,
        _regDragTouch: function(d) {
            if (!this._touchActive) {
                this._setupTouchListeners();
            }
            return true;
        },
        _touchMove: function(e) {   
        try {
            var ev, touches, touchEv;
            if(e.details) {
                touchEv = ev = e.details[0];
            }
            else {
                ev = e;
                touches = ev._event.touches;
                if(touches.length > 1) {
                    if(this.activeDrag) {
                        this.activeDrag.stopDrag();
                    }
                    return;
                }
                touchEv = touches[0];
                Y.mix(ev, touchEv, true);
            }
            if (this.activeDrag && this.activeDrag.touch.touching) {
                this.activeDrag._move.call(this.activeDrag, ev);
                this._dropMove();
            }
        } catch(err) { Y.log(err, "error", "Y.DDM~touch"); }
        },
        _setupTouchListeners: function() {
            if(Y.UA.webkitTouch) {
                this._touchActive = true;
                var doc = Y.one(document);
                doc.on(TOUCH_MOVE, Y.bind(this._touchMove, this));
//                doc.on(TOUCH_MOVE, Y.throttle(Y.bind(this._touchMove, this), this.get('throttleTime')));
                //Y.Event.nativeAdd(document, 'mousemove', Y.bind(this._move, this));
                doc.on(TOUCH_END, Y.bind(this._end, this));
                this._setupShimListeners();
            }
        },
        _setupShimListeners: function() {
            if (!DDM._pg) {
                Y.later(10, this, this._setupShimListeners);
                return;
            }
            this._pg.on(TOUCH_END, Y.bind(this._end, this));
            this._pg.on(TOUCH_MOVE, Y.bind(this._touchMove, this));
//            this._pg.on(TOUCH_MOVE, Y.throttle(Y.bind(this._touchMove, this), this.get('throttleTime')));
        }
        
        
    });    
}, '3.1.1', {requires:['plugin', 'node-event-touch', 'synthetic-touch-events', 'dd-ddm', 'dd-drag', 'dd-drop']});
