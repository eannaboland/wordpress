jQuery(document).ready(function($) {
	UpdraftCentral = UpdraftCentral();
});

// Only needed for IE9 support - http://caniuse.com/#feat=console-basic
// Console-polyfill. MIT license.
// https://github.com/paulmillr/console-polyfill
// Make it safe to do console.log() always.
(function(global) {
	'use strict';
	global.console = global.console || {};
	var con = global.console;
	var prop, method;
	var empty = {};
	var dummy = function() {};
	var properties = 'memory'.split(',');
	var methods = ('assert,clear,count,debug,dir,dirxml,error,exception,group,' +
	'groupCollapsed,groupEnd,info,log,markTimeline,profile,profiles,profileEnd,' +
	'show,table,time,timeEnd,timeline,timelineEnd,timeStamp,trace,warn').split(',');
	while (prop = properties.pop()) if (!con[prop]) con[prop] = empty;
	while (method = methods.pop()) if (typeof con[method] !== 'function') con[method] = dummy;
	// Using `this` for web workers & supports Browserify / Webpack.
})(typeof window === 'undefined' ? this : window);

/**
 * This is the callback on the Paginator class
 *
 * @callback paginatorCallback
 * @param {int} current_page
 */
/**
 * Create paginator markup and manages the active page.
 *
 * @constructor
 * @param {Object} location - A jQuery DOM object used for placing the paginator
 * @param {Object} page_info - an object describing the paginator
 * @param {int} page_info.current_page - the current active page on the paginator
 * @param {int} page_info.total_pages - the amount of pages the paginator should show
 * @param {paginatorCallback} page_change - what should be done after there's a page change
 * @returns {void}
 */
function UpdraftCentral_Paginator(location, page_info, page_change){
	var self = this;
	
	var current = page_info.current_page;
	var total = page_info.total_pages;
	var callback = page_change;
	
	/**
	 * Appends the paginator to the DOM and sets the active page
	 *
	 * @returns {void}
	 */
	function init(){
		// Adding condition here to make sure that the paginator navigation
		// will only be visible if the total pages is more than 1.
		if (total > 1) {
			append(location);
			set_active(current);
		}
	}
	init();
	
	/**
	 * Sets the active page
	 *
	 * @param {int} page_number - the page number that is to be active
	 * @returns {void}
	 */
	function set_active(page_number){
		self.element.find('.page').each(function(index, element) {
			
			jQuery(this).removeClass('page_active');
			jQuery(this).attr('aria-selected', false);
			
			if (jQuery(this).data('page') === page_number) {
				jQuery(this).addClass('page_active');
				jQuery(this).attr('aria-selected', true);
			}
		})
		
		self.element.find('.page_prev').removeClass('disabled');
		self.element.find('.page_next').removeClass('disabled');
		if (page_number === 1) {
			self.element.find('.page_prev').addClass('disabled');
		} else if (page_number === total) {
			self.element.find('.page_next').addClass('disabled');
		}
		trigger();
	}
	
	/**
	 * Sets the next page as active
	 *
	 * @returns {void}
	 */
	function next(){
		if (current < total) {
			current++;
			set_active(current);
		}
	}
	
	/**
	 * Sets the previous page as active
	 *
	 * @returns {void}
	 */
	function prev(){
		if (current > 1) {
			current--;
			set_active(current);
		}
	}
	
	/**
	 * Go to a page and set it as active
	 *
	 * @param {int} page_number - the page number that is to be active
	 * @returns {void}
	 */
	function go_to(page_number){
		if (page_number !== current) {
			current = page_number;
			set_active(page_number);
		}
	}
	
	/**
	 * Inserts the paginator markup to the DOM
	 *
	 * @param {string} _location - a selector for where the paginator should be
	 * @returns {void}
	 */
	function append(_location){
		var pages = [];
		for (var i = 1; i <= total; i++) {
			pages.push(i);
		}
		
		self.element = jQuery(UpdraftCentral.template_replace('dashboard-paginator', { pages:pages }));
		self.element.appendTo(_location);
		
		self.element.on('click', 'a', function(e) {
			e.preventDefault();
			
			if (jQuery(this).hasClass('active')) {
				return;
			}
			
			if (jQuery(this).hasClass('page_prev')) {
				prev();
			} else if (jQuery(this).hasClass('page_next')) {
				next();
			} else if (jQuery(this).hasClass('page')) {
				var page_number = jQuery(this).data('page');
				go_to(page_number);
			}
			
		});
	}
	
	/**
	 * Set what should happen on a page change
	 *
	 * @param {paginatorCallback} _callback - a call back that triggers after a page change
	 * @returns {void}
	 */
	this.page_change = function(_callback) {
		callback = _callback;
	}
	/**
	 * Triggers a jquery event on the paginator element and executes the page_change callback
	 *
	 * @fires page_change
	 * @returns {void}
	 */
	function trigger(){
		self.element.trigger("page_change", current);
		if (jQuery.isFunction(callback)) {
			callback(current);
		}
	}
}

var UpdraftCentral = function() {
	
	// This is just used internally to log more things. Set to 0 to turn it off (which won't necessarily prevent all console logging).
	// It's not completely systematic/consistent. Logging has been added in an ad hoc manner during development/testing to help with debugging.
	// This gets passed through from the PHP constant UPDRAFTCENTRAL_DEBUG_LEVEL
	var updraftcentral_debug_level = ('undefined' === typeof udclion || !udclion.hasOwnProperty('debug_level')) ? 0 : udclion.debug_level;
	var listener_poll_interval = (updraftcentral_debug_level > 0) ? 5000 : 10000;
	
	var mobile_width = 670
	
	var $ = jQuery;
	
	var modal_action_callback;
	
	// Use to hold the current site being operated on (e.g. state for modals) (N.B. - you may need to explicitly set this, depending on whether you're using a convenience function that already sets it, or not)
	var $site_row;

	/**
	 * Add sortable feature to div "updraftcentral_dashboard_existingsites"
	 *
	 * Send a final site order as an indexed array of id's in sorted order to manage_site_order in backend.
	 *
	 * returns 'failure message as response'
	 */
	this.site_order = function () {
		$("#updraftcentral_dashboard_existingsites").sortable({
			axis: 'y',

			// handle the start event (end of drag/sort)
			start: function (event, ui) {
			// close menu
			$(".updraft_site_actions").removeClass("open");
		},
			// handle the stop event (end of drag/sort)
			stop: function (event, ui) {
				site_order_array = $(this).sortable("toArray",{attribute: "data-site_id"});
				UpdraftCentral.send_ajax('manage_site_order', {site_order: site_order_array}, null, 'via_mothership_encrypting', null, function(resp, code, error_code) {

					if ('ok' == code) {
						if (resp.hasOwnProperty('message')) {
							// only need to trap fail as success and nochange require no action
							if (resp.message === "fail" ) {
								UpdraftCentral_Library.dialog.alert(udclion.error_saving_site_order);
							}
						}
					} else {
						console.log("Expected site order data not found:");
						console.log(resp);
					}
				});
			}
		});
	}
	this.site_order();

	/**
	 * A Handlebarsjs helper function that is used to compare
	 * two values if they are equal. Please refer to the example below.
	 * Assuming "comment_status" contains the value of "spam".
	 *
	 * @example
	 * // returns "<span>I am spam!</span>", otherwise "<span>I am not a spam!</span>"
	 * {{#ifeq comment_status "spam"}}
	 *		<span>I am spam!</span>
	 * {{else}}
	 * 		<span>I am not a spam!</span>
	 * {{/ifeq}}
	 *
	 * @param {mixed} a The first value to compare
	 * @param {mixed} b The second value to compare
	 * @return {string}
	 */
	Handlebars.registerHelper('ifeq', function (a, b, opts) {
		if (typeof a !== 'string') a = a.toString();
		if (typeof b !== 'string') b = b.toString();
		if (a === b) {
			return opts.fn(this);
		} else {
			return opts.inverse(this);
		}
	});
	
	/**
	 * A Handlebarsjs helper function that is used to compare
	 * two values if they are not equal. Please refer to the example below.
	 * Assuming "user_id" contains the value of "123".
	 *
	 * @example
	 * // returns "<span>Valid user!</span>", otherwise "<span>Invalid user!</span>"
	 * {{#ifneq user_id 0}}
	 *		<span>Valid user!</span>
	 * {{else}}
	 * 		<span>Invalid user!</span>
	 * {{/ifneq}}
	 *
	 * @param {mixed} a The first value to compare
	 * @param {mixed} b The second value to compare
	 * @return {string}
	 */
	Handlebars.registerHelper('ifneq', function (a, b, opts) {
		if (typeof a !== 'string') a = a.toString();
		if (typeof b !== 'string') b = b.toString();
		if (a !== b) {
			return opts.fn(this);
		} else {
			return opts.inverse(this);
		}
	});
	
	/**
	 * A Handlebarsjs helper function that is used to compare two values
	 * if they are equal. Specifically use to render a "selected" or "checked"
	 * attribute to a dropdown option or checkbox element. Please refer to the example below.
	 * Assuming "default_pingback_flag" contains the value of "1".
	 *
	 * @example
	 * // returns 'checked="checked"', otherwise ""
	 * <input name="default_pingback_flag" type="checkbox" value="1" {{ifset default_pingback_flag 1 'checked'}}>
	 *
	 * @param {mixed} a The first value to compare
	 * @param {mixed} b The second value to compare
	 * @param {string} attr The attribute to render
	 * @return {string}
	 */
	Handlebars.registerHelper('ifset', function (a, b, attr) {
		if (typeof a !== 'string') a = a.toString();
		if (typeof b !== 'string') b = b.toString();
		if (a === b) {
			return new Handlebars.SafeString(attr + '="' + attr + '"');
		} else {
			return '';
		}
	});

	/**
	 * A Handlebarsjs helper function that is used to check if a certain
	 * value is empty, if so then add the specified attribute(s).
	 *
	 * @example
	 * // returns the attached attribute(s) 'disabled="disabled" data-unavailable="1"', otherwise ""
	 * <input type="checkbox" name="uc_updates_check_item" value="1" {{ifempty update.plugin 'disabled'}}>
	 *
	 * @param {mixed} a The value to check
	 * @param {string} attrs The attribute(s) to render
	 * @return {string}
	 */
	Handlebars.registerHelper('ifempty', function (a, attrs) {
		if ('undefined' === typeof a || !a || !a.length) {
			return new Handlebars.SafeString(attrs);
		} else {
			return '';
		}
	});

	/**
	 * Set the current site row
	 *
	 * N.B. - primarily used for mass updates, needed by the automatic backup process but
	 *		  can always be used for whatever purpose it may serve.
	 *
	 * @param {Object} $site_row - A jQuery object representing the site row of the currently
	 *						  	   process site.
	 * @returns {void}
	 */
	this.set_current_site_row = function($site_row) {
		UpdraftCentral.$site_row = $site_row;
	}

	/**
	 * Registers an event handler for a particular event
	 *
	 * N.B. - Ensures that we don't register the same event handler twice
	 *		  by unbinding the same event attached to the selector/element.
	 *
	 * @param {string} event - A string representation of the event to bind (e.g. 'click', 'change', etc.).
	 * @param {string} selector - Any valid jQuery selector where you want to bound the event.
	 * @param {function} callback - A callback function to trigger when the event is raised on the given selector/element.
	 * @returns {void}
	 */
	this.register_event_handler = function(event, selector, callback) {
		jQuery(document).off(event, selector).on(event, selector, callback);
	}
	
	/**
	 * Sets an area to a loading style
	 *
	 * @param {Object} $container - the jQuery object of the area to be set as loading
	 * @returns {void}
	 */
	this.set_loading = function ($container) {
		$container.css('opacity', '0.3');
		$container.find('button').attr('disabled', true);
		$container.find('input[type="button"]').attr('disabled', true);
	}

	/**
	 * Removes the loading style from an area
	 *
	 * @param {Object} $container - the jQuery object of the area to be set as loading
	 * @param {string} html - a string of html to place into the finished loaded area
	 * @returns {Object} a jQuery promsise with The response from the server
	 */
	this.done_loading = function ($container, html) {
		var deferred = jQuery.Deferred();
		$container.css('opacity', '1.0');
		if (html) {
			$container.slideUp(500, function () {
				$container.html(html);
				deferred.resolve();
			}).slideDown(500);
		} else {
			$container.find('button').attr('disabled', false);
			$container.find('input[type="button"]').attr('disabled', false);
			deferred.resolve();
		}
		return deferred.promise();
	}
	

	/**
	 * Set the debugging level
	 *
	 * @param {number} debug_level - debugging level, controlling how much console output there will be. The higher the value, the more output. Generally only 0 (minimal), 1 (some), 2 (very much) and 3 (even more) are useful levels
	 * @returns {void}
	 */
	this.set_debug_level = function(debug_level) {
		updraftcentral_debug_level = debug_level;
	}
	
	/**
	 * Get the current debugging level
	 *
	 * @returns {number} - the debugging level (@see set_debug_level)
	 */
	this.get_debug_level = function() {
		return updraftcentral_debug_level;
	}

	/**
	 * Triggers the callback function for the modal's close event
	 *
	 * @param {callback|null} callback - a callback function to be called when the close button (either the "Close" or "X" button) is clicked
	 * @returns {void}
	 */
	this.initiate_modal_close_listener = function(callback) {
		// Listener for modal close and x buttons.
		$('.modal-dialog button[data-dismiss="modal"]').on('click', function() {
			callback.apply(null, []);

			// We'll make sure that after the callback is called we must invalidate
			// the listener since this is only applicable when the close_callback is
			// set or defined under the UpdraftCentral.open_modal.
			$('.modal-dialog button[data-dismiss="modal"]').off('click');
		});
	}
	
	/**
	 * Open a modal window with the specified contents. Modals are separate to dialogues - that is, you can have both open at once without them interfering.
	 *
	 * @param {string} title - the title to use for the modal window
	 * @param {string} body - the HTML contents to place in the modal window
	 * @param {callback|true} action_button_callback - a callback to call when the main action button is pressed; or just true to close the modal
	 * @param {string|false} [action_button_text="Go"] - text for the action button; or, if false, an indication that there should be no action button
	 * @param {callback|null} [pre_open_callback=null] - an optional callback to call immediately before opening the modal
	 * @param {boolean} [sanitize_body=true] - whether or not to call the sanitize_html() method the passed body, or not, before placing it in the modal
	 * @param {string} [extra_classes=''] - extra CSS classes for the modal dialog (e.g. modal-lg)
	 * @param {callback|null} close_callback - an optional callback to be called when the modal is closed
	 * @returns {void}
	 */
	this.open_modal = function(title, body, action_button_callback, action_button_text, pre_open_callback, sanitize_body, extra_classes, close_callback) {
		action_button_text = typeof action_button_text !== 'undefined' ? action_button_text : udclion.go;
		// By default, we assume that the input is potentially evil, and sanitize it
		sanitize_body = typeof sanitize_body !== 'undefined' ? sanitize_body : true;
		extra_classes = typeof extra_classes !== 'undefined' ? extra_classes : '';
		
		// Reset the modal's CSS classes
		$('#updraftcentral_modal_dialog .modal-dialog').removeClass().addClass('modal-dialog '+extra_classes);
		
		$('#updraftcentral_modal_dialog .modal-title').html(title);
		if (sanitize_body) body = UpdraftCentral_Library.sanitize_html(body);
		$('#updraftcentral_modal_dialog .modal-body').html(body);
		if (false === action_button_text) {
			$('#updraftcentral_modal_dialog button.updraft_modal_button_goahead').hide();
		} else {
			$('#updraftcentral_modal_dialog button.updraft_modal_button_goahead').html(action_button_text).show();
		}
		modal_action_callback = action_button_callback;
		if (typeof pre_open_callback !== 'undefined' && null !== pre_open_callback) pre_open_callback.call(this);
		
		// Add listener and callback handler for the modal's close buttons
		if ('function' === typeof close_callback && close_callback) {
			UpdraftCentral.initiate_modal_close_listener(close_callback);
		}

		$('#updraftcentral_modal_dialog').modal();
	}
	
	/**
	 * Given a site row, send back a suitable HTML site description
	 *
	 * @param {Object} $site_row - the jQuery object for the row of the site
	 *
	 * @returns {string} - an HTML string describing the site
	 */
	this.get_site_heading = function($site_row) {
	
		var site_description = $site_row.data('site_description');
		var site_url = $site_row.data('site_url');
		if (site_description == site_url) { site_description = ''; }
		
		var site_heading;
		if (site_description) {
			site_heading = '<a href="'+site_url+'">'+site_description+'</a>';
		} else {
			site_heading = '<a href="'+site_url+'">'+site_url+'</a>';
		}
		
		return site_heading;
	}
	
	/**
	 * Close the modal dialog
	 *
	 * @returns {void}
	 */
	this.close_modal = function() {
		$('#updraftcentral_modal_dialog').modal('hide');
	}
	
	/**
	 * A jQuery callback for row click events
	 *
	 * @callable rowclickerCallback
	 * @param {string} $site_row - the jQuery row object for the site that the click was for
	 * @param {Number} site_id - the site ID for the site that the click was for
	 * @param {Object} event - the event received from jQuery
	 *
	 * @return {*} prevent_default - if anything other than (boolean)true, then event.preventDefault() is called
	 */
	
	/**
	 * De-register all row-clickers. The normal use of this is when switching tabs.
	 *
	 * @returns {void}
	 */
	function deregister_row_clickers() {
		$('#updraftcentral_dashboard_existingsites_container').off();
	}
	
	/**
	 * De-register all events on the modal. The normal use of this is when switching tabs.
	 *
	 * @returns {void}
	 */
	function deregister_modal_listeners() {
		$('#updraftcentral_modal').off();
	}
	
	/**
	 * Register click events for specified items in the UpdraftCentral site list (prevents repeating lots of jQuery boilerplate).
	 * Note that all row clickers are always deregistered upon a mode change (i.e. tab change). So, the correct place to call this function is when updraftcentral_dashboard_mode_set_(your mode) is triggered (or updraftcentral_dashboard_mode_set for all tabs).
	 *
	 * @param {string} selector - the selector to use
	 * @param {rowclickerCallback} callback - callback function that will be called upon the click event
	 * @param {boolean} [hide_other_sites=false] - if set, then the click will cause other sites in the tab to be hidden
	 * @param {string} [on_event='click'] - the event type to listen for. In the special case of 'keypress', the default event will not be prevented
	 * @returns {void}
	 */
	this.register_row_clicker = function(selector, callback, hide_other_sites, on_event) {
		on_event = typeof on_event !== 'undefined' ? on_event : 'click';
		hide_other_sites = typeof hide_other_sites !== 'undefined' ? hide_other_sites : false;
		params = {};
		$('#updraftcentral_dashboard_existingsites_container').on(on_event, '.updraftcentral_site_row '+selector, params, function(event) {
			if (on_event != 'keypress') { event.preventDefault(); }
			UpdraftCentral.$site_row = $(this).closest('.updraftcentral_site_row');
			var site_id = UpdraftCentral.$site_row.data('site_id');
			if (hide_other_sites) {
				$('#updraftcentral_dashboard_existingsites .updraftcentral_site_row:not([data-site_id="'+site_id+'"]), #updraftcentral_dashboard_existingsites .updraftcentral_row_divider').slideUp();
				$('.updraftcentral_mode_actions .updraftcentral_action_choose_another_site').show();
			}
			callback.call(this, UpdraftCentral.$site_row, site_id, event);
		});
	}
	var register_row_clicker = this.register_row_clicker;
	
	/**
	 * Register click events for specified items in the UpdraftCentral modal (prevents repeating lots of jQuery boilerplate).
	 * Note that all modal clickers are always deregistered upon a mode change (i.e. tab change). So, the correct place to call this function is when updraftcentral_dashboard_mode_set_(your mode) is triggered (or updraftcentral_dashboard_mode_set for all tabs).
	 *
	 * @param {string} selector - the selector to use
	 * @param {rowclickerCallback} callback - callback function that will be called upon the click event
	 * @param {string} [on_event='click'] - the event type to listen for. In the special case of 'keypress', the default event will not be prevented
	 * @returns {void}
	 */
	this.register_modal_listener = function(selector, callback, on_event) {
		on_event = typeof on_event !== 'undefined' ? on_event : 'click';
		params = {};
		$('#updraftcentral_modal').on(on_event, selector, params, function(event) {
			callback.call(this, event);
		});
	}
	
	$('#updraftcentral_modal_dialog button.updraft_modal_button_goahead').click(function() {
		if (true === modal_action_callback) {
			this.close_modal();
		} else {
			modal_action_callback.call(this);
		}
	});
	
	/**
	 * JQuery callback for row click events
	 *
	 * @callable listenerCallback
	 *
	 * @param {Object} $listener_row - the jQuery object of the listener itself
	 * @param {Object} $site_row - the jQuery row object for the site that the click was for
	 * @param {Number} site_id - the site ID for the site that this is a listener for
	 * @param {*} [data] - the returned data from the polling operation (if it is that sort of listener)
	 * @returns {*} - if 0 is returned, then the listener will be closed. If 1 is returned, then no more polling will be done, but the listener will not be closed. If an object with a property 'call' is returned, then this will be called. Otherwise, nothing will be done.
	 */
	
	var listener_processors = {};
	/**
	 * Register a listener callback - a callback function to be used in association with dashboard notices which poll and update
	 *
	 * @see create_dashboard_listener
	 *
	 * @param {string} listener_type - an identifying string, indicating the listener type
	 * @param {listenerCallback} callback - a listener callback function
	 * @returns {void}
	 */
	this.register_listener_processor = function(listener_type, callback) {
		listener_processors[listener_type] = callback;
	}
	
	/**
	 * Poll all listener rows on the dashboard for activity
	 *
	 * @returns {void}
	 */
	function poll_listeners() {
		
		// var listener_calls = {};
		
		$('#updraftcentral_notice_container .updraftcentral_listener').each(function(ind) {
			var site_id = $(this).data('site_id');
			var listener_type = $(this).data('type');
			var $listener_row = this;
			var $site_row = $('#updraftcentral_dashboard_existingsites .updraftcentral_site_row[data-site_id="'+site_id+'"');
			var finished = $(this).data('finished');

			if (finished) { return; }
			
			if (updraftcentral_debug_level > 1) {
				console.log("poll_listeners(): site_id="+site_id+", listener_type="+listener_type);
			}
			
			if ($site_row.length > 0 && listener_processors.hasOwnProperty(listener_type)) {
// if (typeof listener_calls[site_id] === 'undefined') listener_calls[site_id] = [];
				var call_this = listener_processors[listener_type].call(this, $listener_row, $site_row, site_id);
				// We could multiplex all the calls to the same site. That would involve plenty of work, but would be worth if for the efficiency - if it weren't the case that HTTP/2 takes care of this.
				if (0 === call_this) {
					$(this).data('finished', true);
					$('#updraftcentral_dashboard_existingsites').trigger('updraftcentral_listener_finished_'+listener_type, {
						site_id: site_id,
						site_row: $site_row,
						listener_row: $listener_row,
						listener_type: listener_type
					});
					$($listener_row).clearQueue().delay(10000).slideUp('slow', function() { $(this).remove(); });
				} else if (1 === call_this) {
					$(this).data('finished', true);
					$('#updraftcentral_dashboard_existingsites').trigger('updraftcentral_listener_finished_'+listener_type, {
						site_id: site_id,
						site_row: $site_row,
						listener_row: $listener_row,
						listener_type: listener_type
					});
				} else if (null != call_this && call_this.hasOwnProperty('call')) {
					var call_type = call_this.call;
					UpdraftCentral.send_site_rpc(call_this.call, call_this.data, $site_row, function(response, code, error_code) {
						if ('ok' == code && false !== response && response.hasOwnProperty('data')) {
							if (listener_processors.hasOwnProperty(call_type)) {
								listener_processors[call_type].call(this, $listener_row, $site_row, site_id, response.data);
							} else {
								console.log("UpdraftCentral: listener type "+call_type+" has no registered processor (dump of all registered processors follows)");
								console.log(listener_processors);
							}
						}
					});
				}
			} else if ($site_row.length > 0) {
				console.log("UpdraftCentral: listener type "+listener_type+" has no registered processor (dump of all registered processors follows)");
				console.log(listener_processors);
			} else {
				console.log("UpdraftCentral: listener for site_id="+site_id+" with type "+listener_type+": site row not found");
			}
		});
		
	}
	
	setInterval(function() { poll_listeners(); }, listener_poll_interval);
	
	// A separate ud_rpc object for each site
	var ud_rpcs = [];
	
	/**
	 * Given a site (identified by its row), get the URL to send HTTP requests to. This is abstracted for convenience and maintainability if there need to be future changes.
	 *
	 * @param {Object} $site_row - the jQuery object for the site row
	 *
	 * @returns {string} - the URL
	 */
	this.get_contact_url = function($site_row) {
		// Used to be site_url; we changed to using the admin_url because when checking updates (e.g.), some sites are only registering their hooks on the back-end. Since UC is typically providing wp-admin-like functions, it makes sense to go for the back-end.
		var admin_url = $site_row.data('admin_url').replace(/\/+$/, '');
		return admin_url+'/admin-ajax.php';
	}
	
	/**
	 * Given a site (identified by its row), get a UpdraftPlus_Remote_Communications (remote communications) object for remote communications. This function does the heavy lifting of getting all the connection configuration for the site, and then passing it along to get_udrpc()
	 *
	 * @param {Object} $site_row - the jQuery object for the site row
	 * @param {string} [connection_method_config="direct"] - either 'direct_default_auth'|'direct_jquery_auth'|'direct_manual_auth' (which means to send directly to the destination) or 'via_mothership' which also sends via the PHP-back-end, but does the RSA encryption in the browser. This is not necessarily the same value as inferred from $site_row - we provide it as an extra parameter to make it possible to over-ride - e.g. for diagnostics, or where the browser mixed-content model restricts the choices.
	 *
	 * @returns {Object} - the UpdraftPlus_Remote_Communications object
	 *
	 * @uses get_udrpc
	 */
	function get_site_udrpc($site_row, connection_method_config) {
		
		var site_remote_public_key = $site_row.data('site_remote_public_key');
		var site_local_private_key = $site_row.data('site_local_private_key');
		var site_url = this.get_contact_url($site_row);
		var site_id = $site_row.data('site_id');
		var key_name_indicator = $site_row.data('key_name_indicator');
		var remote_user_id = $site_row.data('remote_user_id');
		
		if ('undefined' === typeof connection_method_config || ('direct_manual_auth' != connection_method_config && 'via_mothership' != connection_method_config && 'via_mothership_encrypting' != connection_method_config && 'direct_jquery_auth' != connection_method_config)) { connection_method_config = 'direct_default_auth'; }
		
		// The connection method ought not to be via_mothership - such sites shouldn't be being routed into here (but via_mothership_encrypting is allowed)
		if ('via_mothership_encrypting' == connection_method_config) {
			console.warn("UpdraftCentral: A site ("+site_id+", "+site_url+") routed via_mothership_encrypting was passed into get_site_udrpc");
			console.log($site_row);
		}
		
		var message_wrapper = false;
		
		if ('direct_default_auth' == connection_method_config) {
			// Normally, of course, feature detection should be used. But, it really is the case that we need to do browser-detection here, as they're working differently.
			var is_firefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
			// N.B. If they're set to use Digest authentication, this should not use manual - should switch back
// connection_method = (is_firefox) ? 'direct_manual_auth' : 'direct_jquery_auth';
			// Actually, 'jQuery method' also works in Firefox
			connection_method = 'direct_jquery_auth';
		} else {
			connection_method = connection_method_config;
			
			// We're relying here on the fact that UDRPC object store includes the connection method in its unique ID - i.e. that this can be set on the UDRPC object, without any bad consequences.
			
			if ('via_mothership' == connection_method) {
				
				message_wrapper = {
					action: 'updraftcentral_dashboard_ajax',
					subaction: 'site_rpc',
					component: 'dashboard',
					nonce: udclion.updraftcentral_dashboard_nonce,
					site_id: site_id,
					site_rpc_preencrypted: 1
				};
				
			}
			
		}
		
		var send_cors_headers = $site_row.data('send_cors_headers');
		if ('undefined' === typeof send_cors_headers) { send_cors_headers = 1; }
		
		var auth_method = ('direct_manual_auth' == connection_method) ? 'manual' : 'jquery';
		
		var http_credentials = {};
		
		var comms_url = site_url;
		
		// When routing via the mothership, don't put in credentials, as the mothership will do that
		if ('via_mothership_encrypting' != connection_method && 'via_mothership' != connection_method) {
			var http_username = $site_row.data('http_username');
			if ('undefined' !== typeof http_username && http_username) {
				http_credentials.username = http_username;
				var http_password = $site_row.data('http_password');
				if ('undefined' !== typeof http_password) {
					http_credentials.password = http_password;
				}
			}
		} else {
			comms_url = udclion.ajaxurl;
		}
		
		if (updraftcentral_debug_level > 0) {
			console.log("UDRPC communications method: site_id="+site_id+", name_indicator="+key_name_indicator+", site_url="+site_url+", comms_url="+comms_url+", remote_user_id="+remote_user_id+", connection_method="+connection_method_config+"/"+connection_method+", send_cors_headers="+send_cors_headers);
			if (updraftcentral_debug_level > 1) {
				console.log("Remote public key follows");
				console.log(site_remote_public_key);
			}
		}
		
		var reuse_id = site_id+' '+connection_method;
		
		return get_udrpc(reuse_id, remote_user_id, key_name_indicator, site_remote_public_key, site_local_private_key, comms_url, send_cors_headers, http_credentials, auth_method, message_wrapper);
		
	}
	
	/**
	 * Given the relevant site information, get a UpdraftPlus_Remote_Communications (remote communications) object for remote communications, and also sets the current debugging level upon it.
	 *
	 * @param {number} reuse_id - A unique ID, that can be used for re-using of the result
	 * @param {number} remote_user_id - The ID of the user on the remote WP site that the keys are for
	 * @param {string} key_name_indicator - The key name indicator (which indicates to the remote site which key to use to decrypt the message)
	 * @param {string} site_remote_public_key - The RSA public key for contacting the remote site, in PEM format
	 * @param {string} site_local_private_key - The RSA private key for the local site, in PEM format
	 * @param {string} site_url - The URL for the remote site
	 * @param {boolean} [cors_headers_wanted=true] - Whether to request that the remote application sets CORS headers with its reply
	 * @param {Object} [http_credentials={}] - an object with any HTTP credentials to be set (useful properties: username, password)
	 * @param {string} [auth_method] - the authentication method to use ('jquery' or 'manual')
	 * @param {Object|boolean} [message_wrapper=false] - a wrapper to enclose the message in; or false for none. This is passed on to the UDRPC library, which is where the actual wrapping is done.
	 *
	 * @returns {Object} - the UpdraftPlus_Remote_Communications object
	 */
	function get_udrpc(reuse_id, remote_user_id, key_name_indicator, site_remote_public_key, site_local_private_key, site_url, cors_headers_wanted, http_credentials, auth_method, message_wrapper) {
		if (typeof ud_rpcs[reuse_id] != 'undefined') {
			ud_rpc = ud_rpcs[reuse_id];
		} else {
			cors_headers_wanted = (typeof cors_headers_wanted === 'undefined') ? true : cors_headers_wanted;
			var ud_rpc = new UpdraftPlus_Remote_Communications(key_name_indicator);
			ud_rpc.set_key_local(site_local_private_key);
			ud_rpc.set_key_remote(site_remote_public_key);
			ud_rpc.activate_replay_protection();
			
			var url_match = /\/admin-ajax.php$/;
			if (url_match.test(site_url)) {
				// wp-admin/admin-ajax.php before WP 3.5 will die() if $_REQUEST['action'] is not set (3.2) or is empty (3.4). Later WP versions also check that, but after (instead of before) wp-load.php, which is where we are ultimately hooked in.
				site_url = site_url + '?action=updraft_central';
			}
			
			ud_rpc.set_destination_url(site_url);
			if ('undefined' != typeof http_credentials) { ud_rpc.set_http_credentials(http_credentials); }
			if ('undefined' != typeof auth_method) { ud_rpc.set_auth_method(auth_method); }
			if ('undefined' != typeof message_wrapper && false !== message_wrapper) {
				ud_rpc.set_message_wrapper(message_wrapper);
				ud_rpc.set_message_unwrapper(function(response) {
					var processed = process_direct_ajax_response(response, 2, false);
					if (true === processed) {
						if (response.hasOwnProperty('wrapped_response')) {
							return response.wrapped_response;
						} else {
							processed = 'wrapped_response_not_found';
						}
					}
					console.error("UDRPC: Attempt to unwrap the message failed (code: "+processed+")");
					// This is usually redundant - something further down the line will log it
					if (updraftcentral_debug_level > 1) {
						console.log(response);
					}
					return false;
				});
			}
			ud_rpc.set_cors_headers_wanted(cors_headers_wanted);
			ud_rpcs[reuse_id] = ud_rpc;
		}
		if (updraftcentral_debug_level > 0) {
			// UDRPC, at debug level 2, console.log()s lots of cryptographic internals which are only really needed when debugging that
			var ud_rpc_debug_level = (updraftcentral_debug_level > 2) ? 2 : 1;
			ud_rpc.set_debug_level(ud_rpc_debug_level);
		}
		return ud_rpc;
	}
	
	/**
	 * An ajaxCallback
	 *
	 * @callable ajaxCallback
	 * @param {*} response - the response data for the result of the call
	 * @param {String} [code] - the response code; can be 'error' in the case of an error
	 * @param {String} [error_code] - in the case of code being 'error', this contains the error code
	 */
	
	/**
	 * This function is for processing responses received via send_ajax. Since that function has two separate methods for routing the request, the common response code is abstracted out.
	 *
	 * @param {ajaxCallback} response - callback that will be called with the results of the AJAX call
	 * @param {string} [code] - the response code; can be 'error' in the case of an error
	 * @param {string} [error_code] - in the case of code being 'error', this contains the error code
	 * @param {boolean|number} is_site_rpc - whether it was command to a remote site or not. If set to '2', then this indicates that it is site_rpc, and that the encryption was definitely done in the browser (so, we can ignore/drop certain unencrypted responses)
	 * @param {ajaxCallback} response_callback - callback that will be called with the results of the AJAX call
	 * @param {boolean} [allow_visual_responses=true] - whether or not it is permissible to display UI elements in response to the results (set this to false if the caller wants to handle it internally only)
	 * @param {Object} $site_row - the jQuery object for the row of the site that the request is being sent to
	 * @returns {void}
	 */
	function process_ajax_response(response, code, error_code, is_site_rpc, response_callback, allow_visual_responses, $site_row) {
		
		var website = ('undefined' !== typeof $site_row && $site_row && $site_row.length) ? $site_row.data('site_description')+' - ' : '';

		allow_visual_responses = ('undefined' === typeof allow_visual_responses) ? true : allow_visual_responses;
		
		// Bring errors up from the RPC layer. "ok" as the main code just means that a result came back successfully; but that result might itself be an error. That is someting to handle here, not in the lower-level communications library.
		
		if ('error' == code) {
			console.error("process_ajax_response: return code: "+code+", error_code: "+error_code+" - parsed response follows");
			console.log(response);
		} else if (updraftcentral_debug_level > 0) {
			console.log("process_ajax_response: return code: "+code+" - parsed response follows");
			console.log(response);
		}
		
		if (is_site_rpc && 'ok' == code && response.hasOwnProperty('response') && 'rpcerror' == response.response) {
			code = 'error';
			error_code = 'rpc_unknown_error';
			
			if (response.hasOwnProperty('data') && response.data.hasOwnProperty('code')) {
				error_code = response.data.code;
				console.error("UpdraftCentral: RPC: Error occurred ("+error_code+"); data follows");
				console.log(response.data);
				response = response.data.data;
				
				var handled = response_callback.call(this, response, code, error_code);
				
				if (true !== handled) {
					// A default message for if we don't recognise the code
					var dash_message = udclion.js_exception_occurred+' ('+error_code+')';
					// Get the error's own message, if we know about it
					if (udclion.rpcerrors.hasOwnProperty(error_code)) { dash_message = udclion.rpcerrors[error_code]; }
					
					if (allow_visual_responses) { UpdraftCentral_Library.dialog.alert('<h2>'+website+udclion.communications_error+'</h2>'+dash_message); }
				}
				
				return;
			}
		}
		
		if (code == 'error') {
			
			var msg = udclion.general_js_comms_failure;
			// This variable doesn't have to be 100% correct - it's use is that a link to a relevant article is shown if it is true
			var is_comms_failure = true;
			var title = udclion.error;
			
			// If the response didn't unwrap, it may be an error response.
			if (2 == is_site_rpc && 'unwrapper_failure' == error_code && response.hasOwnProperty('code')) { error_code = response.code; }
						
			if ('json_parse_fail' == error_code) {
				if (response.indexOf('<html') > -1) {
					console.error("UpdraftCentral: JSON parse fail: looks like html was returned - remote plugin is probably not installed/inactive/blocked");
					msg = udclion.general_js_comms_failure;
					title = udclion.communications_error;
				}
			} else if ('response_empty' == error_code || 'http_post_fail' == error_code) {
				msg = udclion.general_js_comms_failure;
				title = udclion.communications_error;
			} else if ('timeout' == error_code) {
				msg = udclion.comms_failure_timeout;
				title = udclion.communications_error+' - '+udclion.timeout;
			} else if ('unauthorized' == error_code) {
				msg = udclion.comms_failure_unauthorised;
				title = udclion.communications_error;
			} else if ('unknown_response' == error_code) {
				msg = udclion.unknown_response;
				title = udclion.communications_error;
			} else if ('cannot_contact_localdev' == error_code) {
				title = udclion.communications_error;
				msg = response.message;
				if (response.hasOwnProperty('request_info') && response.request_info.hasOwnProperty('method') && response.request_info.hasOwnProperty('use_method') && response.request_info.method != response.request_info.use_method) {
					msg += '<br>'+udclion.localdev_can_work_better_with_https;
				}
			} else if ('unexpected_http_code' == error_code && is_site_rpc && response.hasOwnProperty('data') && response.data !== null && response.data.hasOwnProperty('headers') && response.data.headers.hasOwnProperty('www-authenticate') && response.data.headers['www-authenticate'].search(/Digest/i) == 0) {
				msg = response.message;
				msg += "<br>"+udclion.digest_auth_not_supported;
			} else if ('unexpected_http_code' == error_code && is_site_rpc && response.hasOwnProperty('data') && null !== response.data && response.data.hasOwnProperty('response') && response.data.response.hasOwnProperty('code') && 401 == response.data.response.code) {
				msg = udclion.comms_failure_unauthorised+' <a href="#" class="updraftcentral_site_editdescription">'+udclion.open_site_configuration+'...</a>';
			} else if (response.hasOwnProperty('message')) {
				msg = response.message;
				if (!is_site_rpc) { is_comms_failure = false; }
			} else {
				is_comms_failure = false;
				msg += '<br>'+udclion.error_code+': '+error_code;
			}
			
			// ns_error_dom_bad_uri: access to restricted uri denied - Firefox
			if (response.hasOwnProperty('status') && 401 == response.status) {
				msg = udclion.comms_failure_unauthorised+' <a href="#" class="updraftcentral_site_editdescription">'+udclion.open_site_configuration+'...</a>';
			} else if ('ns_error_dom_bad_uri: access to restricted uri denied' == error_code) {
				msg = udclion.comms_failure_unauthorised_by_browser+' <a href="#" class="updraftcentral_site_editdescription">'+udclion.open_site_configuration+'...</a>';
			}
			
			msg = '<p>'+msg+'</p>';
			
			if (is_comms_failure) {
				msg += '<p><a href="'+udclion.common_urls.connection_checklist+'">'+udclion.go_here_for_connection_help+'</a></p>';
				msg += '<p><a href="#" class="updraftcentral_test_other_connection_methods">'+udclion.test_other_connection_methods+'</a></p>';
			}
			
			if (response.hasOwnProperty('status') && 200 != response.status && 0 != response.status) {
				msg += '<p>'+udclion.http_response_status+': '+response.status+'</p>';
			}
			
			if (allow_visual_responses) { UpdraftCentral_Library.dialog.alert('<h2>'+website+title+'</h2>'+msg); }
		}
		
		if (is_site_rpc && response.hasOwnProperty('data') && null != response.data) {
			if (response.data.hasOwnProperty('php_events')) {
				$.each(response.data.php_events, function(index, logline) {
					console.log("UpdraftCentral: PHP event on remote side: "+logline);
				});
			}
			if (response.data.hasOwnProperty('caught_output')) {
				console.log("UpdraftCentral: direct output on remote side: "+response.data.caught_output);
			}
			if (response.data.hasOwnProperty('php_events') || response.data.hasOwnProperty('caught_output')) {
				response.data = response.data.previous_data;
			}
		}
		
		response_callback.call(this, response, code, error_code);
	}
	
	/**
	 * Process responses received back from the mothership over AJAX. This will do some processing, and then call process_ajax_response()
	 *
	 * @param {string} response - the response received
	 * @param {boolean} is_site_rpc - whether it was command to a remote site or not.
	 * @param {ajaxCallback|boolean} response_callback - callback that will be called with the results of the AJAX call - or, to not call, false
	 * @param {boolean} [allow_visual_responses=true] - whether or not it is permissible to display UI elements in response to the results (set this to false if the caller wants to handle it internally only). This is just passed on to process_ajax_response
	 * @param {Object} $site_row - the jQuery object for the row of the site that the request is being sent to
	 *
	 * @returns {boolean|string} - If the parsing did not turn up any errors, true is return; otherwise, an error code.
	 */
	function process_direct_ajax_response(response, is_site_rpc, response_callback, allow_visual_responses, $site_row) {
		
		allow_visual_responses = ('undefined' === typeof allow_visual_responses) ? true : allow_visual_responses;
		
		// AJAX via the mothership comes with its results wrapped
		
		if (response.hasOwnProperty('responsetype') && 'error' == response.responsetype) {
			if (response.hasOwnProperty('message')) { console.error("UpdraftCentral error via AJAX: "+response.message); }
			if ('cannot_contact_localdev' == response.code) { response.request_info = { method: method, use_method: use_method} }
			if (false !== response_callback) {
				process_ajax_response(response, 'error', response.code, is_site_rpc, response_callback, allow_visual_responses, $site_row);
			}
			return response.code;
		}
		
		if (!response.hasOwnProperty('message') && !response.hasOwnProperty('code')) {
			console.log(response);
			if (false !== response_callback) {
				process_ajax_response(response, 'error', 'unknown_response', is_site_rpc, response_callback, allow_visual_responses, $site_row);
			}
			return 'unknown_response';
		}
		
		if (updraftcentral_debug_level > 1) {
			console.log(response.responsetype+': '+response.message);
		}
		
		// When doing site RPC, the remote site's reply is in the 'data' attribute
		if (is_site_rpc) {
			
			if (response.hasOwnProperty('php_events')) {
				$.each(response.php_events, function(index, logline) {
					console.info("UpdraftCentral: PHP event on remote side: "+logline);
				});
			}
			
			if (response.hasOwnProperty('mothership_caught_output')) {
				console.info("UpdraftCentral: direct output on remote side: "+response.caught_output);
			}
			
			// This is set for a successful communication
			if (response.hasOwnProperty('rpc_response')) {
				response = response.rpc_response;
			}
		}
		
		if (false !== response_callback) {
			process_ajax_response(response, 'ok', null, is_site_rpc, response_callback, allow_visual_responses, $site_row);
		}
		
		return true;
	}
	
	/**
	 * Sends a remote command via AJAX - either directly, or via the site that this plugin is installed upon.
	 *
	 * @param {String} command - the command to send
	 * @param {*} data - data to send with the remote request
	 * @param {Object|null} $site_row - the jQuery object for the site that the command is for; or, for commands not associated with a site, null
	 * @param {String} [connection_method="direct_default_auth"] - either 'direct_default_auth' (which means to send directly to the destination) or 'via_mothership_encrypting' (which means to send via our PHP-back-end, which then sends the request), or 'via_mothership' which also sends via the PHP-back-end, but does the RSA encryption in the browser. This is not necessarily the same value as inferred from $site_row - we provide it as an extra parameter to make it possible to over-ride - e.g. for diagnostics, or where the browser mixed-content model restricts the choices.
	 * @param {Object|String|null} [spinner_where=null] - jQuery object or CSS identifier indicating where, if anywhere, to add a spinner whilst the call is ongoing
	 * @param {ajaxCallback} response_callback - callback that will be called with the results of the AJAX call
	 * @param {Number} [timeout=30] - the number of seconds to allow before the call times out
	 * @param {Boolean} [allow_visual_responses=true] - whether or not it is permissible to display UI elements in response to the results (set this to false if the caller wants to handle it internally only). This is just passed on to process_ajax_response
	 *
	 * @uses process_ajax_response
	 */
	
	 this.send_ajax = function(command, data, $site_row, connection_method, spinner_where, response_callback, timeout, allow_visual_responses) {
		
		var website = ('undefined' !== typeof $site_row && $site_row && $site_row.length) ? $site_row.data('site_description')+' - ' : '';

		connection_method = typeof connection_method !== 'undefined' ? connection_method : 'direct_default_auth';
		timeout = typeof timeout !== 'undefined' ? timeout : 30;
		spinner_where = typeof spinner_where !== 'undefined' ? spinner_where : null;
		allow_visual_responses = ('undefined' === typeof allow_visual_responses) ? true : allow_visual_responses;
		
		// Boil it down to one of 'direct', 'server', 'server_proxies' (i.e. factor out the sub-methods)
		var ajax_method = ('via_mothership' == connection_method || 'via_mothership_encrypting' == connection_method) ? ('via_mothership' == connection_method ? 'server_proxies' : 'server') : 'direct';
		
		var is_site_rpc = (null === $site_row) ? false : true;
		
		if (is_site_rpc) {
			var unlicensed = $site_row.data('site_unlicensed');
			if ('undefined' !== typeof unlicensed && unlicensed) {
				UpdraftCentral_Library.dialog.alert('<h2>'+website+udclion.error+'</h2>'+udclion.site_unlicensed_message);
				return;
			}
		}
		
		if (spinner_where) {
			// $(spinner_where).addClass('updraftcentral_spinner');
			$(spinner_where).prepend('<div class="updraftcentral_spinner"></div>');
		}
		
		if ('direct' == ajax_method && 'https:'== document.location.protocol) {
			var site_url = this.get_contact_url($site_row);
			if (site_url.substring(0, 5).toLowerCase() == 'http:') {
				// Mixed content policy in all mainstream desktop browsers forbids requests to HTTP from HTTPS domains
				ajax_method = 'server';
			}
		}
		
		if (updraftcentral_debug_level > 0) {
			console.log("send_message(ajax_method="+ajax_method+", requested_method="+connection_method+", command="+command+", data(follows))");
			console.log(data);
		}
		
		if ('direct' == ajax_method || 'server_proxies' == ajax_method) {
			
			if (!is_site_rpc) { throw 'send_ajax() called with direct method ('+connection_method+'), but no site row object passed in'; }
			
			var ud_rpc = get_site_udrpc($site_row, connection_method);
			ud_rpc.send_message(command, data, timeout, function(response, code, error_code) {
				
				if (spinner_where) {
					$(spinner_where).removeClass('updraftcentral_spinner');
					$(spinner_where).children('.updraftcentral_spinner').remove();
				}
				
				if (updraftcentral_debug_level > 2) {
					console.log("Raw response, pre-processing, follows");
					console.log(response);
				}
				
				var is_site_rpc_flag = ('server_proxies' == ajax_method) ? 2 : 1;
				
				try {
					process_ajax_response(response, code, error_code, is_site_rpc_flag, response_callback, allow_visual_responses, $site_row);
				} catch (e) {
					UpdraftCentral_Library.dialog.alert('<h2>'+website+udclion.error+'</h2>'+udclion.js_exception_occurred+'<br>'+e.toString());
					console.log(e);
				}
			});
				
				
		} else {
			// 'server' == ajax_method
			
			var site_id = 0;
			if (null !== $site_row) {
				site_id = $site_row.data('site_id');
			}
			
			var ajax_subaction = (is_site_rpc) ? 'site_rpc' : command;
			
			var ajax_data = (is_site_rpc) ? { command: command, data: data } : data;
			
			var ajax_options = {
				type: 'POST',
				url: udclion.ajaxurl,
				timeout: (timeout * 1000), // In ms
				headers: {
					'X-Secondary-User-Agent': 'UpdraftCentral-dashboard.js/'+udclion.udc_version
				},
				data: {
					action: 'updraftcentral_dashboard_ajax',
					subaction: ajax_subaction,
					component: 'dashboard',
					nonce: udclion.updraftcentral_dashboard_nonce,
					site_id: site_id,
					data: ajax_data
				},
				dataType: 'text',
				success: function(response) {
					
					if (spinner_where) {
						$(spinner_where).children('.updraftcentral_spinner').remove();
						// $(spinner_where).removeClass('updraftcentral_spinner');
					}
					
					if ('undefined' === typeof response || '' === response) {
						console.log("UDRPC: the response from the remote site was empty");
						process_ajax_response(response, 'error', 'response_empty', is_site_rpc, response_callback, allow_visual_responses, $site_row);
						return;
					}
					
					try {
						var parsed_response = JSON.parse(response);
					} catch (e) {
						
						var valid_json = response.match(/\{"format":.*}/);

						if (null === valid_json) {
							console.log(e);
							console.log(response);
							process_ajax_response(response, 'error', 'json_parse_fail', is_site_rpc, response_callback, allow_visual_responses, $site_row);
							return;
						} else {
							response = valid_json[0];
							try {
								var parsed_response = JSON.parse(response);
								console.log("UpdraftCentral: successfully parsed JSON after removing unwanted elements");
								console.log(response);
							} catch (e) {
								console.log(e);
								console.log(response);
								process_ajax_response(response, 'error', 'json_parse_fail', is_site_rpc, response_callback, allow_visual_responses, $site_row);
								return;
							}
						}
						
					}
					
					response = parsed_response;
					
					process_direct_ajax_response(response, is_site_rpc, response_callback, allow_visual_responses, $site_row);
					
				},
				error: function(request, status, error_thrown) {
					
					if (spinner_where) {
						$(spinner_where).children('.updraftcentral_spinner').remove();
						// $(spinner_where).removeClass('updraftcentral_spinner');
					}
					
					console.error("UpdraftCentral: Error in AJAX operation");
					console.log(request);
					console.log(status);
					// https://api.jquery.com/jquery.ajax/ says: 'When an HTTP error occurs, (this parameter) receives the textual portion of the HTTP status, such as "Not Found" or "Internal Server Error."'
					// "Unauthorized" is what you get when HTTP authentication is required. "Timeout" when there's a timeout.
					console.error(error_thrown);
					
					if ('' == error_thrown) { error_thrown = 'http_post_fail'; }
					
					if (error_thrown.hasOwnProperty('statusText')) {
						error_thrown = error_thrown.statusText.toString();
					}
					
					if ('function' === typeof error_thrown.toLowerCase) {
						error_thrown = error_thrown.toLowerCase();
					} else {
						try {
							var tmp = error_thrown.toString().toLowerCase();
							if (tmp) { error_thrown = tmp; }
						} catch (e) {
						}
					}
					
					process_ajax_response(request, 'error', error_thrown, is_site_rpc, response_callback, allow_visual_responses, $site_row);
				}
			}
			
			if (updraftcentral_debug_level > 1) {
				console.log("UpdraftCentral: jQuery POST: options follow:");
				console.log(ajax_options);
			}
			
			jQuery.ajax(ajax_options);
			
		}
		
	}

	/**
	 * Set up menu navigation for each site row item. This should be called after any actions that replace the HTML of row items
	 *
	 * @returns {void}
	 */
	function setup_menunav() {
		// This is no longer needed.
		// $('#updraftcentral_dashboard .updraft-dropdown-menu').dropit();
		var how_many_sites = $('#updraftcentral_dashboard_existingsites .updraftcentral_site_row:not(.updraft_site_unlicensed)').length;
		$('#updraftcentral_licences_in_use').html(how_many_sites);
	}

	// Toggle the mobile menu on/off, if at a relevant width
	$('#updraftcentral_dashboard .updraft-mobile-menu').on('click', function() {
		var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
		// Currently only using the width.
		// var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
		if (w <= mobile_width) {
			$('#updraftcentral_dashboard #updraft-central-navigation-sidebar').show();
			$('#updraftcentral_dashboard .updraft-menu-item-links').slideToggle();
		}
	});
	
	/**
	 * Set the section of the dashboard that displays the existing sites to the specified value. All code that wants to update this section should route through here, so that any other associated operations can be carried out.
	 *
	 * @param {string} html - the HTML to place within the site list container in the dashboard
	 * @returns {void}
	 */
	 this.set_existing_sites_to = function(html) {
		// Reset the connection objects, as the IDs and credentials/options may have changed
		ud_rpcs = [];
		$('#updraftcentral_dashboard_existingsites').html(html);
		// Show/hide the relevant buttons/sections for the current tab
		UpdraftCentral.set_dashboard_mode(true, true);
		setup_menunav();
	}
	
	/*
	 * Used to show or hide the mobile menu on click. Will also toggle when a menu item has been clicked.
	 * Only want this to occur at when the mobile menu is visible to stop the toggle at higher viewports
	 */
	// Toggle the mobile menu on/off, if at a relevant width
	$('#updraftcentral_dashboard .updraft-menu-item-links').on('click', function(event) { /* .updraft-mobile-menu, */
		event.stopPropagation();
		var width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;

		if (width < mobile_width) {
			$('#updraftcentral_dashboard .updraft-menu-item-links').slideToggle();
		}
	});
	
	/**
	 * Adds a dashboard notice only if a notice doesnt exist with the same identifier
	 *
	 * @param {string} message - The message text to display
	 * @param {string} [level="notice"] - The level for the notice. Can also start with 'listener_', which is styled as if it were 'info'
	 * @param {Number|bool} [remove_after=30000] - The number of milliseconds to remove the notice after; or, 0|false to not remove
	 * @param {Object} [extra_data={}] - Extra data to store with the dashboard notice (via data attributes)
	 * @param {string} identifier - a string passed to give an id to the notice this stops other notices with the same id being displayed at the same time
	 *
	 * @returns {Object|false} the jQuery object for the newly created notice or false if a notice with this identifier already exists
	 */
	this.add_dashboard_notice_singleton = function(message, level, remove_after, extra_data, identifier) {
		level = ('undefined' === typeof level) ? 'notice' : level;
		remove_after = ('undefined' === typeof remove_after) ? 30000 : remove_after;
		extra_data = ('undefined' === typeof extradata) ? {} :  extradata;
		identifier = ('undefined' === typeof identifier) ? '' :  identifier;
		extra_data.identifier = identifier;
		
		if (0 === $('#updraftcentral_notice_container .updraftcentral_notice[data-identifier="'+identifier+'"]').length) {
			return this.add_dashboard_notice(message, level, remove_after, extra_data);
		}
		return false;
	}
	
	/**
	 * Adds a dashboard notice
	 *
	 * @param {string} message - The message text to display
	 * @param {string} [level="notice"] - The level for the notice. Can also start with 'listener_', which is styled as if it were 'info' (but can be over-ridden, as it gets its own classes too)
	 * @param {Number|bool} [remove_after=30000] - The number of milliseconds to remove the notice after; or, 0|false to not remove
	 * @param {Object} [extra_data={}] - Extra data to store with the dashboard notice (via data attributes)
	 *
	 * @returns {Object} the jQuery object for the newly created notice
	 */
	this.add_dashboard_notice = function(message, level, remove_after, extra_data) {
		remove_after = typeof remove_after !== 'undefined' ? remove_after : 30000;
		extra_data = typeof extra_data !== 'undefined' ? extra_data : { };
		level = typeof level !== 'undefined' ? level : 'notice';
		var type = 'notice';
		var extra_classes = '';
		
		if ('listener_' == level.substr(0, 9)) {
			type = 'listener';
			extra_classes = 'updraftcentral_listener updraftcentral_listener_'+level.substr(9);
			extra_data.type = level.substr(9);
			level = 'info';
		}
		
		$container = $('#updraftcentral_notice_container');
		
		var newnotice_container_opener = '<div class="updraftcentral_notice updraftcentral_notice_new updraftcentral_notice_level_'+level+' '+extra_classes+'"';
		$.each(extra_data, function(key, val) {
			newnotice_container_opener += 'data-'+key+'="'+UpdraftCentral_Library.quote_attribute(val)+'"';
		});
		
		var $newnotice = $(newnotice_container_opener+'><button type="button" class="updraftcentral_notice_dismiss"></button><div class="updraftcentral_notice_contents">'+message+'</div></div>');
		$container.append($newnotice);
		if (remove_after) {
			$newnotice.slideDown('medium').delay(30000).slideUp('slow', function() {
				$(this).remove();
			});
		} else {
			$newnotice.slideDown('medium');
		}
		
		return $newnotice;
	}
	
	/**
	 * Creates a special type of dashboard notice which polls for status updates
	 *
	 * @see register_listener_processor
	 *
	 * @param {string} type - Listener type (an identifying string) (not shown; stored and used for CSS classes)
	 * @param {Object} $site_row - a jQuery object identifying the site row that the listener is associated with
	 * @param {string} message - HTML to be placed in the dashboard notice
	 * @param {*} [data={}] - Data associated with the listener (which will be stored in an HTML data attribute)
	 * @param {string} [title] - HTML to be used as the notice title. If not specified, a default will be used.
	 * @returns {Object} the jQuery object for the newly created notice
	 */
	this.create_dashboard_listener = function(type, $site_row, message, data, title) {
		data = ('undefined' === typeof data) ? {} : data;
		data.site_url = $site_row.data('site_url');
		data.site_id = $site_row.data('site_id');
		var listener_title = (typeof title === 'undefined') ? '<h2>'+$site_row.data('site_description')+'</h2>' : title;
		return this.add_dashboard_notice(listener_title+message, 'listener_'+type, false, data);
	}
	
	// Only trigger a removal if the close button is directly in the notice. This allows other sub-elements to re-use the style class.
	$('#updraftcentral_notice_container').on('click', '.updraftcentral_notice > .updraftcentral_notice_dismiss', function() {
		$(this).parents('.updraftcentral_notice').clearQueue().slideUp('slow', function() { $(this).remove(); });
	});
	
	/**
	 * Get the current dashboard mode
	 *
	 * @returns {string} - the current dashboard mode
	 */
	this.get_dashboard_mode = function() {
		return $('#updraftcentral_dashboard').data('updraftcentral_mode');
	}
	
	/**
	 * Set up the dashboard, by hiding things that don't belong in the currently active tab
	 *
	 * @param {string|boolean} new_mode=true - the mode to switch to. These correspond to keys for items placed in the main menu via the updraftcentral_main_navigation_items filter. If set to true, then it will choose the current mode (only useful if setting force to true).
	 * @param {boolean} [force=false] - run the commands to set up the mode, even if it appears to be the current mode (useful for resetting the state within the mode)
	 * @returns {void}
	 */
	this.set_dashboard_mode = function (new_mode, force) {
		
		force = ('undefined' === typeof force) ? false : true;
		
		var current_mode = this.get_dashboard_mode();

		if (true === new_mode) { new_mode = current_mode; }
		
		if (!force && new_mode == current_mode) { return; }
		
		if (current_mode) { $('#updraftcentral_dashboard').removeClass('updraftcentral_mode_'+current_mode); }

		$('#updraftcentral_dashboard_existingsites_container .updraftcentral_row_extracontents').empty();
		
		// Show all sites again
		$('#updraftcentral_dashboard_existingsites .updraftcentral_site_row, #updraftcentral_dashboard_existingsites .updraftcentral_row_divider').show();
		
		$('#updraftcentral_dashboard').data('updraftcentral_mode', new_mode);
		$('#updraftcentral_dashboard').addClass('updraftcentral_mode_'+new_mode);
		$('#updraft-menu-item-'+current_mode).removeClass('updraft-menu-item-links-active');
		$('#updraft-menu-item-'+new_mode).addClass('updraft-menu-item-links-active');
		
		// Since there exist classes for both "show everywhere except <here>" and "hide everywhere except here", you could, of course, add CSS classes that result in contradictory instructions. The outcome of doing so is not defined.
		$('#updraftcentral_dashboard .updraftcentral-hide-in-other-tabs:not(.updraftcentral-show-in-tab-'+new_mode+'), #updraftcentral_dashboard .updraftcentral-hide-in-tab-'+new_mode).hide();
		$('#updraftcentral_dashboard .updraftcentral-show-in-tab-'+new_mode+' .updraftcentral-hide-in-tab-initially').hide();
		$('#updraftcentral_dashboard .updraftcentral-show-in-tab-'+new_mode+', #updraftcentral_dashboard .updraftcentral-show-in-other-tabs:not(.updraftcentral-hide-in-tab-'+new_mode+')').slideDown(1);

		deregister_row_clickers();
		deregister_modal_listeners();
		
		$('#updraftcentral_dashboard_existingsites').trigger('updraftcentral_dashboard_mode_set', { new_mode: new_mode, previous_mode: current_mode });
		$('#updraftcentral_dashboard_existingsites').trigger('updraftcentral_dashboard_mode_set_'+new_mode, { new_mode: new_mode, previous_mode: current_mode });
		
	}
	
	$('.updraftcentral_mode_actions .updraftcentral_action_choose_another_site').click(function() {
		UpdraftCentral.set_dashboard_mode(true, true);
	});
	
	$('#updraft-central-navigation-sidebar .updraft-menu-item').click(function() {
		var item_dom_id = $(this).attr('id');
		if ('undefined' === typeof item_dom_id) { return; }
		if ('updraft-menu-item-' != item_dom_id.substring(0, 18)) {
			console.log("UDCentral: menu item without the ID in the expected format");
			console.log(this);
			return;
		}
		
		var new_mode = item_dom_id.substring(18);
		UpdraftCentral.set_dashboard_mode(new_mode);
			
	});

	$("#updraft-central-sidebar-button").click(function() {
		$("#updraft-central-navigation-sidebar").animate({
			width: "toggle"
		});
		$(".updraft-central-sidebar-button-icon").toggle();
	});
	
	$('#updraftcentral_dashboard .updraftcentral_action_box .updraftcentral_action_manage_sites').click(function() {
		UpdraftCentral.set_dashboard_mode('sites');
	});
	
	
	
	/**
	 * Do any processing necessary with the passed information about current status
	 *
	 * @param {Object} status_info - any recognised properties will be processed
	 * @returns {void}
	 */
	function process_sites_status_info(status_info) {
		if (status_info.hasOwnProperty('how_many_licences_in_use')) {
			$('.updraftcentral_licences_in_use').html(status_info.how_many_licences_in_use);
		}
		if (status_info.hasOwnProperty('how_many_licences_available')) {
			var display = (status_info.how_many_licences_available < 0) ? '&#8734;' : status_info.how_many_licences_available;
			$('.updraftcentral_licences_total').html(display);
		}
	}
	
	/**
	 * Handle any links to updraftplus.com/updraftcentral.com in a new window
	 *
	 * @param {string} href - The URL
	 * @param {Object} [e] - a jQuery event to cancel if opening a new window
	 */
	function redirect_updraft_website_links(href, e) {
		if ('undefined' === typeof href) { return; }
		if (null !== href.match(/https?:\/\/updraft(plus|central)\.com/)) {
			if ('undefined' !== typeof e) { e.preventDefault(); }
			var win = window.open(href, '_blank');
			UpdraftCentral_Library.focus_window_or_error(win);
		}
	}
	
	$('#updraftcentral_dashboard_newsite').click(function() {
		
		var advanced_site_options_html = UpdraftCentral.get_advanced_site_options_html({ http_username: '', http_password: ''});
		
		UpdraftCentral.open_modal(udclion.add_site, UpdraftCentral.template_replace('sites-add-new-modal', { advanced_options: advanced_site_options_html }), function() {
			
			var key = $('#updraftcentral_addsite_key').val();
			UpdraftCentral.close_modal();
			
			if ('undefined' === typeof key || key === null || key === '') { return; }

			var extra_site_info = UpdraftCentral_Library.get_serialized_options('#updraftcentral_modal #updraftcentral_editsite_expertoptions .expert_option');
			var send_cors_headers = $('#updraftcentral_modal #updraftcentral_site_send_cors_headers').is(':checked') ? 1 : 0;
			var connection_method = $('#updraftcentral_modal #updraftcentral_site_connection_method').val();
			
			UpdraftCentral.send_ajax('newsite', { key: key, extra_site_info: extra_site_info, send_cors_headers: send_cors_headers, connection_method: connection_method }, null, 'via_mothership_encrypting', '#updraftcentral_dashboard_existingsites', function(resp, code, error_code) {
				
				if ('ok' == code) {
					
					if (resp.hasOwnProperty('message')) {
						add_dashboard_notice(resp.message, 'info');
						if (resp.hasOwnProperty('sites_html')) {
							UpdraftCentral.set_existing_sites_to(resp.sites_html);
						} else {
							console.log("Expected sites_html data not found:");
							console.log(resp);
						}
						if (resp.hasOwnProperty('status_info')) { process_sites_status_info(resp.status_info); }
					}

					if (resp.hasOwnProperty('key_needs_sending')) {
						
						var site_id = resp.key_needs_sending.key_site_id;
						var site_ajax_url = resp.key_needs_sending.url;
						var $site_row = $('#updraftcentral_dashboard_existingsites .updraftcentral_site_row[data-site_id="'+site_id+'"');
						var site_remote_public_key = resp.key_needs_sending.remote_public_key;
						
						$($site_row).prepend('<div class="updraftcentral_spinner"></div>');
						
						var send_key_url = site_ajax_url+'&action=updraftcentral_receivepublickey&updraft_key_index='+encodeURIComponent(resp.key_needs_sending.updraft_key_index)+'&public_key='+encodeURIComponent(UpdraftCentral_Library.base64_encode(site_remote_public_key));
						var win = window.open(send_key_url, '_blank', 'toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=600,height=320');
						UpdraftCentral_Library.focus_window_or_error(win);
						return;
						
						// This requires CORS code on the receiving side
						/*
						$.post(site_ajax_url, {
							action: 'updraftcentral_receivepublickey',
							public_key: site_remote_public_key,
							updraft_key_index: resp.key_needs_sending.updraft_key_index
						}, function(response) {
							if (spinner_where) {
								$($site_row).children('.updraftcentral_spinner').remove();
							}
							// Obsolete - parse_response() no longer exists
							var resp = parse_response(response);
							if (false !== resp) {
								if (resp.code == 'ok') {
									console.log("UDCentral: successfully sent public key to remote site");
								} else {
									console.log("UDCentral: failed to send public key to remote site");
									console.log(resp);
									if (resp.code == 'already_have' || resp.code == 'already_have') {
										add_dashboard_notice(udclion[resp.code], 'error');
									} else {
										add_dashboard_notice(udclion.unknown_response, 'error');
									}
								}
							}
							
						});
						*/
							
					}
				}
			});
		}, udclion.add_site, function() {
			$('#updraftcentral_modal #updraftcentral_site_send_cors_headers').prop('checked', true);
// $('#updraftcentral_modal #updraftcentral_addsite_key').focus();
		} , false);
	});
	
	// Register the modal events which are active in the 'Sites' tab
	$('#updraftcentral_dashboard_existingsites').on('updraftcentral_dashboard_mode_set_sites', function(e) {
		
		register_modal_listener('#updraftcentral_addsite_expertoptions_show', function(e) {
			$(this).slideUp();
			$('#updraftcentral_modal #updraftcentral_editsite_expertoptions .initially-hidden').show();
			e.preventDefault();
		});
		
	});
	
	// Put clicked links within the settings sections into their own tab
	$('#updraftcentral_notice_container').on('click', 'a', function(e) {
		var href = $(this).attr('href');
		redirect_updraft_website_links(href, e);
	});

	// Register the row clickers and modal listeners which are active in every tab
	$('#updraftcentral_dashboard_existingsites').on('updraftcentral_dashboard_mode_set', function(event, data) {
		
		// Use a new browser portal for any clicks to updraftplus.com
		register_modal_listener('a', function(e) {
			var href = $(this).attr('href');
			redirect_updraft_website_links(href, e);
		});
		
		// Put clicked links within the settings sections into their own tab
		$('#updraftcentral_dashboard_existingsites_container').on('click', '.updraftcentral_site_row a', function(e) {
			var href = $(this).attr('href');
			redirect_updraft_website_links(href, e);
		});
		
		register_modal_listener('#updraft_debug_empty_browser_cache', function(e) {
			
			var how_many = 0;
			var verbose = (updraftcentral_debug_level > 0) ? true : false;
			
			for (var i = localStorage.length; i >= 0; --i) {
				var key = localStorage.key(i);
				if (key !== null && key.substr(0, 15) == 'updraftcentral_') {
					if (verbose) { console.log("UpdraftCentral: Removing key from local storage: "+key); }
					localStorage.removeItem(key);
					how_many++;
				}
			}
			if (how_many > 0) {
				UpdraftCentral_Library.dialog.alert('<h2>'+udclion.empty+' '+udclion.browser_cache+'</h2>'+sprintf(udclion.cache_emptied, how_many));
			} else {
				UpdraftCentral_Library.dialog.alert('<h2>'+udclion.empty+' '+udclion.browser_cache+'</h2>'+udclion.cache_no_contents);
			}
		});
		
		register_modal_listener('#updraft_debug_show_browser_cache', function(e) {
			var how_many = 0;
			for (var i = 0, len = localStorage.length; i < len; ++i) {
				var key = localStorage.key(i);
				var value = localStorage.getItem(key);
				if (key.substr(0, 15) == 'updraftcentral_') {
					how_many++;
					console.log(key+": "+value);
				}
			}
			if (how_many > 0) {
				UpdraftCentral_Library.dialog.alert('<h2>'+udclion.log_contents+'</h2>'+udclion.cache_contents_logged);
			} else {
				UpdraftCentral_Library.dialog.alert('<h2>'+udclion.log_contents+'</h2>'+udclion.cache_no_contents);
			}
		});
		
		// The 'upgrade' tab has no sites rows visible
		if (data && data.hasOwnProperty('new_mode') && data.new_mode == 'notices') { return; }
		
		register_modal_listener('.updraftcentral_site_editdescription', function(e) {
			e.preventDefault();
			open_site_configuration(UpdraftCentral.$site_row);
		});
		
		register_modal_listener('.updraftcentral_test_other_connection_methods', function(e) {
			e.preventDefault();
			UpdraftCentral_Library.open_connection_test(UpdraftCentral.$site_row);
		});
		
		register_modal_listener('a.connection-test-switch', function(e) {
			e.preventDefault();
			var connection_method = $(this).data('connection_method');
			
			UpdraftCentral.close_modal();
			
			var site_id = $(this).data('site_id');
			
			UpdraftCentral.send_ajax('edit_site_connection_method', { site_id: site_id, connection_method: connection_method }, null, 'via_mothership_encrypting', '#updraftcentral_dashboard_existingsites', function(resp, code, error_code) {
				
				if ('ok' == code) {
					
					if (resp.hasOwnProperty('message')) { add_dashboard_notice(resp.message); }
					
					if (resp.hasOwnProperty('sites_html')) {
						UpdraftCentral.set_existing_sites_to(resp.sites_html);
						setup_menunav();
					} else {
						console.log(resp);
						add_dashboard_notice(udclion.unknown_response, 'error');
					}
					if (resp.hasOwnProperty('status_info')) { process_sites_status_info(resp.status_info); }
				}
			});
		});
		
		register_modal_listener('.updraftcentral_siteinfo_results .phpinfo', function(e) {
			e.preventDefault();
			UpdraftCentral.send_site_rpc('core.phpinfo', null, UpdraftCentral.$site_row, function(response, code, error_code) {
				if ('ok' == code && response.data) {
					var output = '';
					$.each(response.data, function(name, section) {
						output += "<h3>"+name+"</h3>\n"+'<table>'+"\n";
						$.each(section, function(key, val) {
							if (val.constructor === Array) {
								output += "<tr><td>"+key+"</td><td>"+val[0]+"</td><td>"+val[1]+"</td></tr>\n";
							} else if (typeof val === 'string') {
								if ($.isNumeric(key)) {
									output += "<tr><td></td><td>"+val+"</td></tr>\n";
								} else {
									output += "<tr><td>"+key+"</td><td>"+val+"</td></tr>\n";
								}
							} else {
								console.log("UpdraftCentral: phpinfo: Unrecognised output for key "+key+" (follows)");
								console.log(val);
							}
						});
						output += "</table>\n";
					});
					
					// N.B. open_modal() by default sanitizes the body data
					UpdraftCentral.open_modal(udclion.phpinfo, '<div id="updraftcentral_phpinfo_results">'+output+'</div>', null, false, null, true, 'modal-lg');
				}
			}, $(this));
		});
		
		register_modal_listener('#updraftcentral_site_connection_method', function() {
			var site_connection_method = $('#updraftcentral_site_connection_method').val();
			
			if (null == site_connection_method) { return; }
			
			if (site_connection_method.substring(0, 7) == 'direct_' && 'https:' == document.location.protocol) {
				$('#updraftcentral_site_connection_method_message').show().html(udclion.http_must_go_via_mothership);
			} else {
				$('#updraftcentral_site_connection_method_message').hide();
			}
		}, 'change');
		
		register_row_clicker('.updraftcentral_site_adddescription', function($site_row) {
			open_site_configuration($site_row);
		});
		
		register_row_clicker('.updraftcentral_site_delete', function($site_row) {
			UpdraftCentral_Library.dialog.confirm('<h2>'+udclion.remove_site+'</h2><p>'+$site_row.data('site_url')+'</p><p>'+udclion.really_delete_site+'</p>', function(result) {
				if (!result) return;
				var site_id = UpdraftCentral.$site_row.data('site_id');
				if (!site_id) { return; }
				$site_row.slideUp('slow');
				
				UpdraftCentral.send_ajax('delete_site', { site_id: site_id }, null, 'via_mothership_encrypting', '#updraftcentral_dashboard_existingsites', function(resp, code, error_code) {
					if ('ok' == code) {
						if (resp.hasOwnProperty('message')) {
							add_dashboard_notice(resp.message);
						}
						if (resp.hasOwnProperty('sites_html')) {
							UpdraftCentral.set_existing_sites_to(resp.sites_html);
						} else {
							console.log(resp);
							add_dashboard_notice(udclion.unknown_response, 'error');
						}
						if (resp.hasOwnProperty('status_info')) { process_sites_status_info(resp.status_info); }
					}
				});
				
			});
		});
		
		register_row_clicker('.row_siteinfo', function($site_row) {
			UpdraftCentral.send_site_rpc('core.site_info', null, $site_row, function(response, code, error_code) {
				if (updraftcentral_debug_level > 1) {
					console.log("send_site_rpc(site_info): parsed response follows");
					console.log(response);
				}
				if ('ok' == code) {
					if (false !== response) {
						var versions = response.data.versions;
						var bloginfo = response.data.bloginfo;
						var url = UpdraftCentral_Library.sanitize_html(bloginfo.url);
						var name = UpdraftCentral_Library.sanitize_html(bloginfo.name);
						// 'This site is running WordPress version %s (PHP %s, MySQL %s) and UpdraftPlus version %s (UDRPC version %s)'
						// var message = sprintf(udclion.what_remote_running, UpdraftCentral_Library.sanitize_html(versions.wp), UpdraftCentral_Library.sanitize_html(versions.php), UpdraftCentral_Library.sanitize_html(versions.mysql), UpdraftCentral_Library.sanitize_html(versions.ud), UpdraftCentral_Library.sanitize_html(versions.udrpc_php));
						// add_dashboard_notice(message, 'info');
						// N.B. By default, open_modal() sanitizes the body.
						var ud_version = versions.ud;
						if ('none' == ud_version) { ud_version = udclion.updraftplus.version_none; }
						var message = sprintf(udclion.what_remote_running, versions.wp, versions.php, versions.mysql, ud_version, versions.udrpc_php);
						UpdraftCentral.open_modal(
							UpdraftCentral_Library.sanitize_html(bloginfo.name),
							UpdraftCentral.template_replace('dashboard-siteinfo', { url: url, message: message, phpinfo: udclion.phpinfo }),
							null,
							false
						);
					}
				}
			});
		});
		
		register_row_clicker('.updraftcentral_site_dashboard', function($site_row) {
			UpdraftCentral_Library.open_browser_at($site_row);
		});
		
	});
	
	/**
	 * Gets the HTML fragment for advanced site editing options
	 *
	 * @param {Object} values - the values to pass to the template
	 *
	 * @returns {string} - the HTML
	 */
	this.get_advanced_site_options_html = function(values) {
		return UpdraftCentral.template_replace('sites-advanced-site-options', values);
	}
	
	/**
	 * Opens the site configuration dialog for the specified site
	 *
	 * @param {Object} $site_row - the jQuery row object for the site whose configuration is to be edited
	 * @returns {void}
	 */
	this.open_site_configuration = function($site_row) {

		var site_url = $site_row.data('site_url');
		
		var http_username = $site_row.data('http_username');
		if ('undefined' === typeof http_username) { http_username = ''; }
		
		var http_password = $site_row.data('http_password');
		if ('undefined' === typeof http_password) { http_password = ''; }
		
		var connection_method = $site_row.data('connection_method');
		if ('undefined' === typeof connection_method) { connection_method = 'direct_default_auth'; }
		
		var http_authentication_method = $site_row.data('http_authentication_method');
		if ('undefined' === typeof http_authentication_method) { http_authentication_method = 'basic'; }
		
		var existing_description = $site_row.data('site_description');
		if (existing_description == site_url) { existing_description = ''; }
		
		var send_cors_headers = $site_row.data('send_cors_headers');
		if ('undefined' === typeof send_cors_headers || send_cors_headers) { send_cors_headers = 1; }
		
		var advanced_site_options_html = UpdraftCentral.get_advanced_site_options_html({http_username: http_username, http_password: http_password});

		UpdraftCentral.open_modal(udclion.edit_site_configuration, UpdraftCentral.template_replace('sites-edit-configuration', { site_url: site_url, advanced_options: advanced_site_options_html }, { existing_description: existing_description }), function() {
			
			var description = $('#updraftcentral-edit-site-description').val();
			
			var send_cors_headers = $('#updraftcentral_modal #updraftcentral_site_send_cors_headers').is(':checked') ? 1 : 0;

			var connection_method = $('#updraftcentral_modal #updraftcentral_site_connection_method').val();
			
			var site_id = $site_row.data('site_id');
			if (!site_id) { return; }
			
			UpdraftCentral.close_modal();
			
			var extra_site_info = UpdraftCentral_Library.get_serialized_options('#updraftcentral_modal .expert_option');
			
			UpdraftCentral.send_ajax('edit_site_configuration', { site_id: site_id, description: description, extra_site_info: extra_site_info, send_cors_headers: send_cors_headers, connection_method: connection_method }, null, 'via_mothership_encrypting', '#updraftcentral_dashboard_existingsites', function(resp, code, error_code) {

				if ('ok' == code) {
					
					if (resp.hasOwnProperty('message')) { add_dashboard_notice(resp.message); }
					
					if (resp.hasOwnProperty('sites_html')) {
						UpdraftCentral.set_existing_sites_to(resp.sites_html);
						setup_menunav();
					} else {
						console.log(resp);
						add_dashboard_notice(udclion.unknown_response, 'error');
					}
					if (resp.hasOwnProperty('status_info')) { process_sites_status_info(resp.status_info); }
				}
			});
			
		}, udclion.edit, function() {
			$('#updraftcentral_modal #updraftcentral_site_connection_method').val(connection_method).change();
			if (send_cors_headers) { $('#updraftcentral_modal #updraftcentral_site_send_cors_headers').prop('checked', true); }
			$('#updraftcentral_modal #updraftcentral_addsite_http_authentication_method').val(http_authentication_method);
		}, false);
	}
	
	/**
	 * RPCCallback
	 *
	 * @callable RPCCallback
	 * @param {Object} response - the data returned by the RPC call. The format of this object depends upon both code and (if code is not 'ok') on error_code, and so should not be processed before those variables have been inspected.
	 * @param {string} code - the code returned by the RPC call; currently possible values are 'ok' or 'error'
	 * @param {string|null} error_code - the error code returned by the RPC call (if any).
	 *
	 * @returns {*} - if true, then in the case of an error (code is 'error'), then no further action will be taken; otherwise, default actions (e.g. displaying an error) will be taken
	 */
	
	/**
	 * This is intended for debugging use only, from the browser console. It sends a command to the site specified by URL. The results are logged in accordance with your debug settings
	 *
	 * @param {string} rpc_command - the command to send
	 * @param {*} data - the data to send with the command
	 * @param {string} site_url - the URL of the site to send to; this must exactly match site URL in one of the rows (N.B. normally you need to include the trailing slash)
	 * @param {number} [timeout=30] - the number of seconds for the timeout on the HTTP call
	 */
	this.debugging_send_command = function(rpc_command, data, site_url, timeout) {
		var $site_row = $('#updraftcentral_dashboard_existingsites').find('.updraftcentral_site_row[data-site_url="'+site_url+'"]').first();
		if ($site_row.length < 1) {
			console.log("debugging_send_command: no corresponding row found for the specified URL");
			return;
		}
		
		timeout = 'undefined' !== typeof timeout ? timeout : 30;
		
		UpdraftCentral.send_site_rpc(rpc_command, data, $site_row, function(response, code, error_code) {
			// Nothing needs logging here, as other parts of the stack will already do that.
		}, null, timeout);
	}

	/**
	 * Helper method for the UpdraftCentral.is_serializable function which
	 * checks whether the submitted object or property has plain/simple data types
	 *
	 * @see {UpdraftCentral.is_serializable}
	 * @param {*} data - Any type of data for checking or validation.
	 * @returns {boolean} - "true" if data has plain/simple type, "false" otherwise.
	 */
	var is_plain_type = function (data) {
		
		// N.B. We're not comparing the type for "null" since it will always return as object. Thus,
		// Giving a false positive when running the check against this method (is_plain_type), instead
		// We're comparing it by value. If a "null" value is encountered we consider it as plain
		// Since it doesn't reference any complex heirarchy other than being a "null".

		if (data === null || typeof data === 'string' || typeof data === 'boolean' || typeof data === 'number' || typeof data === 'undefined' || jQuery.isPlainObject(data) || Array.isArray(data)) {
			return true;
		}
		return false;
	}

	/**
	 * Checks whether the submitted data is valid for serialization
	 *
	 * @borrows {UpdraftCentral#is_plain_type}
	 * @param {*} data - Any type of data for checking or validation.
	 * @param {undefined|null} field - An optional field passed around during the loop.
	 * @returns {boolean} - "true" if data is valid for serialization, "false" otherwise.
	 */
	this.is_serializable = function(data, field) {
		if (!is_plain_type(data)) {
			if ('undefined' !== typeof field && field) {
				return {
					status: false,
					data: data,
					error_field: field,
					error_type: typeof data[field],
					error_value: data[field]
				};
			} else {
				return { status: false };
			}
		}
		
		for (var field in data) {
			if (!is_plain_type(data[field])) {
				return {
					status: false,
					data: data,
					error_field: field,
					error_type: typeof data[field],
					error_value: data[field]
				};
			}
			if (typeof data[field] === "object") {
				var result = UpdraftCentral.is_serializable(data[field], field);
				if (result.hasOwnProperty('status') && !result.status) {
					return {
						status: false,
						data: result.data,
						error_field: result.error_field,
						error_type: typeof result.data[result.error_field],
						error_value: result.data[result.error_field]
					};
				}
			}
		}
		return true;
	}
	
	/**
	 * Send a command to the remote site. This is a very thin wrapper around send_ajax.
	 *
	 * @uses send_ajax
	 *
	 * @param {string} rpc_command - the command to send
	 * @param {*} data - the data to send with the command
	 * @param {Object} $site_row - the jQuery object for the row of the site that the request is being sent to
	 * @param {RPCCallback} callback - function to call with the results
	 * @param {Object|null|false} spinner_where - jQuery object indicating where any spinner should be shown
	 * @param {number} [timeout=30] - the number of seconds for the timeout on the HTTP call
	 * @returns {void}
	 */
	this.send_site_rpc = function(rpc_command, data, $site_row, callback, spinner_where, timeout) {
		
		var result = UpdraftCentral.is_serializable(data);
		if (data !== null && result.hasOwnProperty('status') && !result.status) {
			console.log('UpdraftCentral: send_site_rpc(' + rpc_command + ') - the submitted data parameter contains unserializable types (follows)');
			if (result.hasOwnProperty('error_field') && result.error_field) {
				console.log('Error field: '+result.error_field);
				console.log('Error type: '+result.error_type);
				console.log('Error value follows:');
				console.log(result.error_value);
			} else {
				console.log(data);
			}

			callback.call(this, {
				error: udclion.js_exception_occurred
			}, 'error', null);
		} else {
			timeout = 'undefined' !== typeof timeout ? timeout : 30;
			var site_id = $site_row.data('site_id');
			if (!site_id) {
				console.log("UpdraftCentral: sent_site_rpc("+rpc_command+") command sent, but site ID could not be identified from the row (follows)");
				console.log($site_row);
			}

			var connection_method = $site_row.data('connection_method');
			
			if ('undefined' === typeof spinner_where || null === spinner_where) { spinner_where = $site_row; }

			try {
				return UpdraftCentral.send_ajax(rpc_command, data, $site_row, connection_method, spinner_where, callback, timeout);
			} catch (e) {
				if (spinner_where) {
					$(spinner_where).children('.updraftcentral_spinner').remove();
				}

				// Here, we're triggering the callback with a code 'error' and passing in
				// the error that was catched by the try-catch block. This should help the caller to handle the error by itself. By
				// returning "true" (boolean) it will bypass the default error dialog to display,
				// meaning, the error was already handled by the caller (e.g. displayed, etc.), otherwise, the default
				// dialog will be shown to the user.
				var is_error_handled = callback.call(this, {
					error: e.toString()
				}, 'error', null);
				
				if (typeof is_error_handled === 'undefined' || !is_error_handled) {
					// add_dashboard_notice(udclion.js_exception_occurred+'<br>'+e.toString(), 'error');
					var website = ('undefined' !== typeof $site_row && $site_row.length) ? $site_row.data('site_description')+' - ' : '';

					UpdraftCentral_Library.dialog.alert('<h2>'+website+udclion.error+'</h2>'+udclion.js_exception_occurred+'<br>'+e.toString());
					console.log(e);
				}
			}
		}
	}

	$('#updraftcentral_dashboard .updraft-central-logo img').dblclick(function() { UpdraftCentral_Library.toggle_fullscreen(); });
	
	$('#updraft-central-navigation .updraft-full-screen').on('click', function() { UpdraftCentral_Library.toggle_fullscreen(); });

	$('#updraft-central-navigation .updraftcentral-help').on('click', function() {
		UpdraftCentral_Library.dialog.alert(UpdraftCentral.template_replace('dashboard-help', { uc_version: udclion.updraftcentral_version+': '+udclion.udc_version, running_on: UpdraftCentral.version_info_as_text() }));
	});

	/**
	 * Return a string with information on the current installation
	 *
	 * @returns {string} information on the current installation
	 */
	this.version_info_as_text = function() {
		return 'WP/'+udclion.wp_version+' PHP/'+udclion.php_version+' MySQL/'+udclion.mysql_version+' Curl/'+udclion.curl_version;
	}
		
	$('#updraft-central-navigation .updraftcentral-settings').on('click', function() {
		
		UpdraftCentral.open_modal(udclion.settings, UpdraftCentral.template_replace('dashboard-settings', {
			uc_version: udclion.updraftcentral_version+': '+udclion.udc_version,
			running_on: UpdraftCentral.version_info_as_text()
		}), function() {
			var new_debugging_level = $('#updraftcentral_debug_level').val();
			if (new_debugging_level >= 0 && new_debugging_level <=3) {
				UpdraftCentral.set_debug_level(new_debugging_level);
			}
			UpdraftCentral.close_modal();
		}, udclion.save_settings, function() {
			$('#updraftcentral_debug_level').val(updraftcentral_debug_level);
		});
		
	});
	
	// Refresh dashicon rotates after it has been clicked - stops when the settings are refreshed.
	$('.updraftcentral_row_extracontents').on('click', '.dashicons-image-rotate', function() {
		$('.dashicons-image-rotate').addClass('dashicon-image-rotating');
	});
	
	/**
	 * Returns the result of filling in the specified Handlebars (http://handlebarsjs.com) template with the provided values
	 *
	 * @param {string} template_name - the name of the Handlebars template, based (though it is filterable) on the path within the 'templates' directory, with slashes replaced by dashes. e.g. templates/dashboard/something.handlebars.html is accessed via a name of 'dashboard-something'
	 * @param {Object} [vars] - an object with properties (and corresponding values) corresponding to the named variables in the template and the values to replace them. N.B. The udclion object is always passed through (as udclion).
	 * @param {Object} [attr_vars] - an optional object with properties (and corresponding values) corresponding to the named variables in the template and the values to replace them, but for which the values will first be sanitized for use in HTML attributes. This may not be necessary on input which isn't user-supplied (e.g. its format may already be known to be attribute-safe).
	 *
	 * @returns {string} The template with values filled in
	 */
	this.template_replace = function(template_name, vars, attr_vars) {
		vars = ('undefined' === typeof vars) ? {} : vars;
		if (!UpdraftCentral_Handlebars.hasOwnProperty(template_name)) {
			console.log("UDCentral: UpdraftCentral_Handlebars template not found: "+template_name);
			console.log(UpdraftCentral_Handlebars);
		}
		if ('undefined' !== typeof attr_vars) {
			$.each(attr_vars, function(k, v) {
				vars[k] = UpdraftCentral_Library.quote_attribute(v);
			});
		}
		vars.udclion = udclion;
		
		/* Checks if the template was compiled by gulp-handlebars and not the default node compiler */
		if (typeof UpdraftCentral_Handlebars[template_name] === "object") {
			return UpdraftCentral_Handlebars[template_name].handlebars(vars)
		}
		return UpdraftCentral_Handlebars[template_name](vars);
	}
	
	UpdraftCentral_Handlebars = (typeof UpdraftCentral_Handlebars === 'undefined') ? {} : UpdraftCentral_Handlebars;
	
	Handlebars.registerHelper('uc_each', function(context, options) {
		var ret = "";
		if ('undefined' === typeof context) { return ret; }
		for (var i=0, j=context.length; i<j; i++) {
			var vars = context[i];
			vars.as_json = JSON.stringify(vars);
			vars.udclion = udclion;
			ret = ret + options.fn(vars);
		}
		return ret;
	});
	
	/**
	 * Compiles any Handlebars templates that have been passed into the page. By default, they are pre-compiled; but compilation happens in-browser when in developer mode.
	 *
	 * @returns {void}
	 */
	function compile_handlebars_templates() {
		// Initialise Handlebars.templates - it may not already exist
		if (!udclion.hasOwnProperty('handlebars')) return;
		if (udclion.handlebars.hasOwnProperty('compile')) {
			$.each(udclion.handlebars.compile, function(template_name, source) {
				console.log("UpdraftCentral: in developer mode: compile template: "+template_name);
				UpdraftCentral_Handlebars[template_name] = Handlebars.compile(source);
			});
		}
	}
	
	compile_handlebars_templates();
	
	setup_menunav();
	
	set_dashboard_mode('sites');
	
	if ('undefined' !== typeof Modernizr && !Modernizr.lastchild) {
		console.log("UDCentral: Unsupported web browser");
		$('#updraftcentral_dashboard_loading').fadeOut();
		$('#updraftcentral_updraftplus_actions, #updraftcentral_sites_actions, #updraftcentral_dashboard_existingsites_container').remove();
		this.add_dashboard_notice(udclion.unsupported_browser, 'error', false);
	} else {
		
		$('#updraftcentral_dashboard_loading').fadeOut();
		$('#updraftcentral_dashboard_existingsites_container').fadeIn();
		
		if (udclion.hasOwnProperty('show_licence_counts') && udclion.show_licence_counts) { $('.updraftcentral_licence_info').show(); }
		
		// Refresh the sites list every 24 hours
		setInterval(function() {
			UpdraftCentral.send_ajax('sites_html', null, null, 'via_mothership_encrypting', '#updraftcentral_dashboard_existingsites', function(resp, code, error_code) {
				if ('ok' == code) {
					if (resp.hasOwnProperty('sites_html')) {
						UpdraftCentral.set_existing_sites_to(resp.sites_html);
					} else {
						console.log("Expected sites_html data not found:");
						console.log(resp);
					}
					if (resp.hasOwnProperty('status_info')) { process_sites_status_info(resp.status_info); }
				}
			});
		}, 86400000);
		
	}
	
	// Remove any indicated notices that came pre-printed on the page
	$('#updraftcentral_notice_container .updraftcentral_notice.remove_after_load').delay(30000).slideUp('slow', function() {
		$(this).remove();
	});
	
	// Move this out of the hierarchy, so that any parent elements in the theme with z-indexes can't result in it being hidden under the grey-out (since the grey-out is not in the hierarchy)
	$('#updraftcentral_modal_dialog').appendTo(document.body);
	
	/**
	 * Stores persistent data in the browser, using the HTML5 local storage API. Uses a fixed prefix of 'updraftcentral_' to avoid clashing with other applications.
	 *
	 * We are abstracting this to allow not only for expiring data, but for other possible future enhancements; e.g. an option to duplicate some items persiently in the database. For now we are keeping our options open.
	 *
	 * @param {string} key - storage key
	 * @param {*} data - data to store; must be data than can be turned into JSON
	 * @param {boolean} [can_expire=false] - whether the time of updating the data should be stored (to allow assessing its age when retrieving it). Note that this should always be used consistently (either always on, or always off) with any particular key - otherwise, its results can be out of date.
	 * @returns {void}
	 */
	this.storage_set = function(key, data, can_expire) {
		if ('undefined' !== typeof can_expire && can_expire) {
			var epoch_time = Math.floor(Date.now() / 1000);
			localStorage.setItem('updraftcentral_saved_at_'+key, epoch_time);
		}
		if (updraftcentral_debug_level > 1) {
			console.log("UpdraftCentral.storage_set(key="+key+")");
		}
		localStorage.setItem('updraftcentral_'+key, JSON.stringify(data));
	}
	
	/**
	 * Retrieves stored data from the browser, using the HTML5 local storage API. Uses a fixed prefix of 'updraftcentral_' to avoid clashing with other applications.
	 *
	 * @param {string} key - storage key
	 * @param {Number|Boolean} [maximum_age=false] - if set to a strictly positive numerical value, then only return the data if it was stored within the indicated number of seconds.
	 * @returns {*} - stored data. Returns null if the age check fails. The result for never-stored data is undefined.
	 */
	this.storage_get = function(key, maximum_age) {
		if ('undefined' !== typeof maximum_age && maximum_age > 0) {
			var stored_at = localStorage.getItem('updraftcentral_saved_at_'+key);
			if (!stored_at) { return null; }
			var epoch_time = Math.floor(Date.now() / 1000);
			var stored_ago = epoch_time - stored_at;
			if (UpdraftCentral.updraftcentral_debug_level > 1) {
				console.log("UpdraftCentral.storage_get(key="+key+", maximum_age="+maximum_age+"): stored_at="+stored_at+", epoch_time="+epoch_time+", stored_ago="+stored_ago);
			}
			
			if (stored_ago > maximum_age) { return null; }
		}
		var item = localStorage.getItem('updraftcentral_'+key);
		if ('undefined' === typeof item) { return null; }
		try {
			var parsed = JSON.parse(item);
			return parsed;
		} catch (e) {
		}
		return null;
	}
	
	/**
	 * Retrieves stored data from the browser, using the HTML5 local storage API. Uses a fixed prefix of 'updraftcentral_' to avoid clashing with other applications.
	 *
	 * @param {string} key - storage key
	 * @returns {string} the stored value
	 */
	this.storage_remove = function(key) {
		localStorage.removeItem('updraftcentral_saved_at_'+key);
		return localStorage.removeItem('updraftcentral_'+key);
	}
	
	return this;
};

