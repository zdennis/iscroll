/*!
 * iScroll v5.0.0 pre-alpha-use-it-and-kittens-die ~ Copyright (c) 2012 Matteo Spinelli, http://cubiq.org
 * Released under MIT license, http://cubiq.org/license
 */
(function (w, d, M) {
	var dummyStyle = d.createElement('div').style,
		// it seems event.timestamp is not that reliable, so we use the best alternative we can find
		getTime = (function () {
			var perfNow = w.performance &&			// browser may support performance but not performance.now
				(performance.now		||
				performance.webkitNow	||
				performance.mozNow		||
				performance.msNow		||
				performance.oNow);

			return perfNow ?
				perfNow.bind(w.performance) :
				Date.now ?							// Date.now should be faster than getTime
					Date.now :
					function getTime () { return new Date().getTime(); };
		})(),
		// rAF is used if useTransition is false
		rAF = w.requestAnimationFrame		||
			w.webkitRequestAnimationFrame	||
			w.mozRequestAnimationFrame		||
			w.oRequestAnimationFrame		||
			w.msRequestAnimationFrame		||
			function (callback) { w.setTimeout(callback, 1000 / 60); },
		transform = (function () {
			var vendors = ['t', 'webkitT', 'MozT', 'msT', 'OT'],
				transform,
				i = 0,
				l = vendors.length;

			for ( ; i < l; i++ ) {
				transform = vendors[i] + 'ransform';
				if ( transform in dummyStyle ) return transform;
			}

			return false;
		})(),
		vendor = transform !== false && transform.replace(/transform/i, ''),
		cssVendor = vendor ? '-' + vendor + '-' : '',
		transitionTimingFunction = prefixStyle('transitionTimingFunction'),
		transitionDuration = prefixStyle('transitionDuration'),
		transformOrigin = prefixStyle('transformOrigin'),

		has3d = prefixStyle('perspective') in dummyStyle,
		hasPointer = navigator.msPointerEnabled,
		hasTouch = 'ontouchstart' in w,
		hasTransition = prefixStyle('transition') in dummyStyle,
		hasTransform = !!transform,

		translateZ = has3d ? ' translateZ(0)' : '',

		isIOS = (/iphone|ipad/i).test(navigator.appVersion),

		eventStart = hasTouch ? 'touchstart' : hasPointer ? 'MSPointerDown' : 'mousedown',
		eventMove = hasTouch ? 'touchmove' : hasPointer ? 'MSPointerMove' : 'mousemove',
		eventEnd = hasTouch ? 'touchend' : hasPointer ? 'MSPointerUp' : 'mouseup',
		eventCancel = hasTouch ? 'touchcancel' : hasPointer ? 'MSPointerCancel' : 'mousecancel',
		// iOS seems the only one with a reliable orientationchange event, fall to resize for all the others
		eventResize = isIOS && w.onorientationchange ? 'orientationchange' : 'resize',
		// there's no standard way to find the name of the transitionend event, so we select it based on the vendor
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

	function addEvent (el, type, fn, capture) {
		el.addEventListener(type, fn, !!capture);
	}

	function removeEvent (el, type, fn, capture) {
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
		this.enable();

		this.options = {
			startX: 0,
			startY: 0,
			scrollX: true,
			scrollY: true,
			lockDirection: true,
			//bounce: true,				TODO: remove scroller bouncing
			momentum: false,
			//eventPassthrough: false,	TODO: preserve native vertical scroll on horizontal JS scroll (and vice versa)

			HWCompositing: true,		// mostly a debug thing (set to false to skip hardware acceleration)
			useTransition: true,
			useTransform: true,

			scrollbars: true,
			draggableScrollbars: !hasTouch && !hasPointer,
			//hideScrollbars: true,		TODO: hide scrollbars when not scrolling
			//shrinkScrollbars: false,	TODO: shrink scrollbars when dragging over the limits

			mouseWheel: true,
			invertWheelDirection: false,
			//wheelSwitchAxes: false,	TODO: vertical wheel scrolls horizontally
			//wheelAction: 'scroll',	TODO: zoom with mouse wheel

			snap: false,
			snapThreshold: 10,
			snapStepX: 0,
			snapStepY: 0,
			//flickNavigation: true,	TODO: go to next/prev slide on flick

			zoom: false,
			zoomMin: 1,
			zoomMax: 3
			//startZomm: 1,				TODO: the initial zoom level

			//onFlick: null,			TODO: add flick custom event
		};

		for ( i in options ) this.options[i] = options[i];

		// Normalize options
		if ( !this.options.HWCompositing ) translateZ = '';
		this.options.useTransition = hasTransition && this.options.useTransition;
		this.options.useTransform = hasTransform && this.options.useTransform;
		this.options.invertWheelDirection = this.options.invertWheelDirection ? -1 : 1;

		// set some defaults
		if ( hasTransform ) this.scroller.style[transformOrigin] = '0 0';		// we need the origin to 0 0 for the zoom
		this.x = this.options.startX;
		this.y = this.options.startY;
		this.scale = 1;
		this.pageX = 0;		// current page, needed by snap, ignored otherwise
		this.pageY = 0;

		if ( this.options.useTransition ) this.scroller.style[transitionTimingFunction] = 'cubic-bezier(0.33,0.66,0.66,1)';

		if ( this.options.scrollbars === true ) {
			// Vertical scrollbar wrapper
			sb = d.createElement('div');
			sb.style.cssText = 'position:absolute;z-index:1;width:7px;bottom:2px;top:2px;right:1px';
			if ( !this.options.draggableScrollbars ) sb.style.pointerEvents = 'none';
			sb.className = 'iScrollVerticalScrollbar';
			this.wrapper.appendChild(sb);
			this.vScrollbar = new Scrollbar(sb, this);

			// Horizontal scrollbar wrapper
			sb = d.createElement('div');
			sb.style.cssText = 'position:absolute;z-index:1;height:7px;left:2px;right:2px;bottom:0';
			if ( !this.options.draggableScrollbars ) sb.style.pointerEvents = 'none';
			sb.className = 'iScrollHorizontalScrollbar';
			this.wrapper.appendChild(sb);
			this.hScrollbar = new Scrollbar(sb, this);
		}

		this.refresh();

		addEvent(w, eventResize, this);
		addEvent(this.wrapper, eventStart, this);
		addEvent(this.scroller, eventTransitionEnd, this);

		addEvent(w, eventMove, this);
		addEvent(w, eventCancel, this);
		addEvent(w, eventEnd, this);

		if ( this.options.mouseWheel ) {
			addEvent(w, 'DOMMouseScroll', this);
			addEvent(w, 'mousewheel', this);
		}
	}

	iScroll.prototype = {
		handleEvent: function (e) {
			switch ( e.type ) {
				case eventStart:
					if ( !hasTouch && e.button !== 0 ) return;
					this.__start(e);
					break;
				case eventMove:
					if ( this.options.zoom && hasTouch && e.touches[1] ) {
						this.__zoom(e);
					} else {
						this.__move(e);
					}
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

		__animate: function (destX, destY, duration) {
			var that = this,
				startX = this.x,
				startY = this.y,
				startTime = getTime(),
				destTime = startTime + duration;

			function step () {
				var now = getTime(),
					newX,
					newY,
					easing;

				if ( now >= destTime ) {
					this.isRAFing = false;
					that.__pos(destX, destY);
					that.resetPosition(435);
					return;
				}

				now = ( now - startTime ) / duration - 1;
				easing = M.sqrt( 1 - now * now );
				newX = ( destX - startX ) * easing + startX;
				newY = ( destY - startY ) * easing + startY;
				that.__pos(newX, newY);

				if ( that.isRAFing ) rAF(step);
			}

			this.isRAFing = true;
			step();
		},

		__resize: function () {
			this.refresh();
			this.resetPosition(0);
		},

		__pos: function (x, y) {
			//x = this.hasHorizontalScroll ? x : 0;
			//y = this.hasVerticalScroll ? y : 0;

			if ( this.options.useTransform ) {
				this.scroller.style[transform] = 'translate(' + x + 'px,' + y + 'px) scale(' + this.scale + ')' + translateZ;
			} else {
				x = M.round(x);
				y = M.round(y);
				this.scroller.style.left = x + 'px';
				this.scroller.style.top = y + 'px';
			}

			this.x = x;
			this.y = y;

			if ( this.hasHorizontalScroll ) this.hScrollbar.pos(this.x);
			if ( this.hasVerticalScroll ) this.vScrollbar.pos(this.y);
		},

		__transitionEnd: function (e) {
			if ( e.target != this.scroller ) return;

			if ( this.waitReset ) this.waitReset = false;

			this.__transitionTime(0);
			this.resetPosition(435);
		},

		__start: function (e) {
			if ( !this.enabled || this.waitReset ) return;

			var point = hasTouch ? e.touches[0] : e,
				matrix,
				x, y,
				c1, c2;

			this.initiated	= true;
			this.moved		= false;
			this.distX		= 0;
			this.distY		= 0;
			this.directionX	= 0;
			this.directionY	= 0;
			this.directionLocked = 0;

			this.__transitionTime(0);
			
			this.isRAFing = false;		// stop the rAF animation (only with useTransition:false)

			if ( this.options.zoom && hasTouch && e.touches.length > 1 ) {
				c1 = M.abs( point.pageX - e.touches[1].pageX );
				c2 = M.abs( point.pageY - e.touches[1].pageY );
				this.touchesDistanceStart = M.sqrt(c1 * c1 + c2 * c2);
				this.startScale = this.scale;

				this.originX = M.abs(point.pageX + e.touches[1].pageX - 0 * 2) / 2 - this.x;
				this.originY = M.abs(point.pageY + e.touches[1].pageY - 0 * 2) / 2 - this.y;
			}

			if ( this.options.momentum ) {
				matrix = getComputedStyle(this.scroller, null);

				if ( this.options.useTransform ) {
					// Lame alternative to CSSMatrix
					matrix = matrix[transform].replace(/[^-\d.,]/g, '').split(',');
					x = +(matrix[12] || matrix[4]);
					y = +(matrix[13] || matrix[5]);
				} else {
					x = +matrix.left.replace(/[^-\d.]/g, '');
					y = +matrix.top.replace(/[^-\d.]/g, '');
				}

				if ( x != this.x || y != this.y ) this.__pos(x, y);
			}

			this.startX		= this.x;
			this.startY		= this.y;
			this.pointX		= point.pageX;
			this.pointY		= point.pageY;

			// needed by snap to compute snap threashold
			this.absStartX	= this.x;
			this.absStartY	= this.y;

			this.startTime	= getTime();
		},

		__move: function (e) {
			if ( !this.enabled || !this.initiated || this.waitReset ) return;

			var point		= hasTouch ? e.touches[0] : e,
				deltaX		= this.hasHorizontalScroll ? point.pageX - this.pointX : 0,
				deltaY		= this.hasVerticalScroll ? point.pageY - this.pointY : 0,
				newX		= this.x + deltaX,
				newY		= this.y + deltaY,
				timestamp	= getTime(),
				absDistX, absDistY;

			this.pointX		= point.pageX;
			this.pointY		= point.pageY;

			this.distX		+= deltaX;
			this.distY		+= deltaY;
			absDistX		= M.abs(this.distX);
			absDistY		= M.abs(this.distY);

			// We need to move at least 10 pixels for the scrolling to initiate
			if ( absDistX < 10 && absDistY < 10 ) return;

			// If you are scrolling in one direction lock the other
			if ( !this.directionLocked && this.options.lockDirection ) {
				if ( absDistX > absDistY + 5 ) {
					this.directionLocked = 'h';		// lock horizontally
				} else if ( absDistY > absDistX + 5 ) {
					this.directionLocked = 'v';		// lock vertically
				} else {
					this.directionLocked = 'n';		// no lock
				}
			}

			if ( this.directionLocked == 'h' ) {
				newY = this.y;
				deltaY = 0;
			} else if ( this.directionLocked == 'v' ) {
				newX = this.x;
				deltaX = 0;
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

			this.scrollTo(newX, newY, 0);
			//this.__pos(newX, newY);
		},

		__end: function (e) {
			if ( !this.enabled || !this.initiated || this.waitReset ) return;

			var point = hasTouch ? e.changedTouches[0] : e,
				momentumX,
				momentumY,
				duration = getTime() - this.startTime,
				newX = this.x,
				newY = this.y,
				time,
				snap,
				lastScale;

			this.initiated = false;

			// removeEvent(this.wrapper, eventMove, this);
			// removeEvent(this.wrapper, eventCancel, this);
			// removeEvent(this.wrapper, eventEnd, this);

			// Reset if we were zooming
			if ( this.scaled ) {
				if ( this.scale > this.options.zoomMax ) {
					this.scale = this.options.zoomMax;
				} else if ( this.scale < this.options.zoomMin ) {
					this.scale = this.options.zoomMin;
				}

				// Update boundaries
				this.refresh();

				lastScale = this.scale / this.startScale;

				newX = this.originX - this.originX * lastScale + this.startX;
				newY = this.originY - this.originY * lastScale + this.startY;

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

				if ( this.x != newX || this.y != newY ) {
					this.waitReset = true;
					this.scrollTo(newX, newY, 300);
				}

				this.scaled = false;
				return;
			}

			// we scrolled less than 10 pixels
			if ( !this.moved ) return;

			// reset if we are outside of the boundaries
			if ( this.resetPosition(300) ) return;

			// start momentum animation if needed
			if ( this.options.momentum && duration < 300 ) {
				momentumX = this.hasHorizontalScroll ? this.__momentum(this.x, this.startX, duration, this.maxScrollX, this.wrapperWidth) : { destination:0, duration:0 };
				momentumY = this.hasVerticalScroll ? this.__momentum(this.y, this.startY, duration, this.maxScrollY, this.wrapperHeight) : { destination:0, duration:0 };
				newX = momentumX.destination;
				newY = momentumY.destination;
				time = M.max(momentumX.duration, momentumY.duration);
			}

			if ( this.options.snap ) {
				snap = this.__snap(newX, newY);
				newX = snap.x;
				newY = snap.y;
				this.pageX = snap.pageX;
				this.pageY = snap.pageY;
				time = 200;
			}

			if ( newX != this.x || newY != this.y ) this.scrollTo(newX, newY, time);
		},

		__momentum: function (current, start, time, lowerMargin, maxOvershot) {
			var distance = current - start,
				speed = M.abs(distance) / time,
				destination,
				duration,
				deceleration = 0.0009;

			destination = current + ( speed * speed ) / ( 2 * deceleration ) * ( distance < 0 ? -1 : 1 );
			duration = speed / deceleration;

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

			if ( this.hasHorizontalScroll ) this.hScrollbar.transitionTime(time);
			if ( this.hasVerticalScroll ) this.vScrollbar.transitionTime(time);
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

			deltaX = this.x + wheelDeltaX * this.options.invertWheelDirection;
			deltaY = this.y + wheelDeltaY * this.options.invertWheelDirection;

			if ( deltaX > 0 ) deltaX = 0;
			else if ( deltaX < this.maxScrollX ) deltaX = this.maxScrollX;

			if ( deltaY > 0 ) deltaY = 0;
			else if ( deltaY < this.maxScrollY ) deltaY = this.maxScrollY;

			this.scrollTo(deltaX, deltaY, 0);
		},

		__zoom: function (e) {
			if ( !this.enabled || !this.initiated || this.waitReset ) return;

			var c1 = M.abs( e.touches[0].pageX - e.touches[1].pageX ),
				c2 = M.abs( e.touches[0].pageY - e.touches[1].pageY ),
				distance = M.sqrt( c1 * c1 + c2 * c2 ),
				scale = 1 / this.touchesDistanceStart * distance * this.startScale,
				lastScale,
				x, y;

			if ( scale < this.options.zoomMin ) {
				scale = 0.5 * this.options.zoomMin * M.pow(2.0, scale / this.options.zoomMin);
			} else if ( scale > this.options.zoomMax ) {
				scale = 2.0 * this.options.zoomMax * M.pow(0.5, this.options.zoomMax / scale);
			}

			lastScale = scale / this.startScale;
			//x = this.originX - this.originX * lastScale + this.x;
			//y = this.originY - this.originY * lastScale + this.y;
			x = this.originX - this.originX * lastScale + this.startX;
			y = this.originY - this.originY * lastScale + this.startY;

			//this.scroller.style[transform] = 'translate(' + x + 'px,' + y + 'px) scale(' + scale + ')' + translateZ;

			this.scale = scale;
			this.scrollTo(x, y, 0);
			this.scaled = true;
		},

		__snap: function (x, y) {
			var result,
				current = {
					x: this.pages[this.pageX][this.pageY].x,
					y: this.pages[this.pageX][this.pageY].y,
					pageX: this.pageX,
					pageY: this.pageY
				};

			// check if we matched the snap threashold
			if ( M.abs(x - this.absStartX) < this.options.snapThreshold && M.abs(y - this.absStartY) < this.options.snapThreshold )
				return current;

			// find new page position
			result = this.getPage(x, y);

			if ( !result ) return current;

			if ( M.abs(result.pageX - this.pageX) === 0 ) {
				result.pageX += 1 * this.directionX;
				if ( result.pageX < 0 ) result.pageX = 0;
				else if ( result.pageX >= result.pageCountX ) result.pageX = result.pageCountX - 1;
				result.x = this.pages[result.pageX][result.pageY].x;
				if ( result.x < this.maxScrollX ) result.x = this.maxScrollX;
			}
			if ( M.abs(result.pageY - this.pageY) === 0 ) {
				result.pageY += 1 * this.directionY;
				if ( result.pageY < 0 ) result.pageY = 0;
				else if ( result.pageY >= result.pageCountY ) result.pageY = result.pageCountY - 1;
				result.y = this.pages[result.pageX][result.pageY].y;
				if ( result.y < this.maxScrollY ) result.y = this.maxScrollY;
			}

			return result;
		},

		getPage: function (x, y) {
			if ( !this.pages ) return false;

			var i, l,
				m, n,
				newX, newY,
				pageX, pageY;

			x = x === undefined ? this.x : x;
			y = y === undefined ? this.y : y;

			for ( i = 0, l = this.pages.length; i < l; i++ ) {
				for ( m = 0, n = this.pages[i].length; m < n; m++ ) {
					if ( newX === undefined && x > this.pages[i][m].cx ) {
						newX = this.pages[i][m].x;
						pageX = i;
					}
					if ( newY === undefined && y > this.pages[i][m].cy ) {
						newY = this.pages[i][m].y;
						pageY = m;
					}

					if ( newY !== undefined && newX !== undefined ) {
						return {
							x: newX,
							y: newY,
							pageX: pageX,
							pageY: pageY,
							pageCountX: this.pages.length,
							pageCountY: this.pages[0].length
						};
					}
				}
			}

			return false;
		},

		disable: function () {
			this.enabled = false;
		},

		enable: function () {
			this.enabled = true;
		},

		refresh: function () {
			var x, y, cx, cy, i, l, m, n, el;

			this.wrapper.offsetHeight;	// Force refresh (linters hate this)

			this.wrapperWidth	= this.wrapper.clientWidth;
			this.wrapperHeight	= this.wrapper.clientHeight;

			this.scrollerWidth	= M.round(this.scroller.offsetWidth * this.scale);
			this.scrollerHeight	= M.round(this.scroller.offsetHeight * this.scale);

			this.maxScrollX		= this.wrapperWidth - this.scrollerWidth;
			this.maxScrollY		= this.wrapperHeight - this.scrollerHeight;

			this.hasHorizontalScroll	= this.options.scrollX && this.maxScrollX < 0;
			this.hasVerticalScroll		= this.options.scrollY && this.maxScrollY < 0;

			if ( this.options.scrollbars ) {
				this.hScrollbar.refresh(this.scrollerWidth, this.maxScrollX, this.x);
				this.vScrollbar.refresh(this.scrollerHeight, this.maxScrollY, this.y);
			}

			// this utterly complicated setup is needed to also support snapToElement
			if ( this.options.snap === true ) {
				this.options.snapStepX = this.options.snapStepX || this.wrapperWidth;
				this.options.snapStepY = this.options.snapStepY || this.wrapperHeight;
			
				this.pages = [];
				i = 0;
				x = 0;
				cx = M.round(this.options.snapStepX / 2);

				while ( x < this.scrollerWidth ) {
					this.pages[i] = [];
					l = 0;
					y = 0;
					cy = M.round(this.options.snapStepY / 2);

					while ( y < this.scrollerHeight ) {
						this.pages[i][l] = {
							x: -x,
							y: -y,
							cx: -cx,
							cy: -cy
						};

						y += this.options.snapStepY;
						cy += this.options.snapStepY;
						l++;
					}

					x += this.options.snapStepX;
					i++;
				}
			} else if ( typeof this.options.snap == 'string' ) {
				el = this.scroller.querySelectorAll(this.options.snap);
				this.pages = [];
				m = 0;
				n = -1;
				x = y = 0;

				for ( i = 0, l = el.length; i < l; i++ ) {
					if ( el[i].offsetLeft === 0 ) {
						m = 0;
						n++;
					}

					if ( !this.pages[m] ) this.pages[m] = [];

					x = el[i].offsetLeft;
					y = el[i].offsetTop;
					cx = x + M.round(el[i].offsetWidth / 2);
					cy = y + M.round(el[i].offsetHeight / 2);

					this.pages[m][n] = {
						x: -x,
						y: -y,
						cx: -cx,
						cy: -cy
					};

					m++;
				}
			}

			//this.resetPosition(0);
		},

		resetPosition: function (time) {
			if ( this.x <= 0 && this.x >= this.maxScrollX && this.y <= 0 && this.y >= this.maxScrollY ) return false;

			var x = this.x,
				y = this.y;

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

			this.scrollTo(x, y, time);

			return true;
		},

		scrollBy: function (x, y, time) {
			x = this.x + x;
			y = this.y + y;
			time = time || 0;

			this.scrollTo(x, y, time);
		},

		scrollTo: function (x, y, time) {
			if ( !time || this.options.useTransition ) {
				this.__transitionTime(time);
				this.__pos(x, y);
			} else {
				this.__animate(x, y, time);
			}
		},

		scrollToElement: function () {
			// TODO
		}
	};

	function Scrollbar (el, scroller) {
		var indicator;

		this.wrapper = typeof el == 'string' ? d.querySelector(el) : el;
		this.scroller = scroller;

		this.direction = this.wrapper.clientWidth > this.wrapper.clientHeight ? 'h' : 'v';

		if ( this.direction == 'h' ) {
			this.indicatorSizeProperty = 'width';
			this.wrapperSizeProperty = 'height';
			this.page = 'pageX';
		} else {
			this.indicatorSizeProperty = 'height';
			this.wrapperSizeProperty = 'width';
			this.page = 'pageY';
		}

		indicator = d.createElement('div');
		indicator.className = 'iScrollIndicator';
		indicator.style.cssText = cssVendor + 'box-sizing:border-box;box-sizing:border-box;position:absolute;background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.9);border-radius:3px';
		indicator.style[transform] = translateZ;
		indicator.style[transitionTimingFunction] = 'cubic-bezier(0.33,0.66,0.66,1)';
		indicator.style[this.wrapperSizeProperty] = '100%';

		this.wrapper.appendChild(indicator);
		this.indicator = indicator;
		this.wrapperSize = 0;
		this.indicatorSize = 0;
		this.sizeRatio = 0;

		addEvent(indicator, eventStart, this);
		addEvent(this.wrapper, 'mouseover', this);
		addEvent(this.wrapper, 'mouseout', this);
	}

	Scrollbar.prototype = {
		handleEvent: function (e) {
			switch ( e.type ) {
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
				case 'mouseover':
					this.__over();
					break;
				case 'mouseout':
					this.__out();
					break;
			}
		},

		__over: function () {
			this.wrapper.style[transitionDuration] = '0.15s';
			this.wrapper.style[this.wrapperSizeProperty] = '14px';
			this.wrapper.style.backgroundColor = 'rgba(255,255,255,0.4)';
			this.indicator.style[transitionDuration] = '0.15s';
			this.indicator.style.borderRadius = '7px';
		},

		__out: function () {
			if ( this.initiated ) return;

			this.wrapper.style[transitionDuration] = '0.1s';
			this.wrapper.style[this.wrapperSizeProperty] = '7px';
			this.wrapper.style.backgroundColor = 'rgba(255,255,255,0)';
			this.indicator.style[transitionDuration] = '0.1s';
			this.indicator.style.borderRadius = '3px';
		},

		__start: function (e) {
			var point = hasTouch ? e.touches[0] : e,
				matrix,
				x, y;

			e.preventDefault();
			e.stopPropagation();

			this.initiated	= true;
			this.dist		= 0;

			this.transitionTime(0);

			this.lastPoint	= point[this.page];
			this.startTime	= getTime();

			addEvent(w, eventMove, this);
			addEvent(w, eventEnd, this);
		},

		__move: function (e) {
			var point = hasTouch ? e.touches[0] : e,
				delta, newPos,
				timestamp = getTime();

			delta = point[this.page] - this.lastPoint;
			this.lastPoint = point[this.page];

			newPos = this.position + delta;

			this.__pos(newPos);

			// TODO: check if the following is needed
			// e.preventDefault();
			// e.stopPropagation();
		},

		__end: function (e) {
			removeEvent(w, eventMove, this);
			removeEvent(w, eventEnd, this);

			this.initiated = false;

			if ( e.target != this.indicator ) this.__out();

			// TODO: check if the following is needed
			// e.preventDefault();
			// e.stopPropagation();
		},

		refresh: function (size, maxScroll, position) {
			this.transitionTime(0);

			if ( this.direction == 'h' ) {
				this.wrapper.style.right = this.scroller.hasHorizontalScroll && this.scroller.hasVerticalScroll ? '8px' : '2px';
				this.wrapper.style.display = this.scroller.hasHorizontalScroll ? 'block' : 'none';
			} else {
				this.wrapper.style.bottom = this.scroller.hasHorizontalScroll && this.scroller.hasVerticalScroll ? '8px' : '2px';
				this.wrapper.style.display = this.scroller.hasVerticalScroll ? 'block' : 'none';
			}

			this.wrapper.offsetHeight;	// force refresh

			this.wrapperSize = this.direction == 'h' ? this.wrapper.clientWidth : this.wrapper.clientHeight;

			this.indicatorSize = M.max(M.round(this.wrapperSize * this.wrapperSize / size), 8);
			this.indicator.style[this.indicatorSizeProperty] = this.indicatorSize + 'px';

			this.maxPos = this.wrapperSize - this.indicatorSize;
			this.sizeRatio = this.maxPos / maxScroll;
			
			this.pos(position);
		},

		__pos: function (position) {
			if ( position < 0 ) position = 0;
			else if ( position > this.maxPos ) position = this.maxPos;

			this.scroller.scrollTo(0, M.round(position / this.sizeRatio), 0);
		},

		pos: function (position) {
			position = M.round(this.sizeRatio * position);
			this.position = position;

			if ( position < 0 ) position = 0;
			else if ( position > this.maxPos ) position = this.maxPos;

			if ( this.scroller.options.useTransform ) {
				this.indicator.style[transform] = 'translate(' + (this.direction == 'h' ? position + 'px,0' : '0,' + position + 'px') + ')' + translateZ;
			} else {
				this.indicator.style[(this.direction == 'h' ? 'left' : 'top')] = position + 'px';
			}
		},

		transitionTime: function (time) {
			time = time || 0;
			this.indicator.style[transitionDuration] = time + 'ms';
		}
	};

	dummyStyle = null;	// free some mem?

	w.iScroll = iScroll;
})(window, document, Math);