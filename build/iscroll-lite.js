/*! iScroll v5.0.0-pre ~ (c) 2008-2013 Matteo Spinelli, http://cubiq.org ~ cubiq.org/license */
var iScroll = (function (window, document, Math) {


var rAF = window.requestAnimationFrame	||
	window.webkitRequestAnimationFrame	||
	window.mozRequestAnimationFrame		||
	window.oRequestAnimationFrame		||
	window.msRequestAnimationFrame		||
	function (callback) { window.setTimeout(callback, 1000 / 60); };

var utils = (function () {
	var me = {};

	var _elementStyle = document.createElement('div').style;
	var _vendor = (function () {
		var vendors = ['t', 'webkitT', 'MozT', 'msT', 'OT'],
			transform,
			i = 0,
			l = vendors.length;

		for ( ; i < l; i++ ) {
			transform = vendors[i] + 'ransform';
			if ( transform in _elementStyle ) return vendors[i].substr(0, vendors[i].length-1);
		}

		return false;
	})();

	function _prefixStyle (style) {
		if ( _vendor === false ) return false;
		if ( _vendor === '' ) return style;
		return _vendor + style.charAt(0).toUpperCase() + style.substr(1);
	}

	me.getTime = Date.now || function getTime () { return new Date().getTime(); };

	me.extend = function (target, obj) {
		for ( var i in obj ) {
			target[i] = obj[i];
		}
	};

	me.addEvent = function (el, type, fn, capture) {
		el.addEventListener(type, fn, !!capture);
	};

	me.removeEvent = function (el, type, fn, capture) {
		el.removeEventListener(type, fn, !!capture);
	};

	me.momentum = function (current, start, time, lowerMargin, wrapperSize) {
		var distance = current - start,
			speed = Math.abs(distance) / time,
			destination,
			duration,
			deceleration = 0.0006;

		destination = current + ( speed * speed ) / ( 2 * deceleration ) * ( distance < 0 ? -1 : 1 );
		duration = speed / deceleration;

		if ( destination < lowerMargin ) {
			destination = wrapperSize ? lowerMargin - ( wrapperSize / 2.5 * ( speed / 8 ) ) : lowerMargin;
			distance = Math.abs(destination - current);
			duration = distance / speed;
		} else if ( destination > 0 ) {
			destination = wrapperSize ? wrapperSize / 2.5 * ( speed / 8 ) : 0;
			distance = Math.abs(current) + destination;
			duration = distance / speed;
		}

		return {
			destination: Math.round(destination),
			duration: duration
		};
	};

	var _transform = _prefixStyle('transform');

	me.extend(me, {
		hasTransform: _transform !== false,
		hasPerspective: _prefixStyle('perspective') in _elementStyle,
		hasTouch: 'ontouchstart' in window,
		hasPointer: navigator.msPointerEnabled,
		hasTransition: _prefixStyle('transition') in _elementStyle
	});

	me.extend(me.style = {}, {
		transform: _transform,
		transitionTimingFunction: _prefixStyle('transitionTimingFunction'),
		transitionDuration: _prefixStyle('transitionDuration')
	});

	me.hasClass = function (e, c) {
		var re = new RegExp("(^|\\s)" + c + "(\\s|$)");
		return re.test(e.className);
	};

	me.addClass = function (e, c) {
		if ( me.hasClass(e, c) ) {
			return;
		}

		var newclass = e.className.split(' ');
		newclass.push(c);
		e.className = newclass.join(' ');
	};

	me.removeClass = function (e, c) {
		if ( !me.hasClass(e, c) ) {
			return;
		}

		var re = new RegExp("(^|\\s)" + c + "(\\s|$)", 'g');
		e.className = e.className.replace(re, '');
	};

	me.extend(me.ease = {}, {
		quadratic: {
			style: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
			fn: function (k) {
				return k * ( 2 - k );
			}
		},
		circular: {
			style: 'cubic-bezier(0.1, 0.57, 0.1, 1)',	// Not properly "circular" but this looks better, it should be (0.075, 0.82, 0.165, 1)
			fn: function (k) {
				return Math.sqrt( 1 - ( --k * k ) );
			}
		},
		back: {
			style: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
			fn: function (k) {
				var b = 4;
				return ( k = k - 1 ) * k * ( ( b + 1 ) * k + b ) + 1;
			}
		},
		bounce: {
			style: '',
			fn: function (k) {
				if ( ( k /= 1 ) < ( 1 / 2.75 ) ) {
					return 7.5625 * k * k;
				} else if ( k < ( 2 / 2.75 ) ) {
					return 7.5625 * ( k -= ( 1.5 / 2.75 ) ) * k + 0.75;
				} else if ( k < ( 2.5 / 2.75 ) ) {
					return 7.5625 * ( k -= ( 2.25 / 2.75 ) ) * k + 0.9375;
				} else {
					return 7.5625 * ( k -= ( 2.625 / 2.75 ) ) * k + 0.984375;
				}
			}
		},
		elastic: {
			style: '',
			fn: function (k) {
				f = 0.225;
				e = 1;

				if ( k === 0 ) { return 0; }
				if ( k == 1 ) { return 1; }

				return ( e * Math.pow( 2, - 10 * k ) * Math.sin( ( k - f / 4 ) * ( 2 * Math.PI ) / f ) + 1 );
			}
		}
	});

	return me;
})();


function iScroll (el, options) {
	this.wrapper = typeof el == 'string' ? document.querySelector(el) : el;
	this.scroller = this.wrapper.children[0];
	this.scrollerStyle = this.scroller.style;		// cache style for better performance

	this.options = {
		startX: 0,
		startY: 0,
		scrollX: false,
		scrollY: true,
		lockDirection: true,
		momentum: true,

		bounce: true,
		bounceTime: 600,
		bounceEasing: 'circular',

		preventDefault: true,
		eventPassthrough: false,

		HWCompositing: true,
		useTransition: true,
		useTransform: true,

		mouseWheel: false,
		invertWheelDirection: false,

		keyBindings: false,

		scrollbars: false,			// false | true | 'custom' | <object>
		interactiveScrollbars: false,
		resizeIndicator: true
	};

	for ( var i in options ) {
		this.options[i] = options[i];
	}

	// Normalize options
	this.translateZ = this.options.HWCompositing && utils.hasPerspective ? ' translateZ(0)' : '';

	this.options.useTransition = utils.hasTransition && this.options.useTransition;
	this.options.useTransform = utils.hasTransform && this.options.useTransform;
	this.options.invertWheelDirection = this.options.invertWheelDirection ? -1 : 1;

	this.options.eventPassthrough = this.options.eventPassthrough === true ? 'vertical' : this.options.eventPassthrough;
	this.options.preventDefault = !this.options.eventPassthrough && this.options.preventDefault;

	// If you want eventPassthrough I have to lock one of the axes
	this.options.scrollY = this.options.eventPassthrough == 'vertical' ? false : this.options.scrollY;
	this.options.scrollX = this.options.eventPassthrough == 'horizontal' ? false : this.options.scrollX;

	// With eventPassthrough we also need lockDirection mechanism
	this.options.lockDirection = this.options.lockDirection || this.options.eventPassthrough;
	this.directionLockThreshold = this.options.eventPassthrough ? 0 : 5;

	this.options.bounceEasing = typeof this.options.bounceEasing == 'string' ? utils.ease[this.options.bounceEasing] || utils.ease.circular : this.options.bounceEasing;

	// Some defaults	
	this.x = 0;
	this.y = 0;
	this._events = {};

	this._init();
	this.refresh();

	this.scrollTo(this.options.startX, this.options.startY);
	this.enable();
}

iScroll.prototype.handleEvent = function (e) {
	switch ( e.type ) {
		case 'touchstart':
		case 'MSPointerDown':
		case 'mousedown':
			this._start(e);
			break;
		case 'touchmove':
		case 'MSPointerMove':
		case 'mousemove':
			this._move(e);
			break;
		case 'touchend':
		case 'MSPointerUp':
		case 'mouseup':
			this._end(e);
			break;
		case 'touchcancel':
		case 'MSPointerCancel':
		case 'mousecancel':
			this._end(e);
			break;
		case 'orientationchange':
		case 'resize':
			this._resize();
			break;
		case 'transitionend':
		case 'webkitTransitionEnd':
		case 'oTransitionEnd':
		case 'MSTransitionEnd':
			this._transitionEnd(e);
			break;
		case 'DOMMouseScroll':
		case 'mousewheel':
			this._wheel(e);
			break;
		case 'keydown':
			this._key(e);
			break;
	}
};

iScroll.prototype.destroy = function () {
	this._initEvents(true);

	this._execCustomEvent('destroy');
};

iScroll.prototype._transitionEnd = function (e) {
	if ( e.target != this.scroller ) {
		return;
	}

	this._transitionTime(0);
	this.resetPosition(this.options.bounceTime);
};

iScroll.prototype._start = function (e) {
	if ( !this.enabled ) {
		return;
	}

	// stick with one event type (touches only or mouse only)
	if ( this.initiated && e.type !== this.initiated ) {
		return;
	}

	if ( this.options.preventDefault ) {
		e.preventDefault();
	}

	var point = e.touches ? e.touches[0] : e,
		pos;

	this.initiated	= e.type;
	this.moved		= false;
	this.distX		= 0;
	this.distY		= 0;
	this.directionLocked = 0;

	this._transitionTime();
	
	this.isAnimating = false;
	this.startTime = utils.getTime();

	if ( this.options.useTransition && this.isInTransition ) {
		pos = this.getComputedPosition();

		this._translate(Math.round(pos.x), Math.round(pos.y));
		this.isInTransition = false;
	}

	this.startX = this.x;
	this.startY = this.y;
	this.pointX = point.pageX;
	this.pointY = point.pageY;
};

iScroll.prototype._move = function (e) {
	if ( !this.enabled || !this.initiated ) {
		return;
	}

	if ( this.options.preventDefault ) {	// increases performance on Android? TODO: check!
		e.preventDefault();
	}

	var point		= e.touches ? e.touches[0] : e,
		deltaX		= point.pageX - this.pointX,
		deltaY		= point.pageY - this.pointY,
		timestamp	= utils.getTime(),
		newX, newY,
		absDistX, absDistY;

	this.pointX		= point.pageX;
	this.pointY		= point.pageY;

	this.distX		+= deltaX;
	this.distY		+= deltaY;
	absDistX		= Math.abs(this.distX);
	absDistY		= Math.abs(this.distY);

	// We need to move at least 10 pixels for the scrolling to initiate
	if ( timestamp - this.endTime > 300 && (absDistX < 10 && absDistY < 10) ) {
		return;
	}

	// If you are scrolling in one direction lock the other
	if ( !this.directionLocked && this.options.lockDirection ) {
		if ( absDistX > absDistY + this.directionLockThreshold ) {
			this.directionLocked = 'h';		// lock horizontally
		} else if ( absDistY >= absDistX + this.directionLockThreshold ) {
			this.directionLocked = 'v';		// lock vertically
		} else {
			this.directionLocked = 'n';		// no lock
		}
	}

	if ( this.directionLocked == 'h' ) {
		if ( this.options.eventPassthrough == 'vertical' ) {
			e.preventDefault();
		} else if ( this.options.eventPassthrough == 'horizontal' ) {
			this.initiated = false;
			return;
		}

		deltaY = 0;
	} else if ( this.directionLocked == 'v' ) {
		if ( this.options.eventPassthrough == 'horizontal' ) {
			e.preventDefault();
		} else if ( this.options.eventPassthrough == 'vertical' ) {
			this.initiated = false;
			return;
		}

		deltaX = 0;
	}

	newX = this.x + (this.hasHorizontalScroll ? deltaX : 0);
	newY = this.y + (this.hasVerticalScroll ? deltaY : 0);

	// Slow down if outside of the boundaries
	if ( newX > 0 || newX < this.maxScrollX ) {
		newX = this.options.bounce ? this.x + deltaX / 3 : newX > 0 ? 0 : this.maxScrollX;
	}
	if ( newY > 0 || newY < this.maxScrollY ) {
		newY = this.options.bounce ? this.y + deltaY / 3 : newY > 0 ? 0 : this.maxScrollY;
	}

	this.moved = true;

	if ( timestamp - this.startTime > 300 ) {
		this.startTime = timestamp;
		this.startX = this.x;
		this.startY = this.y;
	}

	this._translate(newX, newY);
};

iScroll.prototype._end = function (e) {
	if ( !this.enabled || !this.initiated ) {
		return;
	}

	var point = e.changedTouches ? e.changedTouches[0] : e,
		momentumX,
		momentumY,
		duration = utils.getTime() - this.startTime,
		newX = Math.round(this.x),
		newY = Math.round(this.y),
		time,
		easing = '';

	this.isInTransition = 0;
	this.initiated = false;
	this.endTime = utils.getTime();

	// reset if we are outside of the boundaries
	if ( this.resetPosition(this.options.bounceTime) ) {
		return;
	}

	// we scrolled less than 10 pixels
	if ( !this.moved ) {
		return;
	}

	// start momentum animation if needed
	if ( this.options.momentum && duration < 300 ) {
		momentumX = this.hasHorizontalScroll ? utils.momentum(this.x, this.startX, duration, this.maxScrollX, this.options.bounce ? this.wrapperWidth : 0) : { destination: newX, duration: 0 };
		momentumY = this.hasVerticalScroll ? utils.momentum(this.y, this.startY, duration, this.maxScrollY, this.options.bounce ? this.wrapperHeight : 0) : { destination: newY, duration: 0 };
		newX = momentumX.destination;
		newY = momentumY.destination;
		time = Math.max(momentumX.duration, momentumY.duration);
		this.isInTransition = 1;
	}

	if ( newX != this.x || newY != this.y ) {
		if ( newX > 0 || newX < this.maxScrollX || newY > 0 || newY < this.maxScrollY ) {
			easing = utils.ease.quadratic;
		}
		this.scrollTo(newX, newY, time, easing);
	}
};

iScroll.prototype._animate = function (destX, destY, duration, easingFn) {
	var that = this,
		startX = this.x,
		startY = this.y,
		startTime = utils.getTime(),
		destTime = startTime + duration;

	function step () {
		var now = utils.getTime(),
			newX, newY,
			easing;

		if ( now >= destTime ) {
			that.isAnimating = false;
			that._translate(destX, destY);
			that.resetPosition(that.options.bounceTime);
			return;
		}

		now = ( now - startTime ) / duration;
		easing = easingFn(now);
		newX = ( destX - startX ) * easing + startX;
		newY = ( destY - startY ) * easing + startY;
		that._translate(newX, newY);

		if ( that.isAnimating ) {
			rAF(step);
		}
	}

	this.isAnimating = true;
	step();
};

iScroll.prototype._resize = function () {
	this.refresh();
	this.resetPosition();
};

iScroll.prototype.resetPosition = function (time) {
	if ( this.x <= 0 && this.x >= this.maxScrollX && this.y <= 0 && this.y >= this.maxScrollY ) {
		return false;
	}

	var x = this.x,
		y = this.y;

	time = time || 0;

	if ( !this.hasHorizontalScroll || this.x > 0 ) {
		x = 0;
	} else if ( this.x < this.maxScrollX ) {
		x = this.maxScrollX;
	}

	if ( !this.hasVerticalScroll || this.y > 0 ) {
		y = 0;
	} else if ( this.y < this.maxScrollY ) {
		y = this.maxScrollY;
	}

	this.scrollTo(x, y, time, this.options.bounceEasing);

	return true;
};

iScroll.prototype.disable = function () {
	this.enabled = false;
};

iScroll.prototype.enable = function () {
	this.enabled = true;
};

iScroll.prototype.refresh = function () {
	var rf = this.wrapper.offsetHeight;		// Force refresh

	this.wrapperWidth	= this.wrapper.clientWidth;
	this.wrapperHeight	= this.wrapper.clientHeight;

	this.scrollerWidth	= Math.round(this.scroller.offsetWidth);
	this.scrollerHeight	= Math.round(this.scroller.offsetHeight);

	this.maxScrollX		= this.wrapperWidth - this.scrollerWidth;
	this.maxScrollY		= this.wrapperHeight - this.scrollerHeight;

	this.hasHorizontalScroll	= this.options.scrollX && this.maxScrollX < 0;
	this.hasVerticalScroll		= this.options.scrollY && this.maxScrollY < 0;

	this.endTime		= 0;

	this._execCustomEvent('refresh');
};

iScroll.prototype._addCustomEvent = function (type, fn) {
	if ( !this._events[type] ) {
		this._events[type] = [];
	}

	this._events[type].push(fn);
};

iScroll.prototype._execCustomEvent = function (type) {
	if ( !this._events[type] ) {
		return;
	}

	var i = 0,
		l = this._events[type].length;

	if ( !l ) {
		return;
	}

	for ( ; i < l; i++ ) {
		this._events[type][i].call(this);
	}
};

iScroll.prototype.scrollBy = function (x, y, time) {
	x = this.x + x;
	y = this.y + y;
	time = time || 0;

	this.scrollTo(x, y, time);
};

iScroll.prototype.scrollTo = function (x, y, time, easing) {
	easing = easing || utils.ease.circular;

	if ( !time || (this.options.useTransition && easing.style) ) {
		this._transitionTimingFunction(easing.style);
		this._transitionTime(time);
		this._translate(x, y);
	} else {
		this._animate(x, y, time, easing.fn);
	}
};


iScroll.prototype._init = function () {

	this._initEvents();

};


iScroll.prototype._initEvents = function (remove) {
	var eventType = remove ? utils.removeEvent : utils.addEvent;

	eventType(window, 'orientationchange', this);
	eventType(window, 'resize', this);

	if ( utils.hasTouch ) {
		eventType(this.wrapper, 'touchstart', this);
		eventType(window, 'touchmove', this);
		eventType(window, 'touchcancel', this);
		eventType(window, 'touchend', this);
	}

	if ( utils.hasPointer ) {
		eventType(this.wrapper, 'MSPointerDown', this);
		eventType(window, 'MSPointerMove', this);
		eventType(window, 'MSPointerCancel', this);
		eventType(window, 'MSPointerUp', this);
	}

	eventType(this.wrapper, 'mousedown', this);
	eventType(window, 'mousemove', this);
	eventType(window, 'mousecancel', this);
	eventType(window, 'mouseup', this);

	eventType(this.scroller, 'transitionend', this);
	eventType(this.scroller, 'webkitTransitionEnd', this);
	eventType(this.scroller, 'oTransitionEnd', this);
	eventType(this.scroller, 'MSTransitionEnd', this);

	if ( this.options.mouseWheel ) {
		eventType(this.scroller, 'DOMMouseScroll', this);
		eventType(this.scroller, 'mousewheel', this);
	}
};


iScroll.prototype._transitionTime = function (time) {
	time = time || 0;
	this.scrollerStyle[utils.style.transitionDuration] = time + 'ms';
};

iScroll.prototype._transitionTimingFunction = function (easing) {
	this.scrollerStyle[utils.style.transitionTimingFunction] = easing;
};


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

	if ( this.indicator1 ) {	// usually the vertical
		this.indicator1.updatePosition();
	}

	if ( this.indicator2 ) {
		this.indicator2.updatePosition();
	}
};


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


iScroll.ease = utils.ease;

return iScroll;

})(window, document, Math);