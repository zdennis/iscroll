
iScroll.prototype._transitionTime = function (time) {
	time = time || 0;
	this.scrollerStyle[utils.style.transitionDuration] = time + 'ms';

	if ( this.indicator1 ) {
		this.indicator1.transitionTime(time);
	}

	if ( this.indicator2 ) {
		this.indicator2.transitionTime(time);
	}
};

iScroll.prototype._transitionTimingFunction = function (easing) {
	this.scrollerStyle[utils.style.transitionTimingFunction] = easing;

	if ( this.indicator1 ) {
		this.indicator1.transitionTimingFunction(easing);
	}

	if ( this.indicator2 ) {
		this.indicator2.transitionTimingFunction(easing);
	}
};
