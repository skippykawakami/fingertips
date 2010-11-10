YUI.add('node-event-touch', function(Y) {

var GESTURE_CHECK = 'ongesturestart';
// ongesturestart;

// Touch detection from : http://alastairc.ac/2010/03/detecting-touch-based-browsing/
// still looking for better touch support detection
function isTouchDevice() {
   var el = document.createElement('div');
   el.setAttribute(GESTURE_CHECK, 'return;');
   if(typeof el[GESTURE_CHECK] == "function"){
      return true;
   } else {
      return false
   }
}

var supportsTouch = isTouchDevice(); //'createTouch' in document;


Y.mix(Y.UA, {
    webkitTouch: supportsTouch
});

if(Y.UA.webkitTouch) {
    Y.mix(Y.Node.DOM_EVENTS, {
        touchstart: 1,
        touchmove: 1,
        touchend: 1,
        gesturestart: 1,
        gesturechange: 1,
        gestureend: 1
    });
}



}, '3.1.1' ,{requires:['node-base']});

