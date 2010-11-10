YUI.add('synthetic-touch-events', function(Y) {
    var EV_TOUCH_START = "nodetouch:touchstart",
        EV_TOUCH_MOVE  = "nodetouch:touchmove",
        EV_TOUCH_END   = "nodetouch:touchend",
        TOUCH_TIMEOUT_THRESH = 50,
        EV_TOUCH_TIMEOUT = "nodetouch:touchtimeout",
        EV_LONG_TOUCH_START = "nodetouch:longtouchstart",
        EV_LONG_TOUCH_MOVE  = "nodetouch:longtouchmove",
        EV_LONG_TOUCH_END   = "nodetouch:longtouchend",
        LONG_TOUCH_START    = "longtouchstart",
        LONG_TOUCH_MOVE     = "longtouchmove",
        LONG_TOUCH_END      = "longtouchend";

Y.Event.define("tap", {
    on: function(node, subscription, notifier) {
        var touch, touchstartHandle, touchEndHandle, touchmoveHandle, startTime, evt, identifier, tapStart;
        function startTap() {
            startTime = (new Date()).getTime();
            tapStart = true;
        }
        
        function endTap() {
            if(tapStart) {
                var duration = (new Date()).getTime() - startTime;
                tapStart = false;
                startTime = null;
                return duration;
            }
            return false;
        }
        
        
        touchstartHandle = node.on("touchstart", function( e ) {
            evt = e._event;
            if(evt.touches.length > 1) {
                endTap();
                return;
            }
            touch = evt.touches[0];
            identifier = touch.identifier;
            startTap();
        });
        
        touchmoveHandle = node.on("touchmove", function( e ) {
            endTap();
        });
        
        touchendHandle = node.on("touchend", function( e ) {
            if(tapStart) {
                var duration = endTap();
                if(duration !== false && duration < 20) {
                    notifier.fire(e)
                }
            }
        });
        
        subscription.startHandle = touchstartHandle;
        subscription.moveHandle  = touchmoveHandle;
        subscription.endHandle   = touchendHandle;
    },
    detach: function(node, subscription, notifier) {
        subscription.startHandle.detach();
        subscription.moveHandle.detach();
        subscription.endHandle.detach();
    }
});

Y.Event.define(LONG_TOUCH_START, {
    on: function(node, subscription, notifier) {
        // notifies when a touch starts and is held for a minimum period of time
        var  longstartHandle, touchnode;
        
        subscription._evtGuid = Y.guid() + '|';
        touchnode = Y.Touch.Manager.getNode( node );
        longstartHandle = touchnode.on(subscription._evtGuid + EV_LONG_TOUCH_START, function( e ) {
            notifier.fire( e.ev );
        });
        subscription.startHandle = longstartHandle;
    },

    detach: function(node, subscription, notifier) {
        var dt = subscription.startHandle.detach(); 
    }
});

Y.Event.define(LONG_TOUCH_MOVE, {
    on: function(node, subscription, notifier) {
        // notifies by attaching a longtouchstart listener, and fires
        // when touch is moved after longtouchstart fires
        var longtouchstarted = false, longstartHandle, longmoveHandle, touchnode;
        touchnode = Y.Touch.Manager.getNode( node );
        longmoveHandle = touchnode.on(EV_LONG_TOUCH_MOVE, function( e ) {
            notifier.fire(e.ev);
        });
        subscription.moveHandle = longmoveHandle;
    },
    detach: function(node, subscription, notifier) {
        subscription.moveHandle.detach();
    }
});

Y.Event.define(LONG_TOUCH_END, {
    on: function(node, subscription, notifier) {
        // notifies by attaching a longtouchstartlistener, and fires
        // when touch ends after longtouchstart fires
        var longtouchstarted = false, longstartHandle, longendHandle, touchnode;
        touchnode = Y.Touch.Manager.getNode( node );
        longendHandle = touchnode.on(EV_LONG_TOUCH_END, function( e ) {
            notifier.fire(e.ev);
        });
        subscription.endHandle = longendHandle;
    },
    detach: function(node, subscription, notifier) {
        subscription.endHandle.detach();
    }
});

Y.Event.define("swipe", {
    on: function( node, subscription, notifier ) {
        var touchstartHandle, touchendHandle, touchmoveHandle;
        var startX, startY, curX, curY, endX, endY, speed, direction, startTime, diffTime, diffX, diffY, swiping;
        touchstartHandle = node.on("touchstart", function( e ) {
            var evt = e._event;
            if(evt.touches.length > 1) {
                return;
            }
            var touch = evt.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            startTime = (new Date()).getTime();
            addMoveHandle();
            addEndHandle();
        });
        subscription.startHandle = touchstartHandle;
        
        function addMoveHandle() {
            touchmoveHandle = node.on("touchmove", function( ev ) {
                var evt = ev._event;
                if(evt.touches.length > 1 ) {
                    return;
                }
                var touch = evt.touches[0];
                curX = touch.clientX;
                curY = touch.clientY;
                diffTime =  (new Date()).getTime() - startTime;
                diffX = Math.abs(curX - startX);
                diffY = Math.abs(curY - startY);
                if(diffX > diffTime || diffY > diffTime) {
                    if( (Math.max(diffX, diffY) / Math.min(diffX, diffY)) < 20 ) {
                        swiping = true;
                        notifier.fire((diffX > diffY) ? "horizontal" : "vertical");
                    }
                }
            });
            subscription.moveHandle = touchMoveHandle;
        }
        
        function addEndHandle() {
        try{
            touchendHandle = node.on("touchend", function( ev ) {
                var evt = ev._event;
                if(swiping) {
                    swiping = false;
                }
                detachMoveHandle();
                detachEndHandle();
            });
            subscription.endHandle = touchendHandle;
        } catch(e) { Y.log(e) }
        }
        
        function detachMoveHandle() {
            if(subscription.moveHandle) {
                subscription.moveHandle.detach();
            }
            
        }
        
        function detachEndHandle() {
            if(subscription.endHandle) {
                subscription.endHandle.detach();
            }
        }
        
        
        
    },
    detach: function( node, subscription, notifier ) {
        subscription.startHandle.detach();
        //detachMoveHandle();
        //detachEndHandle();
    }
});
}, '3.1.1' ,{requires:['touch-manager', 'event-synthetic']});
