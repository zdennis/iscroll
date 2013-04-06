
iScroll.prototype._initEvents = function (remove) {
	var eventType = remove ? utils.removeEvent : utils.addEvent;

	eventType(window, 'orientationchange', this);

	eventType(this.wrapper, 'touchstart', this);
	eventType(window, 'touchmove', this);
	eventType(window, 'touchcancel', this);
	eventType(window, 'touchend', this);

	eventType(this.wrapper, 'mousedown', this);
	eventType(window, 'mousemove', this);
	eventType(window, 'mousecancel', this);
	eventType(window, 'mouseup', this);

	eventType(this.scroller, 'transitionend', this);
	eventType(this.scroller, 'webkitTransitionEnd', this);
};
