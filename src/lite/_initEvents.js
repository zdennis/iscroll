
iScroll.prototype._initEvents = function (remove) {
	var eventType = remove ? utils.removeEvent : utils.addEvent;

	eventType(window, 'orientationchange', this);
	eventType(window, 'resize', this);

	if ( utils.hasTouch ) {
		eventType(this.wrapper, 'touchstart', this);
		eventType(window, 'touchmove', this);
		eventType(window, 'touchcancel', this);
		eventType(window, 'touchend', this);
	}

	if ( utils.hasPointer ) {
		eventType(this.wrapper, 'MSPointerDown', this);
		eventType(window, 'MSPointerMove', this);
		eventType(window, 'MSPointerCancel', this);
		eventType(window, 'MSPointerUp', this);
	}

	eventType(this.wrapper, 'mousedown', this);
	eventType(window, 'mousemove', this);
	eventType(window, 'mousecancel', this);
	eventType(window, 'mouseup', this);

	eventType(this.scroller, 'transitionend', this);
	eventType(this.scroller, 'webkitTransitionEnd', this);
	eventType(this.scroller, 'oTransitionEnd', this);
	eventType(this.scroller, 'MSTransitionEnd', this);

	if ( this.options.mouseWheel ) {
		eventType(this.scroller, 'DOMMouseScroll', this);
		eventType(this.scroller, 'mousewheel', this);
	}
};
