
iScroll.prototype._init = function () {

	this._initEvents();

	if ( this.options.scrollbars || this.options.indicators ) {
		this._initIndicators();
	}

	if ( this.options.snap ) {
		this._initSnap();
	}

};
