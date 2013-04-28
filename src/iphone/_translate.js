
iScroll.prototype._translate = function (x, y) {
	this.scrollerStyle[utils.style.transform] = 'translate(' + x + 'px,' + y + 'px)' + this.translateZ;
	this.x = x;
	this.y = y;
};
