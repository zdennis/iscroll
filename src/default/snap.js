
iScroll.prototype._initSnap = function () {
	this.pages = [];
	this.currentPage = {};

	this._addCustomEvent('refresh', function () {
		var i = 0, l,
			m = 0, n,
			cx, cy,
			x = 0, y,
			stepX = this.options.snapStepX || this.wrapperWidth,
			stepY = this.options.snapStepY || this.wrapperHeight,
			el;

		if ( this.options.snap === true ) {
			cx = Math.round( stepX / 2 );
			cy = Math.round( stepY / 2 );

			while ( x >= -this.scrollerWidth ) {
				this.pages[i] = [];
				l = 0;
				y = 0;

				while ( y >= -this.scrollerHeight ) {
					this.pages[i][l] = {
						x: Math.max(x, this.maxScrollX),
						y: Math.max(y, this.maxScrollY),
						cx: x - cx,
						cy: y - cy
					};

					y -= stepY;
					l++;
				}

				x -= stepX;
				i++;
			}
		} else {
			el = this.options.snap;
			l = el.length;
			n = -1;

			for ( ; i < l; i++ ) {
				if ( el[i].offsetLeft === 0 ) {
					m = 0;
					n++;
				}

				if ( !this.pages[m] ) {
					this.pages[m] = [];
				}

				x = Math.max(-el[i].offsetLeft, this.maxScrollX);
				y = Math.max(-el[i].offsetTop, this.maxScrollY);
				cx = x - Math.round(el[i].offsetWidth / 2);
				cy = y - Math.round(el[i].offsetHeight / 2);

				this.pages[m][n] = {
					x: x,
					y: y,
					cx: cx,
					cy: cy
				};

				m++;
			}
		}

		this.currentPage = {
			x: this.pages[0][0].x,
			x: this.pages[0][0].y,
			pageX: 0,
			pageY: 0
		};

	});
};

iScroll.prototype._nearestSnap = function (x, y) {
	var i = 0,
		l = this.pages.length,
		m = 0;

	if ( Math.abs(x - this.absStartX) < this.options.snapThreshold &&
		Math.abs(y - this.absStartY) < this.options.snapThreshold ) {
		return this.currentPage;
	}

	for ( ; i < l; i++ ) {
		if ( x >= this.pages[i][0].cx ) {
			x = this.pages[i][0].x;
			break;
		}
	}

	l = this.pages[i].length;

	for ( ; m < l; m++ ) {
		if ( y >= this.pages[0][m].cy ) {
			y = this.pages[0][m].y;
			break;
		}
	}

	if ( i == this.currentPage.pageX ) {
		i += this.directionX;

		if ( i < 0 ) {
			i = 0;
		} else if ( i >= this.pages.length ) {
			i = this.pages.length - 1;
		}

		x = this.pages[i][0].x;
	}

	if ( m == this.currentPage.pageY ) {
		m += this.directionY;

		if ( m < 0 ) {
			m = 0;
		} else if ( m >= this.pages[0].length ) {
			m = this.pages[0].length - 1;
		}

		y = this.pages[0][m].y;
	}

	return {
		x: x,
		y: y,
		pageX: i,
		pageY: m
	};
};
