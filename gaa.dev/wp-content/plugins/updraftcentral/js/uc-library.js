jQuery(document).ready(function($) {
	UpdraftCentral_Library = new UpdraftCentral_Library();
});

/**
 * Progress Bar Class
 *
 * A generic progress bar class that uses the jQuery
 * progressbar widget.
 *
 * @constructor
 * @uses {jQuery.ui.progressbar}
 */
function UpdraftCentral_Task_Progress() {
	var self = this;
	var $progress_bar;
	var storage;
	var interval;
	var current_limit;
	var current_bar;
	var $container = $container || '';

	this.total_items;
	this.label;
	
	/**
	 * Renders and displays the progress bar html
	 *
	 * @returns {void}
	 * @uses {jQuery.ui.progressbar}
	 */
	var render = function() {
		if ($container.length == 0) {
			console.log('UpdraftCentral_Task_Progress: Progress bar container not defined - exiting');
			return;
		}

		if (typeof jQuery.ui !== 'undefined' && typeof jQuery.ui.progressbar === 'function') {
			var $progress_container = $container.find('#uc_task_progress');
			
			if ($progress_container.length === 0) {
				$container.append('<div id="uc_task_progress"><div id="uc_task_progress_label">' + udclion.current_progress + ': 0%</div><div id="uc_task_progress_bar"><div id="uc_task_progress_status"></div></div></div>');
			}
			
			$progress_bar = $container.find('#uc_task_progress > div#uc_task_progress_bar');
			if (!$progress_bar.is(':ui-progressbar')) {
				$progress_bar.progressbar({
					max: 100,
					value: 0,
					change: function() {
						$container.find('#uc_task_progress_label').text(udclion.current_progress + ': ' + $progress_bar.progressbar('option', 'value') + '%');
					},
					complete: function() {
						clearInterval(interval);
					}
				});
			} else {
				// Calculates the current progress percentage and updates
				// The progress bar value with the result of the computation.
				var total = parseInt(self.total_items);
				var remainder = 100 % total;
				var new_value = (storage.count() * parseInt(100 / total)) + remainder;
				
				// Letting the caller control the completion of the progress bar
				// By calling the set_complete functon when everything is already successful.
				if (new_value < 100) {
					current_bar = new_value;
					$progress_bar.progressbar('option', 'value', new_value);
				}
			}
		} else {
			console.log('UpdraftCentral_Task_Progress: jQuery progressbar or one of its dependency is not installed - exiting');
			return;
		}
	}
	
	/**
	 * Initializes local variables
	 *
	 * Checks whether we have a valid container where to display
	 * the progress bar widget. Otherwise, it will throw an error.
	 *
	 * @returns {void}
	 */
	var init = function() {
		if (typeof $container === 'undefined') {
			console.log('UpdraftCentral_Task_Progress: A container element is required. This is where the progress bar is to be appended - exiting');
			return;
		}
		self.total_items = 0;
		storage = new UpdraftCentral_Collection();
		current_limit = 0;
		current_bar = 0;
	}
	init();


	/**
	 * Displays a gradual movement of the progress bar within the bounds
	 * of the currently processed item.
	 *
	 * @returns {void}
	 */
	var dummy_progress = function() {
		var $progress_container = $container.find('#uc_task_progress');
		if ($progress_container.length == 0) return;

		// Mimics a progressive bar movement through a computation
		// based on the currently processed item's position (limit) with respect
		// to the number of items tied to the progress bar.
		var total = parseInt(self.total_items);
		var remainder = 100 % total;
		
		current_limit = (storage.count() * parseInt(100 / total)) + remainder;
		interval = setInterval(function() {
			if (current_bar < current_limit) {
				// The continous movement may sometimes get pass through 100. Thus,
				// we're forcing it to stop when it reached 100 in order to be consistent
				// with the end goal of setting the completion manually by the user.
				if (current_bar < 99) {
					$progress_bar.progressbar('option', 'value', ++current_bar);
				} else {
					clearInterval(interval);
				}
			} else {
				clearInterval(interval);
			}
		}, 1000);

	}

	/**
	 * Sets a custom message displayed as a progress bar status
	 *
	 * @param {string} message - Text to display on the progress bar
	 * @returns {void}
	 */
	this.set_custom_status = function(message) {
		var status = $container.find('#uc_task_progress_status');
		if (status.length == 0) return;

		if ('undefined' !== typeof message && message) {
			status.text(message);
		}
	}

	/**
	 * Setting the progressbar completion manually
	 *
	 * @param {string} message - An optional message to display on the progress bar.
	 *							 If not empty, will be used to indicate that the process
	 *							 has already been completed.
	 * @returns {void}
	 */
	this.set_complete = function(message) {
		var status = $container.find('#uc_task_progress_status');
		if (status.length == 0) return;

		current_bar = 100;
		$progress_bar.progressbar('option', 'value', current_bar);

		if (typeof message !== 'undefined') {
			status.text(message);
		} else {
			status.text(udclion.process_completed);
		}
	}
	
	/**
	 * Updates the progress bar data by recomputing the current progress
	 *
	 * @returns {void}
	 */
	this.update = function() {
		if (storage.count()) {
			render();
		}
	}
	
	/**
	 * Set the label of the currently processed item
	 *
	 * @param {string} label - A string that will be displayed for the currently process item.
	 * @param {boolean} use_custom - An optional argument. If true, will used the submitted label
	 *								 as the message to display instead of using the default.
	 * @returns {void}
	 */
	this.set_current_label = function(label, use_custom) {
		var status = $container.find('#uc_task_progress_status');
		if (status.length == 0) return;

		if (storage.add(label, label)) {
			self.label = label;
			if (typeof use_custom !== 'undefined' && use_custom) {
				status.text(label);
			} else {
				status.text(udclion.processing + ' "' + self.label + '" ...');
			}
		}
	}

	/**
	 * Sets the container where the progress bar should be appended
	 *
	 * @param {object} $new_container - A jQuery object/element that will hold the
	 *									rendered progress bar.
	 * @returns {void}
	 */
	this.set_container = function($new_container) {
		// Making sure no unwanted process is currently running unless
		// Specified or called explicity.
		if (typeof interval !== 'undefined') {
			clearInterval(interval);
		}
		
		$container = $new_container;
		render();
	}

	/**
	 * Starts the dummy progress routine.
	 *
	 * @uses {UpdraftCentral_Task_Progress#render}
	 * @uses {UpdraftCentral_Task_Progress#dummy_progress}
	 * @returns {void}
	 */
	this.start = function() {
		dummy_progress();
	}

	/**
	 * Cleanup previous process resources
	 *
	 * @uses {UpdraftCentral_Task_Progress.reset}
	 * @returns {void}
	 */
	this.end = function() {
		self.reset();
	}

	/**
	 * Updates the status message on error
	 *
	 * @param {string} message - An optional message to display as opposed to the default message.
	 */
	this.abort = function(message) {
		var status = $container.find('#uc_task_progress_status');
		if (status.length == 0) return;

		clearInterval(interval);
		if (typeof message !== 'undefined') {
			status.text(message);
		} else {
			status.text(udclion.process_aborted);
		}
	}
	
	/**
	 * Resets the progress bar to its initial state
	 *
	 * @returns {void}
	 */
	this.reset = function() {
		var $progress_container = $container.find('#uc_task_progress');
		if ($progress_container.length == 0) return;

		clearInterval(interval);
		total_items = 0;
		storage.clear();
		current_limit = 0;
		current_bar = 0;
		$progress_container.remove();
	}

	/**
	 * Clears the progress bar states to give way for a new process
	 *
	 * @returns {void}
	 */
	this.clear = function() {
		clearInterval(interval);
		total_items = 0;
		storage.clear();
		current_limit = 0;
		current_bar = 0;
	}

	/**
	 * Hides the progress bar widget
	 *
	 * @returns {void}
	 */
	this.hide = function() {
		var $progress_container = $container.find('#uc_task_progress');
		if ($progress_container.length == 0) return;
			
		$progress_container.hide();
	}

	/**
	 * Shows the progress bar widget
	 *
	 * @returns {void}
	 */
	this.show = function() {
		var $progress_container = $container.find('#uc_task_progress');
		if ($progress_container.length == 0) return;
			
		$progress_container.show();
	}
}

/**
 * Generic Collection Class
 *
 * Serves as a generic storage for all kinds of uses.
 *
 * @constructor
 */
function UpdraftCentral_Collection() {
	var self = this;
	var count = 0;
	var collection = {};
	
	/**
	 * Adds an item with a specified key to the collection
	 *
	 * @param {string} key - A unique identifier for the item.
	 * @param {object|array|string|number|boolean} item - Can be of any type.
	 * @returns {boolean}
	 */
	this.add = function(key, item) {
		if (!self.exists(key)) {
			collection[key] = item;
			count++;
			return true;
		}
		return false;
	}
	
	/**
	 * Updates a collection item with a specified key
	 *
	 * @param {string} key - A unique identifier for the item.
	 * @param {object|array|string|number|boolean} item - The updated item. Can be of any type.
	 * @returns {boolean}
	 */
	this.update = function(key, item) {
		if (self.exists(key)) {
			collection[key] = item;
			return true;
		}
		return false;
	}
	
	/**
	 * Removes an item with a specified key from the collection
	 *
	 * @param {string} key - The identifier of the item to be removed.
	 * @returns {boolean}
	 */
	this.remove = function(key) {
		if (self.exists(key)) {
			delete collection[key];
			count--;
			return true;
		}
		return false;
	}
	
	/**
	 * Retrieves an item with a specified key from the collection
	 *
	 * @param {string} key - The identifier of the item to be retrieved.
	 * @returns {object|array|string|number|boolean}
	 */
	this.item = function(key) {
		return collection[key];
	}
	
	/**
	 * Returns all available keys from the collection
	 *
	 * @returns {array}
	 */
	this.keys = function() {
		var keys = [];
		for (var k in collection) keys.push(k);
		
		return keys;
	}
	
	/**
	 * Checks whether an item with a specified key exists in the collection
	 *
	 * @param {string} key - The identifier of the item to be checked.
	 * @returns {boolean}
	 */
	this.exists = function(key) {
		return (typeof collection[key] !== 'undefined');
	}
	
	/**
	 * Empty or resets the collection
	 *
	 * @returns {void}
	 */
	this.clear = function() {
		count = 0;
		collection = {};
	}
	
	/**
	 * Returns the number of items found in the collection
	 *
	 * @returns {number}
	 */
	this.count = function() {
		return count;
	}
	
	/**
	 * Returns all items in the collection
	 *
	 * @returns {array}
	 */
	this.get_items = function() {
		var items = [];
		for (var k in collection) items.push(collection[k]);
		
		return items;
	}
}

/**
 * A Tasks Runner Function
 *
 * Runs and execute queued tasks using the d3queue library. This class
 * was created in preparation for the mass updates feature of all sites
 * under the UpdraftCentral plugin.
 *
 * @constructor
 * @see {UpdraftCentral_Collection}
 * @see {d3queue}
 * @param {object} options - Task runner's options
 * @param {number} options.concurrency - Number of concurrency needed to run the process
 */
function UpdraftCentral_Tasks_Runner(options) {
	var self = this;
	var options = options || {};
	var storage;
	this.progress;

	/**
	 * Initialize and/or checks required process variables
	 *
	 * @private
	 * @returns {void}
	 * @uses {UpdraftCentral_Collection}
	 * @uses {UpdraftCentral_Task_Progress}
	 * @uses {d3queue}
	 */
	var init = function() {
		storage = new UpdraftCentral_Collection();
		self.progress = new UpdraftCentral_Task_Progress();
	}
	init();
	
	/**
	 * Runs a specified task
	 *
	 * @private
	 * @param {object} task - An object containing the callback function to be executed and its arguments.
	 * @param {function} task.func - A deferred function that returns a jQuery promise object that
	 * @param {array} task.args - An array containing the arguments of the deferred function.
	 * @param {function} callback - A callback function that will be executed after the task is run.
	 *								A pre-requisite of the d3queue library.
	 */
	var run_task = function(task, callback) {
		task.func.apply(null, task.args).then(function(result) {
			callback(null, result);
		}).fail(function(result) {
			var error = result;
			if (typeof error === 'undefined') error = true;

			callback(error);
		});
	}
	
	/**
	 * Returns the total count of the tasks currently
	 * being queued for process
	 *
	 * @returns {number} - The total count of the queued items/tasks
	 */
	this.tasks_count = function() {
		return storage.count();
	}

	/**
	 * Removes the specified task from the collection of queued tasks
	 *
	 * @param {string} task_key - The generated key produced when the task was
	 *							  successfully added.
	 * @returns {boolean} - "True" if task was successfully removed, "False" otherwise.
	 */
	this.remove_task = function(task_key) {
		return storage.remove(task_key);
	}
	
	/**
	 * Adds task to execute
	 *
	 * @uses {UpdraftCentral_Library.md5}
	 * @param {function} callback - A function or process that will be executed when the task is run.
	 * @param {array} args - The arguments or parameters to the callback function.
	 * @returns {boolean|string} - The associated key if the task was successfully added, "False" otherwise.
	 */
	this.add_task = function(callback, args) {
		var options = options || {};
		
		if (typeof callback === 'function') {
			var timestamp = new Date().getTime();
			var rand = Math.ceil(Math.random()*1000);
			var key = UpdraftCentral_Library.md5('_key_' + timestamp + rand);
			
			var task = {
				func: callback,
				args: args
			}
			
			// Add reference to the class instance that will
			// Serve as a context when using the progress bar.
			// This will be appended as the last argument to the
			// Submitted callback above.
			task.args.push(self);
			
			if (storage.add(key, task)) {
				return key;
			}
		}
		return false;
	}
	
	/**
	 * Clears all previously saved tasks
	 *
	 * @returns {void}
	 */
	this.clear_tasks = function() {
		self.progress.clear();
		storage.clear();
	}
	
	/**
	 * Aborts all active tasks
	 *
	 * @returns {void}
	 */
	this.abort = function() {
		queue.abort();
		self.clear_tasks();
	}
	
	/**
	 * Process all tasks in queue
	 *
	 * @returns {object} - A jQuery promise
	 * @uses {jQuery.Deferred}
	 * @uses {d3queue}
	 */
	this.process_tasks = function() {
		var deferred = jQuery.Deferred();
		
		if (storage.count() > 0) {
			self.progress.total_items = storage.count();

			var queue;
			if (typeof options.concurrency !== 'undefined') {
				queue = d3.queue(options.concurrency);
			} else {
				queue = d3.queue();
			}

			var keys = storage.keys();
			for (var i=0; i<keys.length; i++) {
				var task = storage.item(keys[i]);
				queue.defer(run_task, task);
			}
			
			// Executes when all tasks has been completed or aborted due to error
			// Or clicking the abort button itself
			queue.awaitAll(function(error, data) {
				if (error) {
					deferred.reject(error);
				} else {
					// Returns an array of results
					deferred.resolve(data);
				}
			});
		} else {
			deferred.reject(udclion.tasks_queue_empty);
		}
		
		return deferred.promise();
	}
	
}

/**
 * Abstraction Layer/Class for Site Credentials
 *
 * @constructor
 * @see {UpdraftCentral_Collection}
 * @see {UpdraftCentral_Queueable_Modal}
 */
function UpdraftCentral_Credentials() {
	var self = this;
	var storage;
	var $modal;
	var close_event;
	
	/**
	 * Initializes and/or checks variables or parameters
	 *
	 * @private
	 * @returns {void}
	 */
	var init = function() {
		storage = new UpdraftCentral_Collection();
		$modal = jQuery('#updraftcentral_modal_dialog');
		close_event = 'hidden.bs.modal';
	}
	init();
	
	/**
	 * Gets the credentials of the given site
	 *
	 * It automatically opens the credential's form when there's no sufficient permission to edit
	 * or upgrade one or more plugins, themes or the WP core.
	 *
	 * @param {object} site - A UpdraftCentral_Site object containing all possible information relating to the Site.
	 * @returns {string} - A serialized string representing the site's credentials in encoded format.
	 * @borrows UpdraftCentral.get_site_heading
	 * @borrows UpdraftCentral.open_modal
	 * @borrows UpdraftCentral.close_modal
	 * @borrows UpdraftCentral_Library.unserialize
	 * @borrows UpdraftCentral_Library.dialog.alert
	 */
	this.get_credentials = function(site) {
		var deferred = jQuery.Deferred();
		var $site_row = site.site_row;
		var site_id = site.id;
		
		if (storage.exists(site_id)) {
			var credentials = storage.item(site_id);
			var requests = credentials.request_filesystem_credentials || {};
			
			var show_form = false;
			var entity;
			for (var item in requests) {
				if (requests[item]) {
					show_form = true;
					entity = item;
				}
			}
			
			if (typeof credentials.site_credentials === 'undefined') {
				if (show_form) {
					var possible_credentials = UpdraftCentral.storage_get('filesystem_credentials_'+site.site_hash);
					var site_heading = UpdraftCentral.get_site_heading($site_row);

					UpdraftCentral.open_modal(udclion.updates.connection_information, UpdraftCentral.template_replace('updates-request-credentials', {
						credentials_form: credentials.filesystem_form,
						site_heading: site_heading
					}), function() {
						var save_credentials_in_browser = jQuery('#updraftcentral_modal #filesystem-credentials-save-in-browser').is(':checked');
						var site_credentials = jQuery('#updraftcentral_modal .request-filesystem-credentials-dialog-content input').serialize();
						
						validate_remote_credentials($site_row, entity, site_credentials).then(function(response) {
							credentials.site_credentials = site_credentials;
							site.site_credentials = site_credentials;
						
							if (save_credentials_in_browser) {
								site.save_credentials_in_browser = true;
							}
							
							deferred.resolve(site);
						}).fail(function(response, code, error_code) {
							UpdraftCentral_Library.dialog.alert('<h2>'+udclion.failed_credentials_heading+'</h2><p>'+udclion.failed_credentials+'</p>');
							deferred.reject(response, code, error_code);
						}).always(function() {
							$modal.off(close_event);
							UpdraftCentral.close_modal();
						});
					}, udclion.updates.update, function() {
						jQuery('#updraftcentral_modal .request-filesystem-credentials-dialog-content input[value=""]:first').focus();

						if (possible_credentials) {
							saved_credentials = UpdraftCentral_Library.unserialize(possible_credentials);
							if (saved_credentials) {
								
								jQuery.each(saved_credentials, function(index, value) {
									var type = jQuery('#updraftcentral_modal .request-filesystem-credentials-dialog-content input[name="'+index+'"]').attr('type');
									if ('text' == type || 'number' == type || 'password' == type) {
										jQuery('#updraftcentral_modal .request-filesystem-credentials-dialog-content input[name="'+index+'"]').val(value);
									} else if ('checkbox' == type) {
										if (value) {
											jQuery('#updraftcentral_modal .request-filesystem-credentials-dialog-content input[name="'+index+'"]').prop('checked', true);
										} else {
											jQuery('#updraftcentral_modal .request-filesystem-credentials-dialog-content input[name="'+index+'"]').prop('false', true);
										}
									} else if ('radio' == type) {
										jQuery('#updraftcentral_modal .request-filesystem-credentials-dialog-content input[name="'+index+'"][value="'+value+'"]').prop('checked', true);
									} else if (type) {
										console.log("UpdraftCentral: unrecognised field type in credential form: type="+type+", field index="+index);
									}
								});
								
								jQuery('#updraftcentral_modal #filesystem-credentials-save-in-browser').prop('checked', true);
							}
						}
						
						// We actually don't have any control on the form since it is a local implementation of the site WP instance, and
						// Each versions of WP may or may not have a difference in terms of form contents.
						// Thus, we're making sure we only get one "Connection Type" heading, by hiding
						// Others if there are any.
						jQuery('#updraftcentral_modal div#request-filesystem-credentials-form fieldset > legend:contains("Connection Type"):gt(0)').hide();
						
						// Here, we're listening to the close event of the modal.
						// If the user, for some reason close the modal without clicking the "Update" button
						// We return it as fail, so that the process can safely return to it's original state for
						// A fresh restart of the process (the restart is handled by the consumer of this promise object)
						$modal.on(close_event, function() {
							deferred.reject();
						});
					}, true, '', function() {
						// User clicks either the "X" or close button of the modal without
						// going into the validation process for credentials
						deferred.reject();
					});
				} else {
					deferred.reject(site);
				}
			} else {
				site.site_credentials = credentials.site_credentials;
				deferred.resolve(site);
			}
		} else {
			deferred.reject(site);
		}

		return deferred.promise();
	}
	
	/**
	 * Pre-load the credentials of the given site (single loading)
	 *
	 * @param {object} site - A UpdraftCentral_Site object containing all possible information relating to the Site.
	 * @returns {object} - A jQuery promise with the response from "get_remote_credentials" process
	 * @borrows get_remote_credentials
	 */
	this.load_credentials = function(site) {
		var deferred = jQuery.Deferred();
		var site_id = site.id;
		var $site_row = site.site_row;
		
		if (typeof site_id !== 'undefined') {
			if (storage.exists(site_id)) {
				deferred.resolve(storage.item(site_id));
			} else {
				get_remote_credentials($site_row).then(function(response) {
					storage.add(site_id, response);
					deferred.resolve(response);
				}).fail(function(response, code, error_code) {
					deferred.reject(response, code, error_code);
				});
			}
		} else {
			deferred.reject();
		}
		return deferred.promise();
	}
	
	/**
	 * Pre-load all credentials of the given sites (mass loading)
	 *
	 * Intended for bulk or mass retrieval of site credentials. Extract each site's credentials and load them into
	 * a storage which can be called and used for whatever purpose it may serve later on (e.g. mass updates, etc.).
	 *
	 * @param {array} sites - An array of UpdraftCentral_Site objects representing a Site
	 * @returns {object} - A jQuery promise with the response from "get_remote_credentials" process
	 * @borrows get_remote_credentials
	 */
	this.load_all_credentials = function(sites) {
		var deferred = jQuery.Deferred();
		var processed_sites = [];
		
		if (typeof sites !== 'undefined' && sites.length > 0) {
			for (var i=0; i < sites.length; i++) {
				var site = sites[i];
				var $site_row = site.site_row;
				
				processed_sites.push(get_remote_credentials($site_row).then(function(response) {
					var site_id = site.id;
					
					if (typeof site_id !== 'undefined') {
						storage.add(site_id, response);
					}
				}));
			}
			
			jQuery.when.apply(jQuery, processed_sites).then(function() {
				deferred.resolve();
			});
		}
		
		return deferred.promise();
	}
	
	/**
	 * Gets the credentials from the remote server
	 *
	 * @returns {object} - A jQuery promise with the response from the server
	 * @borrows {UpdraftCentral.send_site_rpc}
	 */
	var get_remote_credentials = function($site_row) {
		var deferred = jQuery.Deferred();
		
		UpdraftCentral.send_site_rpc('core.get_credentials', null, $site_row, function(response, code, error_code) {
			if (code === 'ok' && response) {
				deferred.resolve(response.data);
			} else {
				deferred.reject(response, code, error_code);
				return true;
			}
		});
		
		return deferred.promise();
	}
	
	/**
	 * Validates the newly entered credentials
	 *
	 * @returns {object} - A jQuery promise with the response from the server
	 * @borrows {UpdraftCentral.send_site_rpc}
	 */
	var validate_remote_credentials = function($site_row, entity, credentials) {
		var deferred = jQuery.Deferred();
		
		var creds = {
			entity: entity,
			filesystem_credentials: credentials
		};
		
		UpdraftCentral.send_site_rpc('core.validate_credentials', creds, $site_row, function(response, code, error_code) {
			if (code === 'ok' && !response.data.error) {
				deferred.resolve(response.data);
			} else {
				deferred.reject(response, code, error_code);
			}
		});
		
		return deferred.promise();
	}
	
}

/**
 * Site Class
 *
 * A convenient way of containing and pulling site information and passing
 * it across the code. Solely created for abstraction purposes and in preparation
 * for the mass updates process.
 *
 * @constructor
 */
function UpdraftCentral_Site($site_row) {
	var self = this;
	this.id;
	this.site_description;
	this.site_url;
	this.site_hash;
	this.site_row = $site_row;
	this.save_credentials_in_browser;
	this.site_credentials;
	this.credentials_required;
	this.automatic_backups;
	this.autobackup_options;
	this.autobackup_requested;
	this.autobackup_complete;
	this.updates;
	this.update_requests;
	this.update_processing;
	this.additional_options;
	this.mass_update;
	
	/**
	 * Initializes variables and containers.
	 *
	 * @see {UpdraftCentral_Collection}
	 * @borrows {UpdraftCentral_Library.md5}
	 */
	var init = function() {
		self.id = self.site_row.data('site_id');
		self.site_description = self.site_row.data('site_description');
		self.site_url = self.site_row.data('site_url');
		self.site_hash = UpdraftCentral_Library.md5(self.id + '_' + self.site_row.data('site_url'));
		self.save_credentials_in_browser = false;
		self.site_credentials = false;
		self.credentials_required = false;
		self.automatic_backups = false;
		self.autobackup_options = {};
		self.autobackup_requested = false;
		self.autobackup_complete = false;
		self.backup_completed = false;
		self.updates = {
			plugin: new UpdraftCentral_Collection(),
			theme: new UpdraftCentral_Collection(),
			core: new UpdraftCentral_Collection()
		};
		self.update_requests = new UpdraftCentral_Queue();
		self.update_processing = false;
		self.mass_update = false;
	}
	init();
	
	/**
	 * Gets the update information of a certain item
	 *
	 * @param {string} entity - A string representing an entity (plugin, theme, core)
	 * @param {string} key - A string identifier for an item for updates under a certain entity
	 * @returns {boolean}
	 */
	this.get_update_info = function(entity, key) {
		if (self.updates[entity].exists(key)) {
			return self.updates[entity].item(key);
		}
		return false;
	}
}

/**
 * Abstraction Class for Modal Window Implementation (with Queue-able feature)
 *
 * N.B.:
 * This isn't a new modal implementation, instead it uses the legacy modal implementation
 * and enhancing it to add a queue-able feature.
 *
 * @constructor
 * @see {UpdraftCentral_Queue}
 * @see {UpdraftCentral}
 */
function UpdraftCentral_Queueable_Modal(element) {
	var self = this;
	var close_event;
	var queue,
		listener_off = false,
		_element = element || jQuery('#updraftcentral_modal_dialog');
	
	/**
	 * Sets modal close handler/listener
	 *
	 * @private
	 * @borrows {UpdraftCentral_Queue.dequeue}
	 * @borrows {UpdraftCentral_Queue.is_empty}
	 * @borrows {UpdraftCentral_Queue.unlock}
	 * @borrows {UpdraftCentral_Queueable_Modal.open_modal}
	 * @returns {void}
	 */
	var set_modal_close_listener = function() {
		if (typeof _element !== 'undefined') {
			_element.on(close_event, function() {
				if (!queue.is_empty()) {
					var options = queue.dequeue();
					if (typeof options !== 'undefined') {
						open_modal(options);
					}
				} else {
					listener_off = true;
					_element.off(close_event);
					queue.unlock();
				}
			});
		} else {
			console.log('UpdraftCentral_Queueable_Modal: Modal element does not exist.');
		}
	}
	
	/**
	 * Initializes variable(s), queue and close listener
	 *
	 * @private
	 * @see {UpdraftCentral_Queue}
	 * @borrows {UpdraftCentral_Queueable_Modal.set_modal_close_listener}
	 * @returns {void}
	 */
	var init = function() {
		queue = new UpdraftCentral_Queue();
		close_event = 'hidden.bs.modal';
		set_modal_close_listener();
	}
	init();
	
	/**
	 * Opens or executes the legacy "open_modal" function from UpdraftCentral
	 *
	 * @private
	 * @param {object} options - An object containing the legacy arguments of the modal window.
	 * @borrows {UpdraftCentral.open_modal}
	 * @returns {void}
	 */
	var open_modal = function(options) {
		UpdraftCentral.open_modal(
			options.title,
			options.body,
			options.action_button_callback,
			options.action_button_text,
			options.pre_open_callback,
			options.sanitize_body,
			options.extra_classes
		);
	}
	
	/**
	 * Loads queued modal options/arguments from queue
	 *
	 * Basically, this will be the trigger method to load all items from queue,
	 * since closing the modal will trigger another dequeuing process.
	 *
	 * @borrows {UpdraftCentral_Queue.get_lock}
	 * @borrows {UpdraftCentral_Queue.dequeue}
	 * @borrows {UpdraftCentral_Queueable_Modal.open_modal}
	 */
	this.load = function() {
		if (!queue.is_empty() && queue.get_lock()) {
			var options = queue.dequeue();
			if (typeof options !== 'undefined') {
				open_modal(options);
			}
		}
	}
	
	/**
	 * Handles either opening a modal window immediately or queue
	 * the information (e.g. modal options/arguments) for later use.
	 *
	 * @param {object} options - An object containing the legacy arguments of the modal window.
	 * @param {boolean} enqueue - A flag that will determined if the information passed is to be queued.
	 * @borrows {UpdraftCentral_Queue.enqueue}
	 * @borrows {UpdraftCentral_Queue.is_empty}
	 * @borrows {UpdraftCentral_Queueable_Modal.set_modal_close_listener}
	 * @borrows {UpdraftCentral_Queueable_Modal.open_modal}
	 * @returns {void}
	 */
	this.open = function(options, enqueue) {
		if (typeof enqueue !== 'undefined' && enqueue) {
			if (!queue.is_locked()) {
				queue.enqueue(options);
				if (!queue.is_empty() && listener_off) {
					set_modal_close_listener();
					listener_off = false;
				}
			}
		} else {
			open_modal(options);
		}
	}
	
	/**
	 * Closes or executes the legacy "close_modal" function from UpdraftCentral
	 *
	 * @borrows {UpdraftCentral.close_modal}
	 * @returns {void}
	 */
	this.close = function() {
		UpdraftCentral.close_modal();
	}
	
	/**
	 * Gets the total count of queued items
	 *
	 * @borrows {UpdraftCentral_Queue.get_length}
	 * @returns {number} - Total count of items in the queue
	 */
	this.get_queue_item_count = function() {
		return queue.get_length();
	}
}


function UpdraftCentral_Library() {
	// Dialog methods - this is just an abstraction layer (currently onto Bootbox, http://bootboxjs.com), allowing us to easily swap to a different provider if we ever need to
	this.dialog = {};
	
	var $ = jQuery;
	/**
	 * Function to be called whenever a bootbox dialog is opened
	 * We use it simply to move the bootbox within the DOM if in fullscreen mode (because otherwise it won't be seen).
	 *
	 * @returns {void}
	 */
	var bootbox_opened = function() {
		// It only needs moving if in full-screen mode; so, we're conservative and otherwise leave it alone
		if ($.fullscreen.isFullScreen()) {
			$('.bootbox.modal').prependTo('#updraftcentral_dashboard');
		}
		// Use a new browser portal for any clicks to updraftplus.com
		$('.bootbox.modal').on('click', 'a', function(e) {
			var href = $(this).attr('href');
			redirect_updraft_website_links(href, e);
		});
		$('.bootbox.modal .updraftcentral_site_editdescription').click(function(e) {
			e.preventDefault();
			$(this).closest('.modal').modal('hide');
			open_site_configuration(UpdraftCentral.$site_row);
		});
		$('.bootbox.modal .updraftcentral_test_other_connection_methods').click(function(e) {
			e.preventDefault();
			$(this).closest('.modal').modal('hide');
			open_connection_test(UpdraftCentral.$site_row);
		});
	}
	
	/**
	 * Converts the first letter of a string to uppercase
	 *
	 * @param {string} str - A string to convert
	 * @returns {string} - Converted string
	 */
	this.ucfirst = function(str) {
		return str.charAt(0).toUpperCase() + str.slice(1);
	}
	
	/**
	 * Opens the site connection test dialog for the specified site
	 *
	 * @param {Object} $site_row - the jQuery row object for the site whose configuration is to be edited
	 * @returns {void}
	 */
	this.open_connection_test = function($site_row) {
		
		var site_url = UpdraftCentral.get_contact_url($site_row);
		var site_id = $site_row.data('site_id');
		
		var current_connection_method = $site_row.data('connection_method');
		
		if ('via_mothership_encrypting' == current_connection_method) {
			UpdraftCentral_Library.dialog.alert('<h2>'+udclion.test_connection_methods+'</h2><p>'+udclion.test_not_possible_in_current_mode+'</p>');
			// <p><a href="#" class="updraftcentral_site_editdescription">'+udclion.open_site_configuration+'...</a></p>
			return;
		}
		
		var current_method_simplified = ('direct_jquery_auth' == current_connection_method || 'direct_default_auth' == current_connection_method || 'direct_default_auth' == current_connection_method) ? 'direct' : current_connection_method;
		
		UpdraftCentral.open_modal(udclion.test_connection_methods, UpdraftCentral.template_replace('sites-connection-test', { site_url: site_url }), true, false, function() {
			
			var direct_method_can_be_attempted = true;
			if ('https:'== document.location.protocol) {
				if (site_url.substring(0, 5).toLowerCase() == 'http:') {
					direct_method_can_be_attempted = false;
				}
			}
			
			if (direct_method_can_be_attempted) {
			
				$('#updraftcentral_modal .connection-test-direct .connection-test-result').html('');
				
				UpdraftCentral.send_ajax('ping', null, $site_row, 'direct_default_auth', '#updraftcentral_modal .connection-test-direct .connection-test-result', function(response, code, error_code) {
					if (UpdraftCentral.get_debug_level() > 0) {
						console.log("Result follows for 'direct_default_auth' method:");
						console.log(response);
					}
					if ('ok' == code) {
						var new_html = '<span class="connection-test-succeeded">'+udclion.succeeded+'</span> ';
						if ('direct' == current_method_simplified) {
							new_html += udclion.current_method+' '+udclion.best_method+' '+udclion.recommend_keep;
						} else {
							new_html += udclion.best_method+' '+udclion.recommend_use+' <a href="#" class="connection-test-switch" data-site_id="'+site_id+'" data-connection_method="direct_default_auth">'+udclion.switch_to+'...</a>';
						}
						$('#updraftcentral_modal .connection-test-direct .connection-test-result').html(new_html);
					} else {
						$('#updraftcentral_modal .connection-test-direct .connection-test-result').html('<span class="connection-test-failed">'+udclion.failed+' ('+error_code+')</span>');
					}
				}, 30, false);
			
			} else {
				$('#updraftcentral_modal .connection-test-direct .connection-test-result').html(udclion.not_possible_browser_restrictions);
			}
			
			$('#updraftcentral_modal .connection-test-via_mothership .connection-test-result').html('');
			UpdraftCentral.send_ajax('ping', null, $site_row, 'via_mothership', '#updraftcentral_modal .connection-test-via_mothership .connection-test-result', function(response, code, error_code) {
				$('#updraftcentral_modal .connection-test-via_mothership .connection-test-result').html(code);
				if (UpdraftCentral.get_debug_level() > 0) {
					console.log("Result follows for 'via_mothership' method:");
					console.log(response);
				}
				if ('ok' == code) {
					var new_html = '<span class="connection-test-succeeded">'+udclion.succeeded+'</span> ';
					if ('via_mothership' != current_connection_method) {
						new_html += '<a href="#" class="connection-test-switch" data-site_id="'+site_id+'" data-connection_method="via_mothership">'+udclion.switch_to+'...</a>';
					} else {
						new_html += udclion.current_method;
					}
					$('#updraftcentral_modal .connection-test-via_mothership .connection-test-result').html(new_html);
				} else {
					
					var code_msg = error_code;
					if ('unexpected_http_code' == error_code) {
						if (null != response && response.hasOwnProperty('data') && null != response.data && response.data.hasOwnProperty('response') && response.data.response.hasOwnProperty('code')) {
							code_msg += ' - '+response.data.response.code;
						}
						if (null != response && response.hasOwnProperty('data') && null != response.data && response.data.hasOwnProperty('response') && response.data.response.hasOwnProperty('message')) {
							code_msg += ' - '+response.data.response.message;
						}
					}
					
					$('#updraftcentral_modal .connection-test-via_mothership .connection-test-result').html('<span class="connection-test-failed">'+udclion.failed+' ('+code_msg+')</span>');
				}
			}, 30, false);
			
			$('#updraftcentral_modal .connection-test-via_mothership_encrypting .connection-test-result').html('');
			UpdraftCentral.send_ajax('ping', null, $site_row, 'via_mothership_encrypting', '#updraftcentral_modal .connection-test-via_mothership_encrypting .connection-test-result', function(response, code, error_code) {
				if (UpdraftCentral.get_debug_level() > 0) {
					console.log("Result follows for 'via_mothership_encrypting' method:");
					console.log(response);
				}
				if ('ok' == code) {
					var new_html = '<span class="connection-test-succeeded">'+udclion.succeeded+'</span> ';
					if ('via_mothership_encrypting' != current_connection_method) {
						new_html += '<a href="#" class="connection-test-switch" data-site_id="'+site_id+'" data-connection_method="via_mothership_encrypting">'+udclion.switch_to+'...</a>';
					} else {
						new_html += udclion.current_method;
					}
					$('#updraftcentral_modal .connection-test-via_mothership_encrypting .connection-test-result').html(new_html);
				} else {
					var code_msg = error_code;
					if ('unexpected_http_code' == error_code) {
						if (null != response && response.hasOwnProperty('data') && null != response.data && response.data.hasOwnProperty('response') && response.data.response.hasOwnProperty('code')) {
							code_msg += ' - '+response.data.response.code;
						}
						if (null != response && response.hasOwnProperty('data') && null != response.data && response.data.hasOwnProperty('response') && response.data.response.hasOwnProperty('message')) {
							code_msg += ' - '+response.data.response.message;
						}
					}
					
					$('#updraftcentral_modal .connection-test-via_mothership_encrypting .connection-test-result').html('<span class="connection-test-failed">'+udclion.failed+' ('+code_msg+')</span>');
				}
			}, 30, false);
			
		}, true, 'modal-lg');
	}
	/**
	 * Open an alert box (as a more aesthetic alternative to the traditional browser-provided alert()).
	 *
	 * @param {string} message - the message to display in the alert box
	 * @param {dialogresultCallback} result_callback - callback function that is invoked when the alert box is closed
	 * @param {boolean} [sanitize_message=true] - whether or not to put the message through sanitize_html()
	 * @returns {void}
	 * @uses sanitize_html
	 */
	this.dialog.alert = function(message, result_callback, sanitize_message) {
		sanitize_message = ('undefined' == sanitize_message) ? true : sanitize_message;
		if (sanitize_message) {
			message = this.sanitize_html(message);
		}
		bootbox.alert(message, result_callback);
		bootbox_opened();
	}

	/**
	 * Open a confirmation box (as a more aesthetic alternative to the traditional browser-provided confirm()).
	 *
	 * @param {string} question - the message to display in the alert box
	 * @param {dialogresultCallback} result_callback - callback function that is invoked when the alert box is closed
	 * @returns {void}
	 */
	this.dialog.confirm = function(question, result_callback) {
		bootbox.confirm(question, result_callback);
		bootbox_opened();
	}

	/**
	 * Open a prompt box (as a more aesthetic alternative to the traditional browser-provided prompt()).
	 *
	 * @param {string} title - the message to display in the alert box
	 * @param {string} default_value - the default value for the user response field
	 * @param {dialogresultCallback} result_callback - callback function that is invoked when the alert box is closed
	 * @returns {void}
	 */
	this.dialog.prompt = function(title, default_value, result_callback) {
		bootbox.prompt({ title: title, value: default_value, callback: result_callback});
		bootbox_opened();
	}
	
	/**
	 * Encode to base64 encoding
	 * This (or its callers) can be swapped for atob() once IE 10 support is not desired - http://caniuse.com/#feat=atob-btoa
	 *
	 * @param {string} data - the data to base64-encode
	 * @returns {string} - the encoded data
	 */
	this.base64_encode = function(data) {
		return forge.util.encode64(data);
	}
	
	/**
	 * Calculate an MD5 hash
	 *
	 * @param {string} data - the data to hash
	 * @returns {string} - the encoded data, in hex format
	 */
	this.md5 = function(data) {
		var md = forge.md.md5.create();
		md.update(data);
		return md.digest().toHex();
	}
	
	/**
	 * Sanitizes passed HTML, so that it is safe for display. Uses Google's Caja parser.
	 *
	 * @param {string} html - the potentially suspicious HTML
	 * @returns {string} The sanitized HTML
	 */
	this.sanitize_html = function(html) {
		var web_only = function(url) { if (/^https?:\/\//.test(url)) { return url; }}
		var same_id = function(id) { return id; }
		// The html_sanitize object comes from Google's Caja
		// This version retains data- attributes. It removes style attributes (but not CSS classes)
		return html_sanitize.sanitize(html, web_only, same_id);
	}
	
	/**
	 * Quote the input, so that it is suitable for placing in HTML attributes values
	 *
	 * @see https://stackoverflow.com/questions/7753448/how-do-i-escape-quotes-in-html-attribute-values
	 *
	 * @param {string} s - The string to be quoted
	 * @param {boolean} preserveCR - if true, then \r and \n are replaced with an HTML entity; otherwise with \n
	 * @returns {string} the quoted string
	 */
	this.quote_attribute = function(s, preserveCR) {
		preserveCR = preserveCR ? '&#13;' : '\n';
		return ('' + s) /* Forces the conversion to string. */
		.replace(/&/g, '&amp;') /* This MUST be the 1st replacement. */
		.replace(/'/g, '&apos;') /* The 4 other predefined entities, required. */
		.replace(/"/g, '&quot;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		/*
		 *       You may add other replacements here for HTML only 
		 *       (but it's not necessary).
		 *       Or for XML, only if the named entities are defined in its DTD.
		 */
		.replace(/\r\n/g, preserveCR) /* Must be before the next replacement. */
		.replace(/[\r\n]/g, preserveCR);
	}
	
	/**
	 * Opens a new browser portal at the specified URL
	 *
	 * @param {Object} $site_row - jQuery object for the site row
	 * @param {Object|string|null} [redirect_to=null] - where to redirect to (defaults to the network admin)
	 * @param {Object} [spinner_where=$site_row] - jQuery object indicating where to put the site row.
	 * @returns {void}
	*/
	this.open_browser_at = function($site_row, redirect_to, spinner_where) {
		redirect_to = typeof redirect_to !== 'undefined' ? redirect_to : null;
		spinner_where = ('undefined' === typeof spinner_where) ? $site_row : spinner_where;
		UpdraftCentral.send_site_rpc('core.get_login_url', redirect_to, $site_row, function(response, code, error_code) {
			if ('ok' == code && false !== response && response.hasOwnProperty('data')) {
				var login_url = response.data.login_url;
				var win = window.open(login_url, '_blank');
				UpdraftCentral_Library.focus_window_or_error(win);
			}
		}, spinner_where);
	}
	
	/**
	 * Either focuses the window, or tells the user to check whether they have a pop-up blocker
	 *
	 * @param {Object|null} - either a window object that should have focus() called on it, or null to instead show an alert
	 * @returns {void}
	 */
	this.focus_window_or_error = function(win) {
		if ('undefined' != typeof win && null !== win) {
			win.focus();
		} else {
			this.dialog.alert('<h2>'+udclion.open_new_window+'</h2>'+udclion.window_may_be_blocked);
		}
	}
	
	/**
	 * Toggle whether or not UpdraftCentral is in "full screen" mode
	 *
	 * @returns {void}
	 */
	this.toggle_fullscreen = function() {
		// https://github.com/private-face/jquery.fullscreen
		if ($.fullscreen.isFullScreen()) {
			$('footer').show();
			$.fullscreen.exit();
			$('#updraftcentral_modal_dialog').appendTo(document.body);
		} else {
			$('footer').hide();
			$('#updraftcentral_dashboard').fullscreen({overflow: 'scroll', toggleClass: 'updraft-fullscreen' });
			$('#updraftcentral_modal_dialog').appendTo('#updraftcentral_dashboard');
		}
	}
	
	/**
	 * Reverses serialisation that was performed using jQuery's .serialize() method
	 * From: https://gist.github.com/brucekirkpatrick/7026682
	 *
	 * @param {string} serialized_string - the string to unserialize
	 * @returns {Object} - the resulting object
	 */
	this.unserialize = function(serialized_string) {
		var str = decodeURI(serialized_string);
		var pairs = str.split('&');
		var obj = {}, p, idx;
		for (var i=0, n=pairs.length; i < n; i++) {
			p = pairs[i].split('=');
			idx = p[0];
			if (obj[idx] === undefined) {
				obj[idx] = unescape(p[1]);
			} else {
				if (typeof obj[idx] == "string") {
					obj[idx] = [obj[idx]];
				}
				obj[idx].push(unescape(p[1]));
			}
		}
		return obj;
	}
	
	/**
	 * Get serialized options within a specified selector. Includes making sure that checkboxes are included when not checked.
	 *
	 * @param {string} selector - the jQuery selector to use to locate the options
	 * @returns {string} - the serialized options
	 */
	this.get_serialized_options = function(selector) {
		var form_data = $(selector).serialize();
		$.each($(selector+' input[type=checkbox]')
			.filter(function(idx) {
				return $(this).prop('checked') == false
			}),
			function(idx, el) {
				// Attach matched element names to the form_data with chosen value.
				var empty_val = '0';
				form_data += '&' + $(el).attr('name') + '=' + empty_val;
		});
		return form_data;
	}
	
	/**
	 * Allow the user to download/save a file, with contents supplied from the inner HTML of a specified element
	 *
	 * @param {string} filename - the filename that will be suggested to the user to save as
	 * @param {string} element_id - the DOM id of the element whose inner HTML is to be used as content
	 * @param {string} [mime_type='text/plain'] - the MIME type to indicate in the header sent to the browser
	 * @returns {void}
	 */
	this.download_inner_html = function(filename, element_id, mime_type) {
		mime_type = mime_type || 'text/plain';
		var element_html = document.getElementById(element_id).innerHTML;
		var link = document.body.appendChild(document.createElement('a'));
		link.setAttribute('download', filename);
		link.setAttribute('style', "display:none;");
		link.setAttribute('href', 'data:' + mime_type + ';charset=utf-8,' + encodeURIComponent(element_html));
		link.click();
	}
	
}
