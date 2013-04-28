
iScroll.prototype._wheel = function (e) {
	var wheelDeltaX, wheelDeltaY,
		newX, newY;

	e.preventDefault();

	if ( 'wheelDeltaX' in e ) {
		wheelDeltaX = e.wheelDeltaX / 10;
		wheelDeltaY = e.wheelDeltaY / 10;
	} else if ( 'wheelDelta' in e ) {
		wheelDeltaX = wheelDeltaY = e.wheelDelta / 10;
	} else if ( 'detail' in e ) {
		wheelDeltaX = wheelDeltaY = -e.detail * 3;
		console.log(e)
	} else {
		return;
	}

	if ( !this.hasVerticalScroll && wheelDeltaX === 0 ) {
		wheelDeltaX = wheelDeltaY;
	}

	newX = this.x + wheelDeltaX * this.options.invertWheelDirection;
	newY = this.y + wheelDeltaY * this.options.invertWheelDirection;

	if ( newX > 0 ) {
		newX = 0;
	} else if ( newX < this.maxScrollX ) {
		newX = this.maxScrollX;
	}

	if ( newY > 0 ) {
		newY = 0;
	} else if ( newY < this.maxScrollY ) {
		newY = this.maxScrollY;
	}

	this.scrollTo(newX, newY, 0);
};
