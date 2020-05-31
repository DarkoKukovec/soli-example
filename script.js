BrowserDetect = {};
BrowserDetect.isMobile = function() {
	return (/iphone|ipod|soli sandbox|kindle|android|blackberry|opera mini|opera mobi|skyfire|maemo|windows phone|palm|iemobile|symbian|symbianos|fennec/i.test(navigator.userAgent.toLowerCase()));
};
BrowserDetect.isTablet = function() {
	return (/ipad|sch-i800|playbook|xoom|gt-p1000|gt-p7510|sgh-t849|nexus 7|nexus 10|shw-m180s|a100|dell streak|silk/i.test(navigator.userAgent.toLowerCase()));
};
BrowserDetect.isDesktop = function() {
	return !BrowserDetect.isMobile() && !BrowserDetect.isTablet();
};

MiscUtils = {
  sleep: (ms) => {
      return new Promise(resolve => window.setTimeout(resolve, ms));
  },

  remap: (value, prevMin, prevMax, min, max) => {
  const t = (value - prevMin) / (prevMax - prevMin);
  return min + (max - min) * t;
  },
  
  lerp (start, end, amount) {
    amount = amount > 1 ? 1 : amount;
    amount = amount < 0 ? 0 : amount;

    const val = start + (end - start) * amount;
    return val;
  },
  
  randomRange(start, end) {
    return (Math.random() * (end - start)) + start;
  },

  randomElement(array) {
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
  },

  clamp(num, min, max) {
    return Math.min(Math.max(num, min), max);
  }
};


SOLI = {};
SOLI.DIRECTION = {UP: 7, RIGHT: 1, DOWN: 3, LEFT: 5};

function SoliWrapper() {
	return BrowserDetect.isDesktop() ? new DesktopSoli() : new PixelSoli();
}

function DesktopSoli() {
	const _instance = new PixelSoli();

	let _mouseX = window.innerWidth * 0.5;
	let _mouseY = window.innerHeight * 0.5;

	let _reachInterval = -1;
	let _autoDisableReach = -1;
	
	let _isRDown = false;
	let _hasPresence = false;
	let _hasReach = false;

	_instance.start = function () {
		window.addEventListener('keyup', onKeyUp);
		window.addEventListener('keydown', onKeyDown);
		window.addEventListener('mousemove', onMouseMove);
	};

	_instance.stop = function () {
		window.removeEventListener('keyup', onKeyUp);
		window.removeEventListener('keydown', onKeyDown);
		window.removeEventListener('mousemove', onMouseMove);
	};

	function onMouseMove(event) {
		_mouseX = event.clientX;
		_mouseY = event.clientY;
	}

	function onKeyDown( event ){
		if(event.key === 'r' && !_isRDown ) {
			enableReach();
			_isRDown = true;
		}
	}

	function onKeyUp(event) {
		if(event.key === 'ArrowDown'){
			_instance.onSwipe(SOLI.DIRECTION.DOWN);
		} else if(event.key === 'ArrowUp'){
			_instance.onSwipe(SOLI.DIRECTION.UP);
		} else if(event.key === 'ArrowLeft'){
			_instance.onSwipe(SOLI.DIRECTION.LEFT);
		} else if(event.key === 'ArrowRight'){
			_instance.onSwipe(SOLI.DIRECTION.RIGHT);
		} else if(event.key === ' ') {
			_instance.onTap();
		} else if(event.key === 'r') {
			disableReach();
			_isRDown = false;
		} else if( event.key === 'o') {
			if(_hasPresence) {
				disablePresence();
			} else {
				enablePresence();
			}
		}
	}

	function enablePresence() {
		if(_hasPresence) {
			return;
		}
		_instance.onPresenceEnter();
		_hasPresence = true;
	}

	function disablePresence() {
		if(!_hasPresence) {
			return;
		}
		disableReach();
		_instance.onPresenceExit();
		_hasPresence = false;
	}

	function enableReach() {
		if(_hasReach) {
			return;
		}
		enablePresence();
		dispatchReach();
		_reachInterval = setInterval(dispatchReach, 200);
		_autoDisableReach = setTimeout(disableReach, 4000);
		_hasReach = true;
	}

	function disableReach(){
		if(!_hasReach) {
			return;
		}
		clearInterval(_reachInterval);
		clearTimeout(_autoDisableReach);
		_reachInterval = -1;
		_hasReach = false;
	}

	function dispatchReach() {
		_instance.onReach({
			x: (_mouseX - window.innerWidth * 0.5) / window.innerWidth * 2, 
			y: (_mouseY - window.innerHeight * 0.5) / window.innerHeight * 2, 
			z: 0.4
		});
	}

	return _instance;
}

function PixelSoli() {
	const _instance = {};

	_instance.start = function () {
		window.onSoliEvent = function (event) {
			if (event.type === 'tap') {
				_instance.onTap();
			} else if (event.type === 'swipe') {
				_instance.onSwipe(event.data.direction);
			} else if (event.type === "reach" && event.data.detected) {
				// _instance.onReach(event.data);
				//console.log('x:' + event.data.angle[0]);
				//console.log('y:' + event.data.angle[1]);
				//const reachAzimuth = event.data.angle[0]; //updates the reach azimuth angle
				//const reachElevation = event.data.angle[1]; //updates the reach elevation angle
				//const reachDistance = event.data.distance; //updates the reach distance
				//const position = _instance.sphericalToCartesian(reachAzimuth, reachElevation, reachDistance);

				const position = {
					x: MiscUtils.remap(event.data.angle[0], -70, 70, -1, 1),
					y: MiscUtils.remap(event.data.angle[1], -30, 70, -1, 1),
				}

				position.x = MiscUtils.clamp(position.x, -1, 1);
				position.y = MiscUtils.clamp(position.y, -1, 1);

				_instance.onReach(position);
			} else if (event.type === "presence") {
				const distance = event.data.distance;
				_instance.onPresenceEnter(distance);
			} else {
				// console.log('MISSING IMPLEMENTATION OF EVENT TYPE: ' + event.type);
			}
		}
	};

	_instance.stop = function () {
		window.onSoliEvent = function () {
		};
	};

	_instance.onSwipe = function ( direction ) {
	};
	_instance.onReach = function () {
	};
	_instance.onPresenceEnter = function () {
	};
	_instance.onPresenceExit = function () {
	};
	_instance.onTap = function () {
	};

	//convert spherical coordinates to cartesian coordinates
	_instance.sphericalToCartesian = function (azimuth, elevation, distance) {
		azimuth = azimuth * Math.PI * 2;
		elevation = elevation * Math.PI * 2;
		const x = distance * Math.cos(elevation) * Math.sin(azimuth);
		const y = distance * Math.sin(elevation) * Math.cos(azimuth);
		const z = distance * Math.cos(elevation) * Math.cos(azimuth);
		return {x: x, y: y, z: z};
	};


	return _instance;
}

const body = document.querySelector('body');
const list = document.querySelector('ul');
const presence = document.querySelector('#presence');
const reach = document.querySelector('#reach');
const taps = document.querySelector('#taps');

function log(message) {
  const item = document.createElement('li');
  item.innerText = message;
  list.prepend(item);
}

let count = 0;

log('Starting...');

try {
  const wrapper = SoliWrapper();
  
  log('Wrapper ready');

  wrapper.onSwipe = (direction) => {
    // log(`Direction: ${direction}`);
    // SOLI.DIRECTION = {UP: 7, RIGHT: 1, DOWN: 3, LEFT: 5};
    if (direction === SOLI.DIRECTION.UP) {
      log('U!');
    } else if (direction === SOLI.DIRECTION.RIGHT) {
      log('Right');
    } else if (direction === SOLI.DIRECTION.DOWN) {
      log('Down');
    } else if (direction === SOLI.DIRECTION.LEFT) {
      log('Left');
    }
  }
  wrapper.onReach = (position) => {
    // reach.innerText = `${position.x}x${position.y}`;
    reach.style.left = `${position.x * 100}%`;
    reach.style.top = `${position.y * 100}%`;
  };
  // log(`Reach: ${JSON.stringify(position)}`);
  wrapper.onTap = () => {
    count++;
    taps.innerText = `Taps: ${count}`;
  }
  wrapper.onPresenceEnter = (distance) => {
    presence.style.background = `rgba(255, 0, 0, ${distance})`;
    presence.innerText = `Distance: ${distance}`;
    body.style.fontSize = `${distance * 60}px`;
  }
  wrapper.onPresenceExit = () => {
    presence.style.background = 'rgb(255, 128, 0)';
    presence.innerText = 'Left!';
  }

  wrapper.start();
} catch (e) {
  log(`Error: ${e.message}`)
}

