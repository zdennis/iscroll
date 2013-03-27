
iScroll.prototype.getComputedPosition = function (el) {
	var matrix = getComputedStyle(el, null);

	matrix = matrix[utils.style.transform].split(')')[0].split(', ');

	return {
		x: +(matrix[12] || matrix[4]),
		y: +(matrix[13] || matrix[5])
	};
};
