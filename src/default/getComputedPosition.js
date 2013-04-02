
iScroll.prototype.getComputedPosition = function () {
	var matrix = window.getComputedStyle(this.scroller, null),
		x, y;

	if ( this.options.useTransform ) {
		matrix = matrix[utils.style.transform].split(')')[0].split(', ');
		x = +(matrix[12] || matrix[4]);
		y = +(matrix[13] || matrix[5]);
	} else {
		x = +matrix.left.replace(/[^-\d]/g, '');
		y = +matrix.top.replace(/[^-\d]/g, '');
	}

	return { x: x, y: y };
};
