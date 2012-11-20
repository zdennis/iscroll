/*!
 * iScroll v5.0.0 pre-alpha-use-it-and-kittens-die ~ Copyright (c) 2012 Matteo Spinelli, http://cubiq.org
 * Released under MIT license, http://cubiq.org/license
 */
(function (w, d, M) {
	var
	dummyStyle = d.createElement('div').style,
	transform = (function () {
		var vendors = 't,webkitT,MozT,msT,OT'.split(','),
			transform,
			i = 0,
			l = vendors.length;

		for ( ; i < l; i++ ) {
			transform = vendors[i] + 'ransform';
			if ( transform in dummyStyle ) {
				return transform;
			}
		}

		return false;
	})(),
	vendor = transform !== false && transform.replace(/transform/i, ''),
	cssVendor = vendor ? '-' + vendor + '-' : '',
	transitionTimingFunction = prefixStyle('transitionTimingFunction'),
	transitionDuration = prefixStyle('transitionDuration'),

	has3d = prefixStyle('perspective') in dummyStyle,
	hasTouch = 'ontouchstart' in w,
	hasTransition = prefixStyle('transition') in dummyStyle,

	translateZ = has3d ? ' translateZ(0)' : '',

	isIOS = (/iphone|ipad/i).test(navigator.appVersion),

	eventStart = hasTouch ? 'touchstart' : 'mousedown',
	eventMove = hasTouch ? 'touchmove' : 'mousemove',
	eventEnd = hasTouch ? 'touchend' : 'mouseup',
	eventCancel = hasTouch ? 'touchcancel' : 'mousecancel',
	eventResize = isIOS && w.onorientationchange ? 'orientationchange' : 'resize',
	eventTransitionEnd = (function () {
		if ( vendor === false ) return;

		var transitionEnd = {
				''			: 'transitionend',
				'webkit'	: 'webkitTransitionEnd',
				'Moz'		: 'transitionend',
				'O'			: 'oTransitionEnd',
				'ms'		: 'MSTransitionEnd'
			};

		return transitionEnd[vendor];
	})();

	function bind (el, type, fn, capture) {
		el.addEventListener(type, fn, !!capture);
	}

	function unbind (el, type, fn, capture) {
		el.removeEventListener(type, fn, !!capture);
	}

	function prefixStyle (style) {
		if ( vendor === false ) return false;
		if ( vendor === '' ) return style;
		return vendor + style.charAt(0).toUpperCase() + style.substr(1);
	}

	function iScroll (el, options) {
		var i,
			sb;

		this.wrapper = typeof el == 'string' ? d.querySelector(el) : el;
		this.scroller = this.wrapper.children[0];

		this.options = {
			startX: 0,
			startY: 0,
/*			bounceFn: function (k) {
				var s = 3.5;
				return --k * k * ( ( s + 1 ) * k + s ) + 1;
			},
			decelerationFn: function (k) {
				return M.sqrt(1 - ( --k * k ));		// Circular Out easing
			},*/
			scrollX: true,
			scrollY: true,
			lockDirection: true,
			useTransition: true,
			momentum: true,

			scrollbars: true
		};

		for (i in options) this.options[i] = options[i];

		this.options.useTransition = hasTransition && this.options.useTransition;

		this.x = this.options.startX;
		this.y = this.options.startY;

		if ( this.options.useTransition ) this.scroller.style[transitionTimingFunction] = 'cubic-bezier(0.33,0.66,0.66,1)';
		if ( this.options.scrollbars === true ) {
			// Vertical scrollbar wrapper
			sb = d.createElement('div');
			sb.style.cssText = 'pointer-events:none;position:absolute;z-index:1;width:7px;bottom:2px;top:2px;bottom:2px;right:1px';
			sb.className = 'iSVerticalScrollbar';
			this.wrapper.appendChild(sb);
			this.vScrollbar = new Scrollbar(sb, 'v', this.wrapper);

			// Horizontal scrollbar wrapper
			sb = d.createElement('div');
			sb.style.cssText = 'pointer-events:none;position:absolute;z-index:1;height:7px;left:2px;right:2px;bottom:1px';
			sb.className = 'iSHorizontalScrollbar';
			this.wrapper.appendChild(sb);
			this.hScrollbar = new Scrollbar(sb);
		}

		this.refresh();

		bind(w, eventResize, this);
		bind(this.wrapper, eventStart, this);
		bind(this.scroller, eventTransitionEnd, this);

		if ( !hasTouch ) {
			bind(w, 'DOMMouseScroll', this);
			bind(w, 'mousewheel', this);
		}
	}

	iScroll.prototype = {
		handleEvent: function (e) {
			switch(e.type) {
				case eventStart:
					if ( !hasTouch && e.button !== 0 ) return;
					this.__start(e);
					break;
				case eventMove:
					this.__move(e);
					break;
				case eventEnd:
				case eventCancel:
					this.__end(e);
					break;
				case eventResize:
					this.__resize();
					break;
				case eventTransitionEnd:
					this.__transitionEnd(e);
					break;
				case 'DOMMouseScroll':
				case 'mousewheel':
					this.__wheel(e);
					break;
			}
		},

		refresh: function () {
			this.wrapper.offsetHeight;	// Force refresh 

			this.wrapperWidth	= this.wrapper.clientWidth;
			this.wrapperHeight	= this.wrapper.clientHeight;

			this.scrollerWidth	= this.scroller.offsetWidth;
			this.scrollerHeight	= this.scroller.offsetHeight;

			this.maxScrollX		= this.wrapperWidth - this.scrollerWidth;
			this.maxScrollY		= this.wrapperHeight - this.scrollerHeight;

			this.hasHorScroll	= this.options.scrollX && this.maxScrollX < 0;
			this.hasVerScroll	= this.options.scrollY && this.maxScrollY < 0;

			if ( this.hasHorScroll ) this.hScrollbar.refresh(this.scrollerWidth, this.maxScrollX, this.x);
			if ( this.hasVerScroll ) this.vScrollbar.refresh(this.scrollerHeight, this.maxScrollY, this.y);

			this.resetPosition(0);
			// this.__transitionTime(0);
			// this.__pos(this.x, this.y);
		},

		__resize: function () {
			this.refresh();
		},

		__pos: function (x, y) {
			x = this.hasHorScroll ? x : 0;
			y = this.hasVerScroll ? y : 0;

			this.scroller.style[transform] = 'translate(' + x + 'px,' + y + 'px)' + translateZ;

			this.x = x;
			this.y = y;

			if ( this.hasHorScroll ) this.hScrollbar.pos(this.x);
			if ( this.hasVerScroll ) this.vScrollbar.pos(this.y);
		},

		__transitionEnd: function (e) {
			if ( e.target != this.scroller ) return;

			this.resetPosition(435);
		},

		__start: function (e) {
			var point = hasTouch ? e.touches[0] : e,
				matrix,
				x, y;

			this.moved		= false;
			this.distX		= 0;
			this.distY		= 0;
			this.absDistX	= 0;
			this.absDistY	= 0;
			this.directionX	= 0;
			this.directionY	= 0;

			this.__transitionTime(0);

			if ( this.options.momentum ) {
				// Lame alternative to CSSMatrix
				matrix = w.getComputedStyle(this.scroller, null)[transform].replace(/[^0-9\-.,]/g, '').split(',');
				x = +matrix[4];
				y = +matrix[5];

				if ( x != this.x || y != this.y ) {
					this.__pos(x, y);
				}
			}

			this.startX		= this.x;
			this.startY		= this.y;
			this.pointX		= point.pageX;
			this.pointY		= point.pageY;

			this.startTime	= e.timeStamp || new Date().getTime();

			bind(this.wrapper, eventMove, this);
			bind(this.wrapper, eventCancel, this);
			bind(this.wrapper, eventEnd, this);
		},

		__move: function (e) {
			var point		= hasTouch ? e.touches[0] : e,
				deltaX		= point.pageX - this.pointX,
				deltaY		= point.pageY - this.pointY,
				newX		= this.x + deltaX,
				newY		= this.y + deltaY,
				timestamp	= e.timeStamp || new Date().getTime();

			this.pointX		= point.pageX;
			this.pointY		= point.pageY;

			this.distX		+= deltaX;
			this.distY		+= deltaY;
			this.absDistX	= M.abs(this.distX);
			this.absDistY	= M.abs(this.distY);

			// We need to move at least 10 pixels for the scrolling to initiate
			if ( this.absDistX < 10 && this.absDistY < 10 ) return;

			// If you are scrolling in one direction lock the other
			if ( this.options.scrollX && this.options.scrollY && this.options.lockDirection ) {
				if ( this.absDistX > this.absDistY + 5 ) {
					newY = this.y;
					deltaY = 0;
				} else if ( this.absDistY > this.absDistX + 5 ) {
					newX = this.x;
					deltaX = 0;
				}
			}

			// Slow down if outside of the boundaries
			if ( newX > 0 || newX < this.maxScrollX ) {
				newX = this.x + deltaX / 3;
			}
			if ( newY > 0 || newY < this.maxScrollY ) {
				newY = this.y + deltaY / 3;
			}

			this.moved = true;
			this.directionX = deltaX > 0 ? -1 : deltaX < 0 ? 1 : 0;
			this.directionY = deltaY > 0 ? -1 : deltaY < 0 ? 1 : 0;

			if ( timestamp - this.startTime > 300 ) {
				this.startTime = timestamp;
				this.startX = this.x;
				this.startY = this.y;
			}

			this.__pos(newX, newY);
		},

		__end: function (e) {
			var point = hasTouch ? e.changedTouches[0] : e,
				momentumX,
				momentumY,
				duration = ( e.timeStamp || new Date().getTime() ) - this.startTime,
				newX = 0,
				newY = 0,
				ev;

			unbind(this.wrapper, eventMove, this);
			unbind(this.wrapper, eventCancel, this);
			unbind(this.wrapper, eventEnd, this);

			if ( this.resetPosition(300) ) return;

			if ( duration < 300 && this.options.momentum ) {
				momentumX = this.hasHorScroll ? this.__momentum(this.x, this.startX, duration, this.maxScrollX, this.wrapperWidth) : { destination:0, duration:0 };
				momentumY = this.hasVerScroll ? this.__momentum(this.y, this.startY, duration, this.maxScrollY, this.wrapperHeight) : { destination:0, duration:0 };

				if ( newX != this.x || newY != this.y )
					this.scrollTo(momentumX.destination, momentumY.destination, M.max(momentumX.duration, momentumY.duration));
			}
		},

		__momentum: function (current, start, time, lowerMargin, maxOvershot) {
			var distance = current - start,
				speed = M.abs(distance) / time,
				destination,
				duration,
				deceleration = 0.0009;

			destination = current + ( speed * speed ) / ( 2 * deceleration ) * ( distance < 0 ? -1 : 1 );
			duration = speed / deceleration;
			time = speed / deceleration;

			if ( destination < lowerMargin ) {
				destination = lowerMargin - ( maxOvershot / 2 * ( speed / 10 ) );
				distance = M.abs(destination - current);
				duration = distance / speed;
			} else if ( destination > 0 ) {
				destination = maxOvershot / 2 * ( speed / 10 );
				distance = M.abs(current) + destination;
				duration = distance / speed;
			}

			return { destination: M.round(destination), duration: duration };
		},

		__transitionTime: function (time) {
			time = time || 0;
			this.scroller.style[transitionDuration] = time + 'ms';

			if ( this.hasHorScroll ) this.hScrollbar.transitionTime(time);
			if ( this.hasVerScroll ) this.vScrollbar.transitionTime(time);
		},

		__wheel: function (e) {
			var wheelDeltaX, wheelDeltaY,
				deltaX, deltaY;

			if ( 'wheelDeltaX' in e ) {
				wheelDeltaX = e.wheelDeltaX / 10;
				wheelDeltaY = e.wheelDeltaY / 10;
			} else if( 'wheelDelta' in e ) {
				wheelDeltaX = wheelDeltaY = e.wheelDelta / 10;
			} else if ( 'detail' in e ) {
				wheelDeltaX = wheelDeltaY = -e.detail * 3;
			} else {
				return;
			}
			
			deltaX = this.x + wheelDeltaX;
			deltaY = this.y + wheelDeltaY;

			if ( deltaX > 0 ) deltaX = 0;
			else if ( deltaX < this.maxScrollX ) deltaX = this.maxScrollX;

			if ( deltaY > 0 ) deltaY = 0;
			else if ( deltaY < this.maxScrollY ) deltaY = this.maxScrollY;

			this.scrollTo(deltaX, deltaY, 0);
		},

		resetPosition: function (time) {
			if ( this.x <= 0 && this.x >= this.maxScrollX && this.y <= 0 && this.y >= this.maxScrollY ) return false;

			var x, y;

			time = time || 0;

			if ( this.x > 0 ) {
				x = 0;
			} else if ( this.x < this.maxScrollX ) {
				x = this.maxScrollX;
			}

			if ( this.y > 0 ) {
				y = 0;
			} else if ( this.y < this.maxScrollY ) {
				y = this.maxScrollY;
			}

			this.__transitionTime(time);
			this.__pos(x, y);

			return true;
		},

		scrollTo: function (x, y, time) {
			this.__transitionTime(time);
			this.__pos(x, y);
		}
	};

	function Scrollbar (el) {
		var indicator;

		this.wrapper = typeof el == 'string' ? d.querySelector(el) : el;

		this.direction = this.wrapper.clientWidth > this.wrapper.clientHeight ? 'h' : 'v';

		indicator = d.createElement('div');
		indicator.className = 'iSIndicator';
		indicator.style.cssText = cssVendor + 'box-sizing:border-box;position:absolute;background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.9);' + cssVendor + 'border-radius:3px';
		indicator.style[transform] = translateZ;
		indicator.style[transitionTimingFunction] = 'cubic-bezier(0.33,0.66,0.66,1)';

		if ( this.direction == 'h' ) {
			indicator.style.height = '100%';
		} else {
			indicator.style.width = '100%';
		}

		this.wrapper.appendChild(indicator);
		this.indicator = indicator;
		this.wrapperSize = 0;
		this.indicatorSize = 0;
		this.sizeRatio = 0;
	}

	Scrollbar.prototype = {
		refresh: function (size, maxScroll, position) {
			var property = this.direction == 'h' ? 'width' : 'height';

			this.wrapperSize = this.direction == 'h' ? this.wrapper.clientWidth : this.wrapper.clientHeight;
			this.indicatorSize = M.max(M.round(this.wrapperSize * this.wrapperSize / size), 8);
			this.indicator.style[property] = this.indicatorSize + 'px';
			this.maxPos = this.wrapperSize - this.indicatorSize;
			this.sizeRatio = this.maxPos / maxScroll;
			this.pos(position);
		},

		pos: function (position) {
			position = this.sizeRatio * position;

			if ( position < 0 ) position = 0;
			else if ( position > this.maxPos ) position = this.maxPos;

			this.indicator.style[transform] = 'translate(' + (this.direction == 'h' ? position + 'px,0' : '0,' + position + 'px') + ')' + translateZ;
		},

		transitionTime: function (time) {
			time = time || 0;
			this.indicator.style[transitionDuration] = time + 'ms';
		}
	};

	dummyStyle = null;	// free some mem?

	w.iScroll = iScroll;
})(this, document, Math);