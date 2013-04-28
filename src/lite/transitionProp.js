
iScroll.prototype._transitionTime = function (time) {
	time = time || 0;
	this.scrollerStyle[utils.style.transitionDuration] = time + 'ms';
};

iScroll.prototype._transitionTimingFunction = function (easing) {
	this.scrollerStyle[utils.style.transitionTimingFunction] = easing;
};
