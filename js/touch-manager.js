/*



touch synthetic events:
    subscriber tells touchmanager to listen to a specific node
    (or, alternatively, touchmanager listens to doc and delegates)
    touchmanager fires custom events when touches happen and after certain predefined 
    events (longtouch for instance)
    
    syntetic event listens for events from touchmanager
on:longtouch* subscribe {
    touch manager adds new NodeTouch object
    NodeTouch adds listeners for touchstart, touchmove, touchend
    NodeTouch fires customevents when touchstart, touchmove, touchend fire
    TouchManager uses info from events to fire custom events
    LongTouch subscribe handlers respond to custom events and fire notifiers
}

*/

YUI.add('touch-manager', function(Y) {
    var TOUCH_START = "touchstart",
        TOUCH_MOVE  = "touchmove",
        TOUCH_END   = "touchend",
        EV_TOUCH_START = "nodetouch:nodetouchstart",
        EV_TOUCH_MOVE  = "nodetouch:nodetouchmove",
        EV_TOUCH_END   = "nodetouch:nodetouchend",
        TOUCH_TIMEOUT_THRESH = 25,
        EV_TOUCH_TIMEOUT = "nodetouch:touchtimeout",
        EV_LONG_TOUCH_START = "nodetouch:longtouchstart",
        EV_LONG_TOUCH_MOVE  = "nodetouch:longtouchmove",
        EV_LONG_TOUCH_END   = "nodetouch:longtouchend",
        LONG_TOUCH_START    = "longtouchstart",
        LONG_TOUCH_MOVE     = "longtouchmove",
        LONG_TOUCH_END      = "longtouchend",
        nodetouchproto, touchmgrproto;
        
            
        
    var NodeTouch = function(cfg) {
        NodeTouch.superclass.constructor.apply(this, arguments);
    }
    
    NodeTouch.NAME = "nodetouch";
    NodeTouch.ATTRS = {
        "node": { value: null },
        "manager": { value: null },
        "handlers": { value: {} },
        "handlersAdded": { value: false }
    };
    
    nodetouchproto = {
        initializer: function(cfg) {
            this.node = this.get("node");
            this.createEvents();
            this.resetHandlers();
        },
        destructor: function() {
            this.detachHandlers();
        },
        createEvents: function() {
            this.publish(EV_TOUCH_START, {
                defaultFn: this._defTouchStartFn,
                queuable: false,
                emitFacade: true,
                bubbles: true,
                prefix: 'nodetouch'
            });
            
            this.publish(EV_TOUCH_MOVE, {
                defaultFn: this._defTouchMoveFn,
                queueable: false,
                emitFacade: true,
                bubbles: true,
                prefix: 'nodetouch'
            });
            
            this.publish(EV_TOUCH_END, {
                defaultFn: this._defTouchEndFn,
                queueable: false,
                emitFacade: true,
                bubbles: true,
                prefix: 'nodetouch'
            });
            
            this.publish(EV_TOUCH_TIMEOUT, {
                defaultFn: this._defTouchTimeoutFn,
                queuable: false,
                emitFacade: true,
                prefix: 'nodetouch'
            });
            
            this.publish(EV_LONG_TOUCH_START, {
                defaultFn: this._defLongTouchStartFn,
                preventedFn: this._prevLongTouchStartFn,
                queuable: false, 
                emitFacde: true,
                prefix: 'nodetouch'
            });

            this.publish(EV_LONG_TOUCH_MOVE, {
                defaultFn: this._defLongTouchMoveFn,
                preventedFn: this._prevLongTouchMoveFn,
                queuable: false, 
                emitFacde: true,
                prefix: 'nodetouch'
            });

            this.publish(EV_LONG_TOUCH_END, {
                defaultFn: this._defLongTouchEndFn,
                preventedFn: this._prevLongTouchEndFn,
                queuable: false, 
                emitFacde: true,
                prefix: 'nodetouch'
            });
        },
        node: null,
        
        _defTouchStartFn: function(e) {
            var evt = e.ev;
            this.startTouchTimeout( TOUCH_TIMEOUT_THRESH, evt );
        },
        
        _defTouchMoveFn: function(e) {
            var evt = e.ev;
            if(this.touching) {
                this.fire(EV_LONG_TOUCH_MOVE, {
                    ev:evt
                });
            }
        },
        
        _defTouchEndFn: function(e) {
            var evt = e.ev;
            if(this.touching) {
                evt.preventDefault();
                this.fire(EV_LONG_TOUCH_END, {
                    ev:evt
                });
            }
            this.touching = false;
        },
        
        _defTouchTimeoutFn: function(e) {
            this.touching = true;
        },
        
        _defLongTouchStartFn: function(e) {
        },
        
        _prevLongTouchStartFn: function(e) {
            this.touching = false;
        },
        
        _defLongTouchMoveFn: function(e) {
            var evt = e.ev;
            evt.preventDefault();
        },
        
        _prevLongTouchMoveFn: function(e) {
        },
        
        _defLongTouchEndFn: function(e) {
        },
        
        _prevLongTouchEndFn: function(e) {
        },
        
        startTouchTimeout: function( thresh, e ) {
            this.touching = false;
//            e.preventDefault();
            this.timer = Y.later( thresh, this, this.timeoutHandler, e );
        },
        
        cancelTouchTimeout: function() {
            this.timer.cancel();
        },
        
        timeoutHandler: function( evt ) {
            evt.halt();
            this.fire(EV_TOUCH_TIMEOUT, {
                ev: evt
            });
            
            this.fire(EV_LONG_TOUCH_START, {
                ev: evt
            });
        },
        
        
        timer: null,
        longtouchstarted: false,
        touchstart: null,
        touchmove: null,
        touchend: null,
        touching: false,
        starttime: null,
        onTouchStart: function(e) {
            var evt = e._event, touchEv;
            try {
                if(evt.touches.length == 1) {
                    touchEv = evt.touches[0];
                    this.starttime = new Date();
                    Y.mix(e, touchEv, true, ['clientX', 'clientY', 'identifier', 'pageX', 'pageY', 'screenX', 'screenY']);
                    this.fire( EV_TOUCH_START, { ev:e });
                }
            } catch(err) {
                Y.log(err);
            }
        },
        onTouchMove: function(e) {
            var evt = e._event, touchEv;
            if(!this.touching) {
                // moved before threshold, so this probably isn't
                // an intentional long touch (i.e., drag)
                // probably a swipe
                this.cancelTouchTimeout();
            }
            if(evt.touches.length === 1) {
                touchEv = evt.touches[0];
                Y.mix(e, touchEv, true, ['clientX', 'clientY', 'identifier', 'pageX', 'pageY', 'screenX', 'screenY']);
                this.fire( EV_TOUCH_MOVE, { ev:e });
            }
        },
        onTouchEnd: function(e) {
            var endtime = this.starttime - (new Date());
            var evt = e._event, touchEv;
            if(!this.touching) {
                // ended touch before threshold, so this probably isn't an intentional long touch
                // possibly a tap
                this.cancelTouchTimeout();
            }
            else {
                e.preventDefault();
            }
            touchEv = evt.touches[0];
            Y.mix(e, touchEv, true, ['clientX', 'clientY', 'identifier', 'pageX', 'pageY', 'screenX', 'screenY']);
            e.duration = endtime;
            this.fire( EV_TOUCH_END, { ev:e });
        },
        addHandlers: function() {
            var n = this.get("node");
            this.get("manager").getNodeId( n );
            this.hTouchstart = Y.on("touchstart", Y.bind(this.onTouchStart, this), n);
            this.hTouchmove  = Y.on("touchmove",  Y.bind(this.onTouchMove, this), n);
            this.hTouchend   = Y.on("touchend",   Y.bind(this.onTouchEnd, this), n);
            this.set("handlersAdded", true);
            
        },
        detachHandlers: function() {
            if(this.get("handlersAdded")) {
                this.hTouchstart.detach();
                this.hTouchmove.detach();
                this.hTouchend.detach();
            }
            this.set("handlersAdded", false);
        },
        resetHandlers: function() {
            this.detachHandlers();
            this.addHandlers();
        },
        hTouchstart: null,
        hTouchmove: null,
        hTouchend: null
    };
    
    Y.extend( NodeTouch, Y.Base, nodetouchproto );


    var TouchMgr = function(cfg) {
        TouchMgr.superclass.constructor.apply(this, arguments);
    }

    TouchMgr.NAME = "touchmgr";
    TouchMgr.ATTRS = { };
    
    var proto = {
        initializer: function(cfg) {
        },
        _touches: {},
        _nodes: {},
        watchNode: function( node ) {
            var nNode = Y.one(node);
        },
        getNodeId: function( node ) {
            var id = node.get("id");
            if(!id) {
                id = Y.stamp(node);
                node.set("id", id);
            }
            return id;
        },
        getNode: function(node) {
            var id = this.getNodeId( node ), nodetouch;
            if(!this._nodes[id] ) {
                nodetouch = new Y.Touch.NodeTouch( {"node": node, "manager": this } );
                this._nodes[id] = nodetouch
            }
            else {
                nodetouch = this._nodes[id];
                nodetouch.resetHandlers();
            }
            return nodetouch;
        },
        getTouch: function(id) {
            if(!this._touches[id]) {
                return null;
            }
        }
        
    };
    
    Y.extend(TouchMgr, Y.Base, proto);
    

    Y.namespace('Touch');
    Y.Touch.NodeTouch = NodeTouch;
    Y.Touch.Manager = new TouchMgr();
    
}, '3.1.1' ,{requires:['base', 'node-event-touch']});
