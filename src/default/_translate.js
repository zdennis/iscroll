
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

	this.indicator1 && this.indicator1.updatePosition();
	this.indicator2 && this.indicator2.updatePosition();
};
