/*
 * jquery.userTimeout.js
 * @version: v0.2.0
 * @author: Luke LeBlanc
 *
 * Copyright (c) 2014 Luke LeBlanc
 *
 * GNU General Public License v3 (http://www.gnu.org/licenses/)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 */

;(function ($, document, window) {
	'use strict';

	$.fn.userTimeout = function (opts) {

		var defaults = {
			logouturl: null,                   // ULR to redirect to, to log user out
			referer: false,					   // URL Referer - false, auto or a passed URL
			refererName: 'refer',			   // Name of the passed referal in the URL
			notify: true,                      // Toggle for notification of session ending
			timer: true,					   // Toggle for enabling the countdown timer
			session: 600000,                   // 10 Minutes in Milliseconds, then notification of logout
			force: 300000,                     // 5 Minutes in Milliseconds, then logout
			ui: 'auto',                        // Model Dialog selector (auto, bootstrap, jqueryui)
			debug: false,					   // Shows alerts
			modalTitle: 'Session Timeout',     // Modal Title
			modalBody: 'You\'re being timed out due to inactivity. Please choose to stay signed in or to logoff. Otherwise, you will logged off automatically.'  // Modal Body
		};

		var options = $.extend(defaults, opts || {});

		var modalUI, timeout, forceLogout, countDownTimer, seconds = Math.floor((options.force / 1000) % 60);

		var init = function() {
			clearTimeout(timeout);

			if (!options.logouturl) {
				if (options.debug === true) {
					window.alert('Please configure the userTimeout plugin!');
				}
				
				return;
			}

			modalUI = uiCheck(options.ui);
			
			if (modalUI === false) {
				return;
			}
			
			resetTime(false);

			$(document).on('click mousemove mousedown keyup scroll keypress', function () {
				resetTime(false);
			});
		};
		
		var uiCheck = function (uiTest) {
			if (uiTest === 'auto') {
				if (typeof $().emulateTransitionEnd === 'function') {
					return uiTest = 'bootstrap';
				} else if (typeof jQuery.ui !== 'undefined') {
					return uiTest = 'jqueryui';
				} else {
					if (options.debug === true) {
						window.alert('Twitter Bootstrap 3 nor jQueryUI was not found! Please load the proper libraries and their themes to utilize this plugin!');
					}
					
					return false;
				}
			} else if (uiTest === 'bootstrap') {
				if (typeof $().emulateTransitionEnd !== 'function') {
					if (options.debug === true) {
						window.alert('Twitter Bootstrap 3 was not found! Please load the proper libraries and their themes to utilize this plugin!');
					}
					
					return false;
				}
			} else if (uiTest === 'jqueryui') {
				if (typeof jQuery.ui === 'undefined') {
					if (options.debug === true) {
						window.alert('jQueryUI was not found! Please load the proper libraries and their themes to utilize this plugin!');
					}
					
					return false;
				}
			} else {
				if (options.debug === true) {
					window.alert('Twitter Bootstrap 3 nor jQueryUI was not found! Please load the proper libraries and their themes to utilize this plugin!');
				}
				
				return false;
			}
			
			return uiTest;
		};

		var modal = function () {
			resetTime(true);

			if (options.timer === false && modalUI === 'bootstrap') {
				$(document).on('click mousemove mousedown keyup scroll keypress', function () {
					resetTime(true);
				});
			} else {
				$(document).off();
			}

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

					$(document).on('click mousemove mousedown keyup scroll keypress', function () {
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

					$(document).on('click mousemove mousedown keyup scroll keypress', function () {
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

		var logout = function () {
			clearTimeout(timeout);
			clearTimeout(forceLogout);
			clearTimeout(countDownTimer);

			if (options.referer !== false) {
				if (options.referer === 'auto') {
					var currentReferral = $(location).attr('href');
					
					window.location = options.logouturl + '?' + encodeURIComponent(options.refererName) + '=' + encodeURIComponent(currentReferral);
				} else {
					window.location = options.logouturl + '?' + encodeURIComponent(options.refererName) + '=' + encodeURIComponent(options.referer);
				}
			} else {
				window.location = options.logouturl;
			}
		};

		return this.each(function () {
			init();
		});
	};

}(jQuery, document, window));