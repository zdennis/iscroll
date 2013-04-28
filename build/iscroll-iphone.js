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

		scrollbars: false,			// false | true | 'default' | 'custom' | <object>
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

function createDefaultScrollbar (direction, interactive, type) {
	var scrollbar = document.createElement('div'),
		indicator = document.createElement('div');

	if ( type == 'default' ) {
		scrollbar.style.cssText = 'position:absolute;z-index:9999';
		indicator.style.cssText = '-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;position:absolute;background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.9);border-radius:3px';
	}

	indicator.className = 'iScrollIndicator';

	if ( direction == 'h' ) {
		if ( type == 'default' ) {
			scrollbar.style.cssText += ';height:7px;left:2px;right:2px;bottom:0';
			indicator.style.height = '100%';
		}
		scrollbar.className = 'iScrollHorizontalScrollbar';
	} else {
		if ( type == 'default' ) {
			scrollbar.style.cssText += ';width:7px;bottom:2px;top:2px;right:1px';
			indicator.style.width = '100%';
		}
		scrollbar.className = 'iScrollVerticalScrollbar';
	}

	if ( !interactive ) {
		scrollbar.style.pointerEvents = 'none';
	}

	scrollbar.appendChild(indicator);

	return scrollbar;
}

iScroll.prototype._initScrollbars = function () {
	var interactive = this.options.interactiveScrollbars,
		defaultScrollbars = typeof this.options.scrollbars != 'object',
		indicator1,
		indicator2;

	if ( this.options.scrollbars ) {
		// Vertical scrollbar
		if ( this.options.scrollY ) {
			indicator1 = {
				el: createDefaultScrollbar('v', interactive, this.options.scrollbars),
				interactive: interactive,
				defaultScrollbars: true,
				resize: this.options.resizeIndicator,
				listenX: false
			};

			this.wrapper.appendChild(indicator1.el);
		}

		// Horizontal scrollbar
		if ( this.options.scrollX ) {
			indicator2 = {
				el: createDefaultScrollbar('h', interactive, this.options.scrollbars),
				interactive: interactive,
				defaultScrollbars: true,
				resize: this.options.resizeIndicator,
				listenY: false
			};

			this.wrapper.appendChild(indicator2.el);
		}
	} else {
		indicator1 = this.options.indicators.length ? this.options.indicators[0] : this.options.indicators;
		indicator2 = this.options.indicators[1] && this.options.indicators[1];
	}

	if ( indicator1 ) {
		this.indicator1 = new Indicator(this, indicator1);
	}

	if ( indicator2 ) {
		this.indicator2 = new Indicator(this, indicator2);
	}

	this._addCustomEvent('refresh', function () {
		this.indicator1 && this.indicator1.refresh();
		this.indicator2 && this.indicator2.refresh();
	});
};

function Indicator (scroller, options) {
	this.wrapper = typeof options.el == 'string' ? document.querySelector(options.el) : options.el;
	this.indicator = this.wrapper.children[0];
	this.indicatorStyle = this.indicator.style;
	this.scroller = scroller;

	this.options = {
		listenX: true,
		listenY: true,
		interactive: false,
		resize: true,
		defaultScrollbars: false
	};

	for ( var i in options ) {
		this.options[i] = options[i];
	}

	if ( this.options.interactive ) {
		utils.addEvent(this.indicator, 'touchstart', this);
		utils.addEvent(this.indicator, 'MSPointerDown', this);
		utils.addEvent(this.indicator, 'mousedown', this);

		utils.addEvent(window, 'touchend', this);
		utils.addEvent(window, 'MSPointerMove', this);
		utils.addEvent(window, 'mouseup', this);
	}
}

Indicator.prototype.handleEvent = function (e) {
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
	}
};

Indicator.prototype._start = function (e) {
	var point = e.touches ? e.touches[0] : e;

	e.preventDefault();
	e.stopPropagation();

	this.transitionTime(0);

	this.lastPointX	= point.pageX;
	this.lastPointY	= point.pageY;

	this.startTime	= utils.getTime();

	utils.addEvent(window, 'touchmove', this);
	utils.addEvent(window, 'MSPointerMove', this);
	utils.addEvent(window, 'mousemove', this);
};

Indicator.prototype._move = function (e) {
	var point = e.touches ? e.touches[0] : e,
		deltaX, deltaY,
		newX, newY,
		timestamp = utils.getTime();

	deltaX = point.pageX - this.lastPointX;
	this.lastPointX = point.pageX;

	deltaY = point.pageY - this.lastPointY;
	this.lastPointY = point.pageY;

	newX = this.x + deltaX;
	newY = this.y + deltaY;

	this._pos(newX, newY);

	e.preventDefault();
	e.stopPropagation();
};

Indicator.prototype._end = function (e) {
	e.preventDefault();
	e.stopPropagation();

	utils.removeEvent(window, 'touchmove', this);
	utils.removeEvent(window, 'MSPointerMove', this);
	utils.removeEvent(window, 'mousemove', this);
};

Indicator.prototype.transitionTime = function (time) {
	time = time || 0;
	this.indicatorStyle[utils.style.transitionDuration] = time + 'ms';
};

Indicator.prototype.transitionTimingFunction = function (easing) {
	this.indicatorStyle[utils.style.transitionTimingFunction] = easing;
};

Indicator.prototype.refresh = function () {
	this.transitionTime(0);

	if ( this.options.listenX && !this.options.listenY ) {
		this.indicatorStyle.display = this.scroller.hasHorizontalScroll ? 'block' : 'none';
	} else if ( this.options.listenY && !this.options.listenX ) {
		this.indicatorStyle.display = this.scroller.hasVerticalScroll ? 'block' : 'none';
	} else {
		this.indicatorStyle.display = this.scroller.hasHorizontalScroll || this.scroller.hasVerticalScroll ? 'block' : 'none';
	}

	if ( this.scroller.hasHorizontalScroll && this.scroller.hasVerticalScroll ) {
		utils.addClass(this.wrapper, 'iScrollBothScrollbars');
		utils.removeClass(this.wrapper, 'iScrollLoneScrollbar');
	} else {
		utils.removeClass(this.wrapper, 'iScrollBothScrollbars');
		utils.addClass(this.wrapper, 'iScrollLoneScrollbar');
	}

//if ( this.options.listenX ) {
//	this.wrapper.style.right = this.scroller.hasHorizontalScroll && this.scroller.hasVerticalScroll ? '8px' : '2px';
//	this.wrapper.style.display = this.scroller.hasHorizontalScroll ? 'block' : 'none';
//} else {
//	this.wrapper.style.bottom = this.scroller.hasHorizontalScroll && this.scroller.hasVerticalScroll ? '8px' : '2px';
//	this.wrapper.style.display = this.scroller.hasVerticalScroll ? 'block' : 'none';
//}

	var r = this.wrapper.offsetHeight;	// force refresh

	if ( this.options.listenX ) {
		this.wrapperWidth = this.wrapper.clientWidth;
		this.indicatorWidth = this.options.resize ? Math.max(Math.round(this.wrapperWidth * this.wrapperWidth / this.scroller.scrollerWidth), 8) : 20;
		this.indicatorStyle.width = this.indicatorWidth + 'px';
		this.maxPosX = this.wrapperWidth - this.indicatorWidth;
		this.sizeRatioX = this.scroller.maxScrollX && (this.maxPosX / this.scroller.maxScrollX);	
	}

	if ( this.options.listenY ) {
		this.wrapperHeight = this.wrapper.clientHeight;
		this.indicatorHeight = this.options.resize ? Math.max(Math.round(this.wrapperHeight * this.wrapperHeight / this.scroller.scrollerHeight), 8) : 20;
		this.indicatorStyle.height = this.indicatorHeight + 'px';
		this.maxPosY = this.wrapperHeight - this.indicatorHeight;
		this.sizeRatioY = this.scroller.maxScrollY && (this.maxPosY / this.scroller.maxScrollY);
	}

	this.updatePosition();
};

Indicator.prototype.updatePosition = function () {
	var x = Math.round(this.sizeRatioX * this.scroller.x) || 0,
		y = Math.round(this.sizeRatioY * this.scroller.y) || 0;

	if ( x < 0 ) {
		x = 0;
	} else if ( x > this.maxPosX ) {
		x = this.maxPosX;
	}

	if ( y < 0 ) {
		y = 0;
	} else if ( y > this.maxPosY ) {
		y = this.maxPosY;
	}

	this.x = x;
	this.y = y;

	if ( this.scroller.options.useTransform ) {
		this.indicatorStyle[utils.style.transform] = 'translate(' + x + 'px,' + y + 'px)' + this.scroller.translateZ;
	} else {
		this.indicatorStyle.left = x + 'px';
		this.indicatorStyle.top = y + 'px';
	}
};

Indicator.prototype._pos = function (x, y) {
	if ( x < 0 ) {
		x = 0;
	} else if ( x > this.maxPosX ) {
		x = this.maxPosX;
	}

	if ( y < 0 ) {
		y = 0;
	} else if ( y > this.maxPosY ) {
		y = this.maxPosY;
	}

	this.scroller.scrollTo(Math.round(x / this.sizeRatioX), Math.round(y / this.sizeRatioY));
};


iScroll.prototype._transitionTime = function (time) {
	time = time || 0;
	this.scrollerStyle[utils.style.transitionDuration] = time + 'ms';

	this.indicator1 && this.indicator1.transitionTime(time);
	this.indicator2 && this.indicator2.transitionTime(time);
};

iScroll.prototype._transitionTimingFunction = function (easing) {
	this.scrollerStyle[utils.style.transitionTimingFunction] = easing;

	this.indicator1 && this.indicator1.transitionTimingFunction(easing);
	this.indicator2 && this.indicator2.transitionTimingFunction(easing);
};


iScroll.prototype._init = function () {

	this._initEvents();

	if ( this.options.scrollbars || this.options.indicators ) {
		this._initScrollbars();
	}

};


iScroll.prototype._initEvents = function (remove) {
	var eventType = remove ? utils.removeEvent : utils.addEvent;

	eventType(window, 'orientationchange', this);

	eventType(this.wrapper, 'touchstart', this);
	eventType(window, 'touchmove', this);
	eventType(window, 'touchcancel', this);
	eventType(window, 'touchend', this);

	eventType(this.wrapper, 'mousedown', this);
	eventType(window, 'mousemove', this);
	eventType(window, 'mousecancel', this);
	eventType(window, 'mouseup', this);

	eventType(this.scroller, 'transitionend', this);
	eventType(this.scroller, 'webkitTransitionEnd', this);
};


iScroll.prototype._translate = function (x, y) {
	this.scrollerStyle[utils.style.transform] = 'translate(' + x + 'px,' + y + 'px)' + this.translateZ;
	this.x = x;
	this.y = y;
};


iScroll.prototype.getComputedPosition = function () {
	var matrix = getComputedStyle(this.scroller, null)[utils.style.transform].split(')')[0].split(', ');

	return {
		x: +(matrix[12] || matrix[4]),
		y: +(matrix[13] || matrix[5])
	};
};


return iScroll;
})(window, document, Math);