
iScroll.prototype.getComputedPosition = function () {
	var matrix = getComputedStyle(this.scroller, null)[utils.style.transform].split(')')[0].split(', ');

	return {
		x: +(matrix[12] || matrix[4]),
		y: +(matrix[13] || matrix[5])
	};
};
