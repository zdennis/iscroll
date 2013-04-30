
iScroll.prototype._translate = function (x, y) {
	if ( this.options.useTransform ) {
		this.scrollerStyle[utils.style.transform] = 'translate(' + x + 'px,' + y + 'px)' + this.translateZ;
	} else {
		x = Math.round(x);
		y = Math.round(y);
		this.scrollerStyle.left = x + 'px';
		this.scrollerStyle.top = y + 'px';
	}

	this.x = x;
	this.y = y;

	if ( this.indicator1 ) {	// usually the vertical
		this.indicator1.updatePosition();
	}

	if ( this.indicator2 ) {
		this.indicator2.updatePosition();
	}
};
