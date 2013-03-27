
iScroll.prototype._translate = function (x, y) {
	this.scrollerStyle[utils.style.transform] = 'translate(' + x + 'px,' + y + 'px)' + utils.style.translateZ;
	this.x = x;
	this.y = y;
};
