
iScroll.prototype._transitionTime = function (time) {
	time = time || 0;
	this.scrollerStyle[utils.style.transitionDuration] = time + 'ms';

	this.indicator1 && this.indicator1.transitionTime(time);
	this.indicator2 && this.indicator2.transitionTime(time);
};

iScroll.prototype._transitionTimingFunction = function (easing) {
	this.scrollerStyle[utils.style.transitionTimingFunction] = easing;

	this.indicator1 && this.indicator1.transitionTimingFunction(easing);
	this.indicator2 && this.indicator2.transitionTimingFunction(easing);
};
