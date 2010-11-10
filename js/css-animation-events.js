YUI.add('css-animation-events', function(Y) {

/*
    Adds intrinsic support for webkit CSS animation events.
    Currently uses very naive webkit detection (doesn't consider webkit version, probably not an issue)
*/    

function isWebkit() {
    return (Y.UA.webkit) ? true : false;
}

var cssAnimationEvents = isWebkit(); //'createTouch' in document;


Y.mix(Y.UA, {
    CSSAnimationEvents: cssAnimationEvents
});

if(Y.UA.CSSAnimationEvents) {
    Y.mix(Y.Node.DOM_EVENTS, {
        webkitAnimationStart: 1,
        webkitAnimationEnd: 1,
        webkitAnimationIteration: 1
    });
}



}, '3.1.1' ,{requires:['node-base']});
