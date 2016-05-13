/*! jQuery userTimeout - v0.3.0 - 2016-05-13
* https://github.com/lleblanc42/jquery-userTimeout
* Copyright (c) 2016 Luke LeBlanc; Licensed GPL-3.0 */
;(function ($, document, window, undefined) {
	'use strict';

	$.fn.userTimeout = function (opts) {

		var defaults = {
			logouturl: null,                   // ULR to redirect to, to log user out
			referer: false,                    // URL Referer - false, auto or a passed URL
			refererName: 'refer',              // Name of the passed referal in the URL
			notify: true,                      // Toggle for notification of session ending
			timer: true,                       // Toggle for enabling the countdown timer
			session: 600000,                   // 10 Minutes in Milliseconds, then notification of logout
			force: 300000,                     // 5 Minutes in Milliseconds, then logout
			ui: 'auto',                        // Model Dialog selector (auto, bootstrap, jqueryui)
			debug: false,                      // Shows alerts
			modalTitle: 'Session Timeout',     // Modal Title
			modalBody: 'You\'re being timed out due to inactivity. Please choose to stay signed in or to logoff. Otherwise, you will logged off automatically.'  // Modal body content
		};

		var options = $.extend(defaults, opts || {});

		var modalUI, timeout, forceLogout, countDownTimer, seconds = Math.floor((options.force / 1000) % 60);

		/**
		 * var init -
		 *
		 * Initializes the plugin. It first does some basic error checking
		 * to ensure the plugin is properly configured, then checks to ensure
		 * one of the two dependencies is available within the page in order
		 * to utilize the modal feature of the plugin. It finishes by enabling
		 * the session timeout and the events to keep the session alive.
		 *
		 * @return {undefined}
		 */
		var init = function() {
			clearTimeout(timeout);

			if (!options.logouturl) {
				if (options.debug === true) {
					window.alert('Please configure the userTimeout plugin!');
				} else {
					window.console.error('Please configure the userTimeout plugin!');
				}
				
				return;
			}

			modalUI = uiCheck(options.ui);
			
			if (modalUI === false) {
				return;
			}
			
			resetTime(false);

			$(document).on('focus click mousemove mousedown keyup scroll keypress', function () {
				resetTime(false);
			});
		};
		
		/**
		 * var uiCheck -
		 *
		 * Checks to see if either bootstrap or jQuery UI is available within the page.
		 * Otherwise, false will be given. Based on what this function returns, will
		 * determine which modal, if any at all, will be used.
		 * 
		 * @param  {string or boolean (false)} uiTest [String or boolean (false) given from the passed options of the plugin]
		 * @return {string or boolean (false)}        [Returns false if unable to determine if bootstrap or jQuery UI is available within the page, otherwise returns which modal to use]
		 */
		var uiCheck = function (uiTest) {
			switch (uiTest) {
				case 'auto':
					if (typeof $().emulateTransitionEnd === 'function') {
						uiTest = 'bootstrap';
					} else if (typeof jQuery.ui !== 'undefined') {
						uiTest = 'jqueryui';
					} else {
						if (options.debug === true) {
							window.alert('Twitter Bootstrap 3 nor jQueryUI was not found! Please load the proper libraries and their themes to utilize this plugin!');
						} else {
							window.console.error('Twitter Bootstrap 3 nor jQueryUI was not found! Please load the proper libraries and their themes to utilize this plugin!');
						}
						
						return false;
					}

					break;
				case 'bootstrap':
					if (typeof $().emulateTransitionEnd !== 'function') {
						if (options.debug === true) {
							window.alert('Twitter Bootstrap 3 was not found! Please load the proper libraries and their themes to utilize this plugin!');
						} else {
							window.console.error('Twitter Bootstrap 3 was not found! Please load the proper libraries and their themes to utilize this plugin!');
						}
						
						return false;
					} else {
						uiTest = 'bootstrap';
					}

					break;
				case 'jqueryui':
					if (typeof jQuery.ui === 'undefined') {
						if (options.debug === true) {
							window.alert('jQueryUI was not found! Please load the proper libraries and their themes to utilize this plugin!');
						} else {
							window.console.error('jQueryUI was not found! Please load the proper libraries and their themes to utilize this plugin!');
						}
						
						return false;
					} else {
						uiTest = 'jqueryui';
					}

					break;
				default:
					if (options.debug === true) {
						window.alert('Twitter Bootstrap 3 nor jQueryUI was not found! Please load the proper libraries and their themes to utilize this plugin!');
					} else {
						window.console.error('Twitter Bootstrap 3 nor jQueryUI was not found! Please load the proper libraries and their themes to utilize this plugin!');
					}
					
					return false;
			}

			return uiTest;
		};

		/**
		 * var modal -
		 *
		 * Creates and displays the modal to the end user based on the configuration
		 * of the plugin. If the modal is bootstrap and the settings for the timer
		 * are set to true, the countdown timer will display.
		 *
		 * @return {undefined}
		 */
		var modal = function () {
			resetTime(true);

			if (modalUI === 'bootstrap') {
				var container, dialog, content, header, body, footer, logoutBtn;

				container = $('<div class="modal fade" id="notifyLogout" tabindex="-1" role="dialog" aria-labelledby="notifyLogoutLabel" aria-hidden="true"></div>');
				dialog = $('<div class="modal-dialog"></div>');
				content = $('<div class="modal-content"></div>');
				header = $('<div class="modal-header"><button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button><h4 class="modal-title" id="notifyLogoutLabel">' + options.modalTitle + '</h4></div>');
				body = $('<div class="modal-body">' + options.modalBody + '</div>');
				
				if (options.timer === true) {
					footer = $('<div class="modal-footer"><button type="button" class="btn btn-primary" data-dismiss="modal">Stay Logged In (<span id="countdowntimer">' + seconds + '</span>)</button></div>');
					countDown(seconds);
				} else {
					footer = $('<div class="modal-footer"><button type="button" class="btn btn-primary" data-dismiss="modal">Stay Logged In</button></div>');
				}
				
				logoutBtn = $('<button type="button" class="btn btn-default" id="logoff">Log Off</button>');

				content.append(header, body, footer);
				footer.prepend(logoutBtn);
				dialog.append(content);
				container.append(dialog);

				$(container).modal({
					backdrop: 'static',
					keyboard: false,
					show: true
				});

				$(container).on('hide.bs.modal', function () {
					resetTime(false);

					$(document).on('focus click mousemove mousedown keyup scroll keypress', function () {
						resetTime(false);
					});

					$(container).remove();
				});

				$(logoutBtn).on('click', function () {
					logout();
				});
			} else if (modalUI === 'jqueryui') {
				var jqueryLogout;
				var jqueryModalOptions = {};
				var jqueryModal = '<div id="notifyLogout"><p>' + options.modalBody + '</p></div>';

				jqueryModalOptions['Stay Logged In'] = function (){
					resetTime(false);

					$(document).on('focus click mousemove mousedown keyup scroll keypress', function () {
						resetTime(false);
					});
					
					jqueryLogout.dialog('close');
				};

				jqueryModalOptions['Log Off'] = function (){
					logout();
				};

				jqueryLogout = $(jqueryModal).dialog({
					buttons: jqueryModalOptions,
					modal: true,
					width: 600,
					height: 300,
					resizable: false,
					title: options.modalTitle
				});
			}
		};
		
		/**
		 * var countDown -
		 *
		 * Creates the count down timer for the bootstrap modal and sets
		 * the timeout.
		 * 
		 * @param  {integar} countTime [Time in seconds for which it counts down]
		 * @return {undefined}
		 */
		var countDown = function (countTime) {
			$('#countdowntimer').html(countTime);
			
			if (countTime !== 0) {
				countDownTimer = setTimeout(function () {
					countTime = countTime - 1;
					
					countDown(countTime);
				}, 1000);
			} else {
				clearTimeout(countDownTimer);
			}
		};

		/**
		 * var resetTime -
		 *
		 * Clears any and all current timeouts and resets them accordingly.
		 * 
		 * @param  {boolean} modaltime [Tells the function whether to set the force timeout for when the session is ending and the modal is visible or to set the regular timeout]
		 * @return {undefined}
		 */
		var resetTime = function (modaltime) {
			clearTimeout(timeout);
			clearTimeout(forceLogout);
			clearTimeout(countDownTimer);

			if (modaltime === true){
				forceLogout = setTimeout(logout, options.force);
			} else {
				if(options.notify === true) {
					timeout = setTimeout(modal, options.session);
				} else {
					timeout = setTimeout(logout, options.session);
				}
			}
		};

		/**
		 * var logout -
		 * 
		 * Called when the session times out and sends the user to the logout
		 * page as set in the options. It first checks if the referer settings
		 * are configured and handles the logout accordingly.
		 *
		 * @return {object} [Returns the new window location (logoff)]
		 */
		var logout = function () {
			var referralURL;

			clearTimeout(timeout);
			clearTimeout(forceLogout);
			clearTimeout(countDownTimer);

			if (options.referer !== false) {
				if (options.referer === 'auto') {
					var currentReferral = $(location).attr('href');
					
					referralURL = options.logouturl + '?' + encodeURIComponent(options.refererName) + '=' + encodeURIComponent(currentReferral);
				} else {
					referralURL = options.logouturl + '?' + encodeURIComponent(options.refererName) + '=' + encodeURIComponent(options.referer);
				}
			} else {
				referralURL = options.logouturl;
			}

			return window.location = referralURL;
		};

		/**
		 * Initializes the plugin.
		 */
		return this.each(function () {
			init();
		});
	};

}(jQuery, document, window));