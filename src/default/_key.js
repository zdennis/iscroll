
iScroll.prototype._key = function (e) {
	var newX = this.x,
		newY = this.y,
		now = utils.getTime(),
		prevTime = this.keyTime || 0,
		acceleration = 0.125;

	this.keyAcceleration = now - prevTime < 200 ? Math.min(this.keyAcceleration + acceleration, 50) : 0;

	switch ( e.keyCode ) {
		case 33:
			newY += this.wrapperHeight;
			break;
		case 34:
			newY -= this.wrapperHeight;
			break;
		case 35:
			newY = this.maxScrollY;
			break;
		case 36:
			newY = 0;
			break;
		case 37:
			newX += 5 + this.keyAcceleration>>0;
			break;
		case 38:
			newY += 5 + this.keyAcceleration>>0;
			break;
		case 39:
			newX -= 5 + this.keyAcceleration>>0;
			break;
		case 40:
			newY -= 5 + this.keyAcceleration>>0;
			break;
	}

	if ( newX > 0 ) {
		newX = 0;
		this.keyAcceleration = 0;
	} else if ( newX < this.maxScrollX ) {
		newX = this.maxScrollX;
		this.keyAcceleration = 0;
	}

	if ( newY > 0 ) {
		newY = 0;
		this.keyAcceleration = 0;
	} else if ( newY < this.maxScrollY ) {
		newY = this.maxScrollY;
		this.keyAcceleration = 0;
	}

	this.scrollTo(newX, newY, 0);

	this.keyTime = now;
};
