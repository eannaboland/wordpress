jQuery(document).ready(function() {
	new UpdraftCentral_Updates();
});

/**
 * Updates Class for Managing Updates
 *
 * @constructor
 */
function UpdraftCentral_Updates() {
	var self = this;
	var settings_css_sub_prefix = '.updraftcentral_row_extracontents';
	var settings_css_prefix = '#updraftcentral_dashboard_existingsites '+settings_css_sub_prefix;
	var wp_org_plugin_json_api = 'https://api.wordpress.org/plugins/info/1.1/';
	var wp_org_theme_json_api = 'https://api.wordpress.org/themes/info/1.1/';

	var credentials;
	var sites;
	var debug_level = UpdraftCentral.get_debug_level();
	var uc_runners;
	var cache;
	var site_runner;
	var sites_for_backup;
	var mass_updates_processing;
	var mass_updates_loading;
	
	/**
	 * Initializes Credentials ans Sites objects
	 *
	 * @returns {void}
	 */
	var init = function() {
		credentials = new UpdraftCentral_Credentials();
		sites = new UpdraftCentral_Collection();
		uc_runners = new UpdraftCentral_Collection();
		cache = new UpdraftCentral_Collection();
		site_runner = new UpdraftCentral_Tasks_Runner({
			concurrency: 1
		});
		sites_for_backup = new UpdraftCentral_Collection();
		mass_updates_processing = false;
		mass_updates_loading = false;
	}
	init();
	
	/**
	 * Highlights the first tab
	 *
	 * @returns {void}
	 */
	var post_modal_open = function() {
		jQuery('#updraftcentral_modal ul#updates-sections-list li:first').addClass('selected');
	}
	
	/**
	 * Fetches metadata from the wordpress.org API (https://codex.wordpress.org/WordPress.org_API), or via our local cache
	 *
	 * @param {string} type - either 'plugin' or 'theme' (otherwise, results are undefined)
	 * @param {string} slug - the plugin or theme slug (i.e. not the file path)
	 * @param {*} passback - this gets passed back to the callback function
	 * @param {metadata_callback} callback - in the event of a successful retrieval, this function is called with the results
	 * @returns {void}
	 */
	function get_wporg_metadata(type, slug, passback, callback) {
		
		// Cache for 10 minutes
		var from_storage = UpdraftCentral.storage_get('wporg_api_'+type+'_'+slug, 600);
		
		if (from_storage && from_storage.hasOwnProperty('name')) {
			callback.call(this, from_storage, passback);
			return;
		}
		
		var api_url = wp_org_plugin_json_api;
		if ('theme' == type) {
			api_url = wp_org_theme_json_api;
		}
		
		jQuery.getJSON(api_url, {
			action: type+'_information',
			request: {
				slug: slug
			}
		}, function(data, status) {
			if ('success' == status) {
				UpdraftCentral.storage_set('wporg_api_'+type+'_'+slug, data, true);
				callback.call(this, data, passback);
			}
		});
		
	}
	
	/**
	 * For any plugins or themes in the passed array of objects, if they are from wordpress.org, use the wordpress.org API to fill in information about them.
	 *
	 * @param {Object} $site_row - the jQuery object for the site
	 * @param {array} objects - an array of plugin or theme update objects
	 * @param {string} type - either 'plugin' or 'theme', according to which type of objects has been passed
	 * @param {Object} $container - An optional jQuery object used primarily for mass update info retrieval
	 * @returns {void}
	 */
	function fill_wporg_metadata($site_row, objects, type, $container) {
		
		for (var i=0, j=objects.length; i<j; i++) {
			var object = objects[i];
			if (object && object.hasOwnProperty('update') && object.update.hasOwnProperty('package') && object.update.package) {
				var url = object.update.package;
				if ('string' != typeof url) { continue; }
				var is_wp_org = url.match(/^https?:\/\/((downloads|www)\.)?wordpress\.org\//);
				if (is_wp_org) {
					
					if ('plugin' == type) {
						get_wporg_metadata(type, object.update.slug, object, function(data, object) {
							if (data && data.hasOwnProperty('sections')) {
								
								var $the_update = $site_row.find('.updraftcentral_row_extracontents .updates-plugin-update.updates-update[data-plugin-file="'+object.update.plugin+'"]');
								if (mass_updates_loading && typeof $container !== 'undefined') {
									$the_update = $container.find('.row.update-item[data-plugin-file="'+object.update.plugin+'"][data-website_id="'+$site_row.data('site_id')+'"]');
								}
								var existing_data = $the_update.data('plugin-info');
								
								if (!existing_data) { return; }
								if (!existing_data.update.hasOwnProperty('sections') || !existing_data.update.sections) { existing_data.update.sections = {} };
								
								if (data.sections.hasOwnProperty('changelog')) {
									existing_data.update.sections.changelog = data.sections.changelog;
								}
								if (data.sections.hasOwnProperty('description')) {
									existing_data.update.sections.description = data.sections.description;
								}
								
								$the_update.attr('data-plugin-info', JSON.stringify(existing_data));
							}
						});
					} else if ('theme' == type) {
						get_wporg_metadata(type, object.update.theme, object, function(data, object) {
							if (data && data.hasOwnProperty('sections')) {
								
								var $the_update = $site_row.find('.updraftcentral_row_extracontents .updates-theme-update.updates-update[data-theme="'+object.update.theme+'"]');
								if (mass_updates_loading && typeof $container !== 'undefined') {
									$the_update = $container.find('.row.update-item[data-theme="'+object.update.theme+'"][data-website_id="'+$site_row.data('site_id')+'"]');
								}
								var existing_data = $the_update.data('theme-info');
								
								if (!existing_data) { return; }
								if (data.sections.hasOwnProperty('changelog')) {
									if (!existing_data.update.hasOwnProperty('sections') || !existing_data.update.sections) { existing_data.update.sections = {} };
									existing_data.update.sections.changelog = data.sections.changelog;
								}
								
								$the_update.attr('data-theme-info', JSON.stringify(existing_data));
							}
						});
					}
					
				}
			}
		}
		
	}
	
	/**
	 * A helper method used to check if the updraftcentral notice
	 * container is currently empty.
	 *
	 * N.B.: This method was created to fix an issue where the error notices/messages
	 * as a result of the update process are not displayed when after the automatic backup process.
	 *
	 * @param {object} $container - A jQuery object used to represent the notice container
	 * @returns {object} - A jQuery promise object
	 */
	function empty_container($container) {
		var deferred = jQuery.Deferred();
		
		var interval = setInterval(function() {
			if (jQuery.trim($container.html()).length < 1) {
				clearInterval(interval);
				deferred.resolve(true);
			}
		}, 1000);
		
		// If for some reason, the container maintains its
		// content (meaning, it didn't cleared up after a 10 seconds window)
		// then we're going to force to clear the interval in order not to leave
		// the promise subscriber(s) hanging.
		setTimeout(function() {
			clearInterval(interval);
			deferred.reject(false);
		}, 10000);
		
		return deferred.promise();
	}
	
	/**
	 * Reports an error when updating something
	 *
	 * @param {Object} entity - the update object returned from the remote call
	 * @param {Object} $site_row - the jQuery object for the affected site
	 * @param {Object} $update_row - the jQuery object for the relevant update
	 * @param {Object} entity_info - the object with information about the updatable entity
	 * @returns {void}
	 */
	function update_error(entity, $site_row, $update_row, entity_info) {
		
		var site_id = $site_row.data('site_id');
		var site = sites.item(site_id);
		
		if (debug_level > 0) {
			console.log("UpdraftCentral: update error (follows)");
			console.log(entity);
		}
		
		$update_row.find('.update-go').show();
		$update_row.find('.update-in-progress').hide();
		
		var site_description = site.site_description;
		var site_url = site.site_url;
		
		if (site_description == site_url) { site_description = ''; }
		
		var messages = '';
		if (entity.hasOwnProperty('messages')) {
			jQuery(entity.messages).each(function(ind, message) {
				messages += message+"\n";
			});
		}
		
		if (debug_level > 0) {
			if ('unable_to_connect_to_filesystem' == entity.error) {
				console.log("UpdraftCentral: unable_to_connect_to_filesystem: filesystem credentials apparently wrong; will clear");
			} else {
				console.log("UpdraftCentral: update failed: will clear filesystem credentials in case they were wrong");
			}
		}
		
		site.update_processing = false;
		site.site_credentials = false;
		sites.update(site_id, site);
		
		var error_message;
		if (!entity.hasOwnProperty('error_message') || '' == entity.error_message) {
			
			if (udclion.updates.update_error_messages.hasOwnProperty(entity.error)) {
				error_message = udclion.updates.update_error_messages[entity.error];
			} else {
				error_message = udclion.updates.update_error_messages.update_failed;
				if (entity.error != 'update_failed') { error_message += ' ('+entity.error+')'; }
			}
		} else {
			error_message = entity.error_message;
		}
		
		// If an existing container for this site exists, then we add the information in there, instead of creating a new one.
		var $notice_container = jQuery('#updraftcentral_notice_container');
		var $existing_notice = jQuery('#updraftcentral_notice_container > .updraftcentral_notice[data-site_id="'+site_id+'"]:first');
		
		empty_container($notice_container).then(function() {
			$existing_notice = UpdraftCentral.add_dashboard_notice(
				UpdraftCentral.template_replace('updates-update-error-container', {
					site_url: site_url,
					site_description: site_description
				}),
				'error',
				false,
				{ site_id: site_id }
			);
		}).always(function() {
			$existing_notice.find('.update-errors').append(
				UpdraftCentral.template_replace('updates-update-error', {
					error_message: error_message,
					error: entity.error,
					messages: messages,
					entity_info: entity_info,
					entity: entity
				})
			);
		});
		
	}
	
	/**
	 * Preloads Update Informations of Items that needs updating and
	 * the current Site Credentials respectively.
	 *
	 * @param {object} site - An UpdraftCentral_Site object representing the current site for processing.
	 * @borrows {UpdraftCentral_Library.md5}
	 * @borrows {UpdraftCentral_Credentials.load_credentials}
	 * @returns {void}
	 */
	function load_site_updates(site) {
		
		// Preparing initial state of updates. This is to ensure
		// we don't have any phantom entries that will cause some issues
		// when the show updates button is clicked or is triggered again.
		site.updates.plugin.clear();
		site.updates.theme.clear();
		site.updates.core.clear();
		
		jQuery('.updraftcentral_row_extracontents button.update-go').each(function() {
			var $container = jQuery(this).closest('.row.update-item');
			var entity = $container.data('entity');
			var name = $container.data('name');
			var info = $container.data(entity + '-info');

			if ((entity !== 'core' && (!info || !info.hasOwnProperty('update'))) || (entity === 'core' && (!info || !info.hasOwnProperty('version')))) {
				return;
			}
	
			var is_mysql = true;
			if (info.hasOwnProperty('installed') && info.installed.hasOwnProperty('is_mysql') && !info.installed.is_mysql) {
				is_mysql = false;
			}
			
			if (info.hasOwnProperty('sufficient')) {
				var mysql_sufficient = (!is_mysql || info.sufficient.mysql);
				var php_sufficient = info.sufficient.php;
				if (!mysql_sufficient) {
					if (!php_sufficient) {
						mysql_error = '<h2>'+udclion.updates.cannot_update+'</h2>'+sprintf(udclion.updates.insufficient_php_and_mysql, info.version, info.php_version, info.mysql_version, info.installed.php, info.installed.mysql);
					} else {
						mysql_error = '<h2>'+udclion.updates.cannot_update+'</h2>'+sprintf(udclion.updates.insufficient_mysql, info.version, info.mysql_version, info.installed.mysql);
					}
				} else if (!php_sufficient) {
					mysql_error = '<h2>'+udclion.updates.cannot_update+'</h2>'+sprintf(udclion.updates.insufficient_php, info.version, info.php_version, info.installed.php);
				}
			}

			if ('undefined' === typeof name || !name || !name.length) {
				switch (entity) {
					case 'plugin':
					case 'theme':
						name = info.update[entity];
						break;
					case 'core':
						name = udclion.updates.wordpress;
						break;
					default:
						break;
				}
			}
			
			if ('undefined' !== typeof name && name && name.length) {
				var details = {};
				var errors = false;

				switch (entity) {
					case 'plugin':
						details.plugin = info.update.plugin;
						details.slug = info.update.slug;
						details.label = info.name;
						details.name = name;
						details.old_version = info.version;
						details.new_version = info.update.new_version;

						if (!details.plugin || !details.plugin.length || !details.slug || !details.slug.length) errors = true;
						break;
					case 'theme':
						details.theme = info.update.theme;
						details.label = info.name;
						details.name = name;
						details.old_version = info.version;
						details.new_version = info.update.new_version;

						if (!details.theme || !details.theme.length) errors = true;
						break;
					case 'core':
						if (typeof mysql_error !== 'undefined') {
							details.mysql_error = mysql_error;
						}
						details.core = info.version;
						details.label = name;
						details.name = name;
						details.old_version = info.installed.version;
						details.new_version = info.version;

						if (!details.core || !details.core.length) errors = true;
						break;
					default:
						break;
				}
				
				if (!errors && details && details.hasOwnProperty('name') && details.name) {
					var key = UpdraftCentral_Library.md5(site.id+'_'+details.name);
					details.entity = entity;
					site.updates[entity].add(key, details);
				} else {
					if (debug_level > 0) {
						console.log("UpdraftCentral: load_site_updates(): update ("+entity+") without expected info (details follow)");
						console.log(details);
					}
				}
			}
		});
		
		// Loads Remote Site Credentials
		credentials.load_credentials(site).then(function(response) {
			var requests = response.request_filesystem_credentials;
			var credentials_required = false;
			
			for (var entity in requests) {
				if (requests[entity]) {
					credentials_required = true;
				}
			}
			
			// Update site information from sites collection
			site.credentials_required = credentials_required;
			sites.update(site.id, site);
			
			if (debug_level > 0) {
				console.log("UpdraftCentral: remote site credentials has been loaded");
			}
		});
	}
	
	/**
	 * Processes automatic backup before doing the update(s)
	 *
	 * @param {object} site - An UpdraftCentral_Site object containing the current site
	 *                        information needed by the process.
	 * @param {object} progress - An UpdraftCentral_Task_Progress object from the current task runner instance
	 * @borrows {UpdraftCentral_Module_UpdraftPlus.backupnow_go}
	 * @returns {void}
	 */
	function process_auto_backup(site, progress) {

		// Sets current backup status
		if (mass_updates_processing) {
			progress.set_custom_status(udclion.updates.backup_currently_running_for + ' ' + site.site_description);
		} else {
			progress.set_custom_status(udclion.updates.backup_currently_running);
		}

		var autobackup_requested = site.hasOwnProperty('autobackup_requested') && site.autobackup_requested;
		if (autobackup_requested) {
			var autobackup_complete = site.hasOwnProperty('autobackup_complete') && site.autobackup_complete;
			if (!autobackup_complete) {
				if (debug_level > 0) {
					console.log("UpdraftCentral: automatic pre-upgrade backup was already requested, but is not yet complete");
				}
			} else {
				if (debug_level > 0) {
					console.log("UpdraftCentral: automatic pre-upgrade backup was already requested, and is complete");
				}
			}
		} else {
			if (debug_level > 0) {
				console.log("UpdraftCentral: automatic pre-upgrade backup indicated - will request");
			}
			
			// Add backup properties/flag
			site.autobackup_requested = true;
			site.autobackup_complete = false;
			
			// Update site information from sites collection
			sites.update(site.id, site);
			
			// Check and prepare what to backup
			var only_these_file_entities = '';
			if (site.updates.plugin.count()) {
				only_these_file_entities = 'plugins';
			}
			
			if (site.updates.theme.count()) {
				only_these_file_entities = (only_these_file_entities) ? only_these_file_entities + ',themes' : 'themes';
			}
			
			if (site.updates.core.count()) {
				only_these_file_entities = (only_these_file_entities) ? only_these_file_entities + ',wpcore' : 'wpcore';
			}
			
			extra_data = {
				_listener_title: '<h2>' + site.site_description + ' - ' + udclion.updates.automatic_backup + '</h2>'
			}

			// Setting the current site row manually, as it will
			// be called by the backup process.
			UpdraftCentral.set_current_site_row(site.site_row);

			UpdraftCentral_Module_UpdraftPlus.backupnow_go(false, false, false, only_these_file_entities, extra_data, udclion.updates.automatic_backup);
		}
	}
	
	/**
	 * Function called by the task runner for processing an item for update/upgrade
	 *
	 * N.B.: Not to be called directly but by the UpdraftCentral_Tasks_Runner instance, since we're using
	 * the d3 queue library to run each tasks (for a site-wide updates).
	 *
	 * @param {object} update_info - The update information to be sent to the server for processing
	 * @param {object} site - An UpdraftCentral_Site instance containing information of the current Site to process.
	 * @param {object} uc_runner - An UpdraftCentral_Tasks_Runner instance primarily used as a context for the current process.
	 *							   It is automatically added by the UpdraftCentral_Tasks_Runner class.
	 * @returns {object} - A jQuery promise object
	 */
	function process_update_info(update_info, site, uc_runner) {
		var deferred = jQuery.Deferred();

		site.additional_options = {
			progress_bar: uc_runner.progress,
			update_info: update_info,
			items_count: uc_runner.tasks_count()
		}

		run_process(site).then(function(result) {
			deferred.resolve(result);
		}).fail(function(result) {
			deferred.reject(result);
		});

		return deferred.promise();
	}

	/**
	 * Runs the process of updating/upgrading an item
	 *
	 * @param {object} site - An UpdraftCentral_Site instance representing the current Site to process.
	 * @uses {UpdraftCentral_Updates#send_remote_updates}
	 * @returns {object} - A jQuery promise object
	 */
	function run_process(site) {
		var deferred = jQuery.Deferred();
		var progress_bar = site.additional_options.progress_bar;
		var update_info = site.additional_options.update_info;

		// Set the current label of the currently processed item.
		// It uses the following display format: "Processing {label} ..."
		// If you want to use your own label, you can set the second argument "use_custom"
		// to true, and anything you put as a label will use instead.
		if (mass_updates_processing) {
			progress_bar.set_current_label(update_info.name + ' (' + site.site_description + ')');
		} else {
			progress_bar.set_current_label(update_info.name);
		}
		
		// We make sure that we will only continue if we have the
		// the needed credentials to proceed.
		//
		// NOTE: If we don't have a valid credentials yet, the credential form
		// will keep popping until we extract a valid creds to be used during the
		// update process. Allowing the user to enter the correct credentials if he or she
		// misses it the first time.
		if (!site.site_credentials && site.credentials_required) {

			// Updates the site.site_credentials with the actual credentials
			// for the current site
			credentials.get_credentials(site).then(function(response) {

				// If we now have a valid credentials, we copy the relevant fields/flags
				// to the current site before we proceed with the process.
				site.site_credentials = response.site_credentials;
				site.save_credentials_in_browser = response.save_credentials_in_browser;
				
				// Re-run updates now that we already have a valid credentials to use
				run_process(site).then(function(result) {
					deferred.resolve(result);
				}).fail(function(result) {
					if (mass_updates_processing) {
						// We need to return this area as "resolve"
						// but with a "skip" response to true, so that the overall process can continue with the
						// rest of the websites currently being queued. Otherwise, the entire process will be aborted
						// when 1 website fails (D3 Queue Library feature).
						deferred.resolve({
							skip: true,
							response: udclion.failed_credentials,
							site: site.site_description
						});
					} else {
						deferred.reject(result);
					}
				});
				
			}).fail(function(response) {
				// We need to return this area as "resolve"
				// but with a "skip" response to true, so that the overall process can continue with the
				// rest of the websites currently being queued. Otherwise, the entire process will be aborted
				// when 1 website fails (D3 Queue Library feature).
				deferred.resolve({
					skip: true,
					response: udclion.failed_credentials,
					site: site.site_description
				});
			});
			
		} else {

			// Starts the progress bar routine.
			progress_bar.start();

			// Send Update Request to the Server:
			send_remote_updates(site, update_info).then(function(result) {

				// Calling the update method of the progress bar will signal
				// that the current item being processed has been completed, thus,
				// re-evaluating and re-calculating the actual progress percentage.
				progress_bar.update();

				
				deferred.resolve(result);
				
			}).fail(function(result) {

				progress_bar.update();

				// We're letting the whole process to continue even if an item failed to update, so that
				// the rest of the items will proceed as scheduled.
				deferred.resolve({
					skip: true,
					item: true,
					response: update_info,
					site: site.site_description
				});

			});
		}

		return deferred.promise();
	}

	/**
	 * Sends Update Request to the Remote Server
	 *
	 * @param {object} site - An UpdraftCentral_Site object containing the current site
	 *                        information needed by the process.
	 * @see {UpdraftCentral_Site}
	 * @borrows {UpdraftCentral.send_site_rpc}
	 * @borrows {UpdraftCentral.storage_set}
	 * @borrows {UpdraftCentral_Updates.update_error}
	 * @returns {object} - A jQuery promise object
	 */
	function send_remote_updates(site, update_info) {
		var deferred = jQuery.Deferred();
		var $site_row = site.site_row;
		var uc_updates = {};
		var $container = jQuery('#updates_container div.updraftcentral_table > .tbody');
		var count = site.additional_options.items_count,
			default_timeout = 90,
			max_timeout = 400,
			timeout = count * default_timeout;

		// We need to limit or set a maximum timeout in place,
		// otherwise, the timeout result from the computation above
		// will go beyond the desired timeout that we intended to
		// especially when the user has around 50 or 100+ updates to run.
		//
		// You can adjust the above default_timeout and max_timeout to your
		// preferrable values whenever it is applicable.
		if (timeout > max_timeout) timeout = max_timeout;

		// Make sure to remove the mysql_error field
		// before sending the request to the server. This field
		// isn't needed for the update request.
		if (typeof update_info.mysql_error !== 'undefined') {
			delete update_info['mysql_error'];
		}
		
		switch (update_info.entity) {
			case 'plugin':
				uc_updates.plugins = [{
					plugin: update_info.plugin,
					slug: update_info.slug
				}];
				break;
			case 'theme':
				uc_updates.themes = [{
					theme: update_info.theme
				}];
				break;
			case 'core':
				uc_updates.core = [{
					core: update_info.core
				}];
				timeout += default_timeout * 5;
				break;
			default:
				break;
		}
		
		if (site.site_credentials) {
			uc_updates.meta = {
				filesystem_credentials: site.site_credentials
			}
		}
		
		UpdraftCentral.send_site_rpc('updates.do_updates', uc_updates, $site_row, function(response, code, error_code) {
			
			if ('ok' == code && response) {
				var any_successes = false;
				var any_errors = false;
				
				jQuery(response.data.plugins).each(function(index, plugin) {
					
					var plugin_file = plugin.plugin;
					var $update_row = $site_row.find('.updraft_updates_output .updates-plugin-update[data-plugin-file="'+plugin_file+'"]');
					if (mass_updates_processing) {
						$update_row = $container.find('.row.update-item.updates-plugin-update[data-plugin-file="'+plugin_file+'"][data-website_id="' + site.id + '"]');
					}
					var entity_info = $update_row.data('plugin-info');
					
					if (plugin.hasOwnProperty('error')) {
						any_errors = true;
						update_error(plugin, $site_row, $update_row, entity_info);
					} else {
						any_successes = true;
						if (debug_level > 0 && plugin.hasOwnProperty('messages')) {
							console.log(plugin.messages)
						}
						$update_row.slideUp('slow', function() {
							$update_row.remove();
						});
					}
					
				});
				
				jQuery(response.data.themes).each(function(index, theme) {
					var theme_slug = theme.theme;
					var $update_row = $site_row.find('.updraft_updates_output .updates-theme-update[data-theme="'+theme_slug+'"]');
					if (mass_updates_processing) {
						$update_row = $container.find('.row.update-item.updates-theme-update[data-theme="'+theme_slug+'"][data-website_id="' + site.id + '"]');
					}
					var entity_info = $update_row.data('theme-info');

					if (theme.hasOwnProperty('error')) {
						any_errors = true;
						update_error(theme, $site_row, $update_row, entity_info);
					} else {
						any_successes = true;
						if (debug_level > 0 && theme.hasOwnProperty('messages')) {
							console.log(theme.messages)
						}
						$update_row.slideUp('slow', function() {
							$update_row.remove();
						});
					}
				});
				
				jQuery(response.data.core).each(function(index, core) {
					var $update_row = $site_row.find('.updraft_updates_output .updates-core-update');
					if (mass_updates_processing) {
						$update_row = $container.find('.row.update-item.updates-core-update[data-website_id="' + site.id + '"]');
					}
					var entity_info = $update_row.data('core-info');
					entity_info.name = udclion.updates.wordpress;

					if (core.hasOwnProperty('error')) {
						any_errors = true;
						update_error(core, $site_row, $update_row, entity_info);
					} else {
						any_successes = true;
						if (debug_level > 0 && core.hasOwnProperty('messages')) {
							console.log(core.messages)
						}
						$update_row.slideUp('slow', function() {
							$update_row.remove();
						});
					}
				});
				
				if (any_successes && !any_errors && site.save_credentials_in_browser) {
					UpdraftCentral.storage_set('filesystem_credentials_'+site.site_hash, site.site_credentials, true);
				}

				// We're making sure that we're returning the promise object in
				// order not to leave the subscriber of this promise object hanging, thus, allowing
				// it to continue with other pending process.
				if (any_errors) {
					deferred.reject(response);
				} else {
					deferred.resolve(response);
				}

			} else {
				// Error: still want to reset UI state
				var errors = [];

				if (uc_updates.hasOwnProperty('plugins')) {
					jQuery(uc_updates.plugins).each(function(index, plugin) {
						var plugin_file = plugin.plugin;
						var $update_row = $site_row.find('.updraft_updates_output .updates-plugin-update[data-plugin-file="'+plugin_file+'"]');
						if (mass_updates_processing) {
							$update_row = $container.find('.row.update-item.updates-plugin-update[data-plugin-file="'+plugin_file+'"][data-website_id="' + site.id + '"]');
						}
						var entity_info = $update_row.data('plugin-info');
						plugin.error = 'update_failed';
						update_error(plugin, $site_row, $update_row, entity_info);
						errors.push({
							entity_info: entity_info,
							error: plugin.error
						});
					});
				}
				if (uc_updates.hasOwnProperty('themes')) {
					jQuery(uc_updates.themes).each(function(index, theme) {
						var theme_slug = theme.theme;
						var $update_row = $site_row.find('.updraft_updates_output .updates-theme-update[data-theme="'+theme_slug+'"]');
						if (mass_updates_processing) {
							$update_row = $container.find('.row.update-item.updates-theme-update[data-theme="'+theme_slug+'"][data-website_id="' + site.id + '"]');
						}
						var entity_info = $update_row.data('theme-info');
						theme.error = 'update_failed';
						update_error(theme, $site_row, $update_row, entity_info);
						errors.push({
							entity_info: entity_info,
							error: theme.error
						});
					});
				}
				if (uc_updates.hasOwnProperty('core')) {
					jQuery(uc_updates.core).each(function(index, core) {
						var $update_row = $site_row.find('.updraft_updates_output .updates-core-update');
						if (mass_updates_processing) {
							$update_row = $container.find('.row.update-item.updates-core-update[data-website_id="' + site.id + '"]');
						}
						var entity_info = $update_row.data('core-info');
						entity_info.name = udclion.updates.wordpress;
						core.error = 'update_failed';
						update_error(core, $site_row, $update_row, entity_info);
						errors.push({
							entity_info: entity_info,
							error: core.error
						});
					});
				}

				// Return errors
				deferred.reject(errors);
			}
		}, null, timeout);

		return deferred.promise();
	}
	
	/**
	 * Updates the process button state (proxy button)
	 *
	 * @param {object} uc_runner - An UpdraftCentral_Tasks_Runner instance of the current request.
	 * @param {boolean} processing - An optional flag that indicates that the update process is currently
	 *								 running. Thus, changing the button's state accordingly for the
	 *								 processing purpose.
	 * @returns {void}
	 */
	function update_button_state(uc_runner, processing) {
		var btn_update_all = jQuery('.updraftcentral_row_extracontents button#btn-update-all');
		button_state_update(btn_update_all, uc_runner, processing);
	}

	/**
	 * Updates the process button state for mass update process (proxy button)
	 *
	 * @param {object} uc_runner - An UpdraftCentral_Tasks_Runner instance of the current request.
	 * @param {boolean} processing - An optional flag that indicates that the update process is currently
	 *								 running. Thus, changing the button's state accordingly for the
	 *								 processing purpose.
	 * @returns {void}
	 */
	function mass_update_button_state(uc_runner, processing) {
		var btn_update_all = jQuery('.updraftcentral_row_extracontents button#btn-mass-update');
		button_state_update(btn_update_all, uc_runner, processing);
	}

	/**
	 * Updates the process button state
	 *
	 * @param {object} uc_runner - An UpdraftCentral_Tasks_Runner instance of the current request.
	 * @param {boolean} processing - An optional flag that indicates that the update process is currently
	 *								 running. Thus, changing the button's state accordingly for the
	 *								 processing purpose.
	 * @returns {void}
	 */
	function button_state_update(btn_update_all, uc_runner, processing) {
		var count = uc_runner.tasks_count();
		var update_text, btn_text;

		if (typeof processing !== 'undefined' && processing) {
			btn_update_all.addClass('disabled');
			btn_text = udclion.updates.updates_in_progress;
		} else {
			if (count > 0) {
				btn_update_all.removeClass('disabled');
			} else {
				btn_update_all.addClass('disabled');
			}

			update_text = (count == 1) ? udclion.updates.queued_update : udclion.updates.queued_updates;
			btn_text = '<span class="dashicons dashicons-controls-play"></span> ' + udclion.updates.process + ' ' + update_text + ' (' + count + ')';
		}

		btn_update_all.html(btn_text);
	}

	/**
	 * Resets the updates process (buttons, cache, runners, etc.)
	 *
	 * @param {object} site - An UpdraftCentral_Site object containing the current site
	 *                        information needed by the process.
	 * @param {string} abort_message - An optional message that indicates whether the reset
	 *								   was called due to an error or due to a normal completion.
	 * @returns {void}
	 */
	function reset_updates_process(site, abort_message) {
		var uc_runner = uc_runners.item(site.id);
		if (typeof uc_runner !== 'undefined') {
			if (typeof abort_message !== 'undefined') {
				uc_runner.progress.abort(abort_message);
			}

			// Clear all tasks to give room for a new process.
			uc_runner.clear_tasks();
			uc_runners.update(site.id, uc_runner);
			
			// Clear task_key cache
			cache.clear();

			// Reset processing status
			site.update_processing = false;
			if (typeof sites !== 'undefined') {
				sites.update(site.id, site);
			}

			// Update button state:
			update_button_state(uc_runner);

			// Restoring the buttons to their initial states
			jQuery('.updraftcentral_row_extracontents button.update-go').removeClass('disabled').show();
			jQuery('.updraftcentral_row_extracontents button.update-in-progress').removeClass('disabled').hide();

			// We're giving the user a two seconds window before completely removing
			// the progress var from view.
			setTimeout(function() {
				// Reset the progress bar to its original state
				uc_runner.progress.reset();
			}, 2000);
		}
	}

	/**
	 * Preloads Update Informations of Items that needs updating and
	 * the current Site Credentials respectively.
	 *
	 * @param {object} site - An UpdraftCentral_Site object representing the current site for processing.
	 * @param {object} output - A jQuery object/element that contains the items for update for the current site.
	 *
	 * @borrows {UpdraftCentral_Library.md5}
	 * @borrows {UpdraftCentral_Credentials.load_credentials}
	 * @returns {object} - A jQuery promise object.
	 */
	function preload_site_updates_credentials(site, output) {
		var deferred = jQuery.Deferred();

		// Preparing initial state of updates. This is to ensure
		// we don't have any phantom entries that will cause some issues
		// when the show updates button is clicked or is triggered again.
		site.updates.plugin.clear();
		site.updates.theme.clear();
		site.updates.core.clear();

		// Make sure we don't show the nodes to the user, as we're doing these
		// process in the background.
		var html = jQuery('<table/>', {
						style: 'display:none;'
					}).html(output);


		html.find('.row.update-item').each(function() {
			var $container = jQuery(this);
			var entity = $container.data('entity');
			var name = $container.data('name');
			var info = $container.data(entity + '-info');

			if ((entity !== 'core' && (!info || !info.hasOwnProperty('update'))) || (entity === 'core' && (!info || !info.hasOwnProperty('version')))) {
				return;
			}
	
			var is_mysql = true;
			if (info.hasOwnProperty('installed') && info.installed.hasOwnProperty('is_mysql') && !info.installed.is_mysql) {
				is_mysql = false;
			}
			
			if (info.hasOwnProperty('sufficient')) {
				var mysql_sufficient = (!is_mysql || info.sufficient.mysql);
				var php_sufficient = info.sufficient.php;
				if (!mysql_sufficient) {
					if (!php_sufficient) {
						mysql_error = '<h2>'+udclion.updates.cannot_update+'</h2>'+sprintf(udclion.updates.insufficient_php_and_mysql, info.version, info.php_version, info.mysql_version, info.installed.php, info.installed.mysql);
					} else {
						mysql_error = '<h2>'+udclion.updates.cannot_update+'</h2>'+sprintf(udclion.updates.insufficient_mysql, info.version, info.mysql_version, info.installed.mysql);
					}
				} else if (!php_sufficient) {
					mysql_error = '<h2>'+udclion.updates.cannot_update+'</h2>'+sprintf(udclion.updates.insufficient_php, info.version, info.php_version, info.installed.php);
				}
			}

			if ('undefined' === typeof name || !name || !name.length) {
				switch (entity) {
					case 'plugin':
					case 'theme':
						name = info.update[entity];
						break;
					case 'core':
						name = udclion.updates.wordpress;
						break;
					default:
						break;
				}
			}
			
			if ('undefined' !== typeof name && name && name.length) {
				var details = {};
				var errors = false;

				switch (entity) {
					case 'plugin':
						details.plugin = info.update.plugin;
						details.slug = info.update.slug;
						details.label = info.name;
						details.name = name;
						details.old_version = info.version;
						details.new_version = info.update.new_version;

						if (!details.plugin || !details.plugin.length || !details.slug || !details.slug.length) errors = true;
						break;
					case 'theme':
						details.theme = info.update.theme;
						details.label = info.name;
						details.name = name;
						details.old_version = info.version;
						details.new_version = info.update.new_version;

						if (!details.theme || !details.theme.length) errors = true;
						break;
					case 'core':
						if (typeof mysql_error !== 'undefined') {
							details.mysql_error = mysql_error;
						}
						details.core = info.version;
						details.label = name;
						details.name = name;
						details.old_version = info.installed.version;
						details.new_version = info.version;

						if (!details.core || !details.core.length) errors = true;
						break;
					default:
						break;
				}
				
				if (!errors && details && details.hasOwnProperty('name') && details.name) {
					var key = UpdraftCentral_Library.md5(site.id+'_'+details.name);
					
					details.entity = entity;
					site.updates[entity].add(key, details);
				} else {
					if (debug_level > 0) {
						console.log("UpdraftCentral: preload_site_updates_credentials(): update ("+entity+") without expected info (details follow)");
						console.log(details);
					}
				}
			}
		});
		
		// Loads Remote Site Credentials
		credentials.load_credentials(site).then(function(response) {
			var requests = response.request_filesystem_credentials;
			var credentials_required = false;
			
			for (var entity in requests) {
				if (requests[entity]) {
					credentials_required = true;
				}
			}
			
			// Update site information from sites collection
			site.credentials_required = credentials_required;
			sites.update(site.id, site);
			
			if (debug_level > 0) {
				console.log("UpdraftCentral: remote site credentials has been loaded");
			}

			deferred.resolve({
				site: site,
				response: response
			});
		}).fail(function(response) {
			deferred.reject(response);
		});

		return deferred.promise();
	}


	/**
	 * Loads items for update from a given site
	 *
	 * N.B.: Not to be called directly but by the UpdraftCentral_Tasks_Runner instance.
	 *
	 * @param {object} $site_row - A jQuery object representing the currently processed site.
	 * @param {object} $container - A jQuery object that holds the container of the mass updates area/form.
	 * @param {object} uc_runner - An UpdraftCentral_Tasks_Runner instance primarily used as a context for the current process.
	 *							   It is automatically added by the UpdraftCentral_Tasks_Runner class.
	 * @returns {object} - A jQuery promise object
	 */
	function load_updates($site_row, $container, uc_runner) {
		var deferred = jQuery.Deferred();
		var progress_bar = uc_runner.progress;
		var update_options = {
			force_refresh: false
		}
		
		if (jQuery(this).hasClass('updraftcentral_updates_force_check')) {
			update_options.force_refresh = true;
		}

		// Set the current label of the currently processed item.
		// It uses the following display format: "Processing {label} ..."
		// If you want to use your own label, you can set the second argument "use_custom"
		// to true, and anything you put as a label will use instead.
		progress_bar.set_current_label(udclion.updates.loading_updates_from + ' "' + $site_row.data('site_description') + '"...', true);


		// Starts the progress bar routine.
		progress_bar.start();

		
		UpdraftCentral.send_site_rpc('updates.get_updates', update_options , $site_row, function(response, code, error_code) {
			if ('ok' == code && response && 'updates' == UpdraftCentral.get_dashboard_mode()) {
				var site_id = $site_row.data('site_id');
				var site = new UpdraftCentral_Site($site_row);

				if (sites.exists(site_id)) {
					site = sites.item(site_id);
				}

				var template = '',
					output = '',
					entities = {
						plugins: null,
						themes: null,
						core: null
					};
				
				if (response.data) {

					if (response.data.hasOwnProperty('plugins') && response.data.plugins.length) {
						entities.plugins = UpdraftCentral.template_replace('updates-plugin-mass-updates', { plugins: response.data.plugins, website: site.site_description, website_id: site.id, host_url: site.site_url });
						output += entities.plugins;
					}
					
					if (response.data.hasOwnProperty('themes') && response.data.themes.length) {
						entities.themes = UpdraftCentral.template_replace('updates-theme-mass-updates', { themes: response.data.themes, website: site.site_description, website_id: site.id, host_url: site.site_url });
						output += entities.themes;
					}
					
					if (response.data.hasOwnProperty('core') && response.data.core.length) {
						entities.core = UpdraftCentral.template_replace('updates-core-mass-updates', { core: response.data.core, website: site.site_description, website_id: site.id, host_url: site.site_url });
						output += entities.core;
					}
					
					if (response.data.hasOwnProperty('meta')) {
						if (typeof response.data.meta.automatic_backups !== 'undefined') {
							site.automatic_backups = response.data.meta.automatic_backups;
						}
					}
				}
				
				if (entities.plugins || entities.themes || entities.core) {

					var output_container = $container.find('.updraft_updates_output');
					var option = jQuery('<option/>', {
						value: site.site_description
					});

					output = UpdraftCentral_Library.sanitize_html(output);
					option.html(site.site_description);
					// output_container.find('select[name="uc_updates_filter_website"]').append(option);

					
					// Add Site to Sites Collection:
					if (!sites.exists(site_id)) sites.add(site.id, site);
					
					// Preload Site Updates
					preload_site_updates_credentials(site, output).then(function(result) {

						// Calling the update method of the progress bar will signal
						// that the current item being processed has been completed, thus,
						// re-evaluating and re-calculating the actual progress percentage.
						progress_bar.update();

						// Add item as we load them.
						if (!$container.find('div.updraftcentral_table').is(':visible')) {
							$container.find('div.updraftcentral_table').show();
						}
						$container.find('div.updraftcentral_table > .tbody').append(output);
						$container.find('div.updraftcentral_table > .tbody input[name="uc_updates_check_item"]').attr('disabled', true);

						// Show entity counts:
						var $mass_container = jQuery('div.updates_table_container.mass_updates');
						var plugin_count = $mass_container.find('.row.update-item[data-entity="plugin"]:visible').length,
							theme_count = $mass_container.find('.row.update-item[data-entity="theme"]:visible').length,
							core_count = $mass_container.find('.row.update-item[data-entity="core"]:visible').length;
							
						$mass_container.find('.filter-elements span.filter_plugin_count').html(plugin_count);
						$mass_container.find('.filter-elements span.filter_theme_count').html(theme_count);
						$mass_container.find('.filter-elements span.filter_core_count').html(core_count);

						if (typeof response.data !== 'undefined') {
							if (typeof response.data.plugins !== 'undefined' && response.data.plugins.length) {
								fill_wporg_metadata($site_row, response.data.plugins, 'plugin', $container.find('div.updraftcentral_table > .tbody'));
							}
							if (typeof response.data.themes !== 'undefined' && response.data.themes.length) {
								fill_wporg_metadata($site_row, response.data.themes, 'theme', $container.find('div.updraftcentral_table > .tbody'));
							}
						}

						deferred.resolve({
							output: output,
							output_container: output_container,
							response: result,
							skip: false
						});
					}).fail(function(result) {

						// Now, that we updated the UpdraftCentral.send_site_rpc() to return generic error
						// as fail to the callback function, therefore, we need to return this area as "resolve"
						// but with a "skip" response to true, so that the overall process can continue with the
						// rest of the websites currently being queued. Otherwise, the entire process will be aborted
						// when 1 website fails (D3 Queue Library feature).
						deferred.resolve({
							skip: true,
							response: result,
							site: $site_row.data('site_description')
						});

					});


				} else {

					// Don't return this as "reject" or error, if no update items are returned for plugin, theme
					// and core meaning that the site is up to date. Thus, we're sending it back
					// as "resolve" or success, to let the process continue without aborting the entire process.
					deferred.resolve({
						skip: true,
						response: udclion.updates.no_updates,
						site: $site_row.data('site_description')
					});
				}

			} else {

				// Same reason as above, we let the process continue with the rest of the
				// queued websites waiting to be processed.
				deferred.resolve({
					skip: true,
					response: (typeof response.error !== 'undefined') ? response.error : response,
					site: $site_row.data('site_description')
				});

				// Here, we're sending a response to the callback call from UpdraftCentral.send_site_rpc()
				// that we will be handling the error in this call.
				return true;
			}

		}, null, 90);


		return deferred.promise();
	}

	/**
	 * Sorts the update items by order selected
	 *
	 * @returns {void}
	 */
	function process_sort_action() {
		var sort_raw = jQuery('#updates_container select[name="uc_updates_sort"]').val();
		
		var matches = sort_raw.match(/^(.*)_(asc|desc)$/);

		if (null === matches) { return; }

		var sort = matches[1];
		var sort_order = matches[2];
		
		var $container = jQuery('#updates_container div.updraftcentral_table > .tbody');
		var $items = $container.find('.row.update-item');

		$items.sort(function (a, b) {
			var contentA = jQuery(a).data(sort).toString().toLowerCase();
			var contentB = jQuery(b).data(sort).toString().toLowerCase();

			if (sort_order === 'desc') {
				return (contentB < contentA) ? -1 : (contentB > contentA) ? 1 : 0;
			} else {
				return (contentA < contentB) ? -1 : (contentA > contentB) ? 1 : 0;
			}
		});

		$container.html($items);
	}

	/**
	 * Filters the updates items by filtered action selected
	 *
	 * @returns {void}
	 */
	function process_filter_action() {
		// var website = jQuery('#updates_container select[name="uc_updates_filter_website"] option:selected').val();
		var keyword = jQuery('#updates_container input[name="uc_updates_filter_keyword"]').val().toLowerCase();
		var $container = jQuery('#updates_container div.updraftcentral_table');
		var entities = [];
		
		jQuery('.row.update-item').hide();
		jQuery('#updates_container .filter-elements input.uc_updates_filter_type:checked').each(function() {
			var filter = jQuery(this);
			entities.push(filter.val());
		});
		
		if (entities.length) {
			for (var i=0; i<entities.length; i++) {
				var type = entities[i];
				if (typeof website !== 'undefined' && website.length) {
					jQuery('.row.update-item[data-entity="' + type + '"][data-website="' + website + '"]').show();
				} else {
					jQuery('.row.update-item[data-entity="' + type + '"]').show();
				}
			}
		}

		if (keyword.length > 0) {
			jQuery('.row.update-item').each(function() {
				var update_item = jQuery(this);

				if (typeof update_item !== 'undefined') {
					if (update_item.is(':visible')) {
						var entity = update_item.data('entity') || '';
						var name = update_item.data('name') || '';
						var website = update_item.data('website') || '';
						var installed_version = update_item.data('installed_version') || '';
						var new_version = update_item.data('new_version') || '';

						if (entity.toLowerCase().indexOf(keyword) !== -1 || name.toLowerCase().indexOf(keyword) !== -1 || website.toLowerCase().indexOf(keyword) !== -1 || installed_version.toString().indexOf(keyword) !== -1 || new_version.toString().indexOf(keyword) !== -1) {
							update_item.show();
						} else {
							update_item.hide();
						}
					}
				}
			});
		}

	}

	/**
	 * Paginates the update items result (to minimize vertical space)
	 *
	 * N.B. - Pagination is done by manipulating the resulting DOM elements
	 *		  to avoid additional round trips to the server since we're loading
	 * 		  every update items for each sites.
	 *
	 * @returns {void}
	 */
	function paginate() {
		var $container = jQuery('#updates_container div.updraftcentral_table');
		var $item_container = jQuery('#updates_container div.updraftcentral_table > .tbody');
		var paginator = $container.find('span.uc_updates_paginator');

		if (paginator.length) {
			var current_page = parseInt(cache.item('current_page'));
			var items_per_page = parseInt(cache.item('items_per_page'));
			var items = cache.item('sorted_items') || [];
			var pages = parseInt(items.length / items_per_page);
			var remainder = parseInt(items.length % items_per_page);
			var total_pages = (remainder > 0) ? pages + 1 : pages;

			var start_index = (current_page - 1) * items_per_page;
			var end_index = current_page * items_per_page;
			var page_items = items.slice(start_index, end_index);


			if (page_items.length) {
				// Display filtered, sorted items from the
				// current page.

				jQuery('.row.update-item').hide();
				for (var i=0; i<page_items.length; i++) {
					var item = page_items[i];
					var name = item.data('name');
					var website = item.data('website');

					jQuery('.row.update-item[data-name="' + name + '"][data-website="' + website + '"]').show();
				}
			}

			var previous = jQuery('<a/>', {
				id: 'load_previous',
				href: 'javascript://'
			}).html(udclion.updates.previous);

			var next = jQuery('<a/>', {
				id: 'load_next',
				href: 'javascript://'
			}).html(udclion.updates.next);


			if ((current_page > 1) && page_items.length) {
				previous.removeClass('disabled');
			} else {
				previous.addClass('disabled');
			}

			if ((current_page < total_pages) && page_items.length) {
				next.removeClass('disabled');
			} else {
				next.addClass('disabled');
			}

			paginator.html(jQuery('<div/>').append(previous.clone()).html() + ' | ' + jQuery('<div/>').append(next.clone()).html());
			if (total_pages > 1) {
				paginator.show();
			} else {
				paginator.hide();
			}
			
			if (jQuery('.row.update-item:visible').length > 0) {
				if (!mass_updates_processing) {
					$container.find('input[name="uc_updates_check_all"]').removeAttr('disabled');
				}
				$item_container.find('div#no_matching_items').remove();
			} else {
				if ($container.find('div#no_matching_items').length == 0) {
					if (!mass_updates_processing) {
						$container.find('input[name="uc_updates_check_all"]').attr('disabled', true);
					}

					var no_matching_items = jQuery('<div id="no_matching_items" class="row"><div class="col-md-12">' + udclion.updates.no_matching_items + '</div></div>');
					$item_container.append(no_matching_items);
				}
			}
		}

	}

	/**
	 * Moves to the next page of the update items result
	 *
	 * @see {UpdraftCentral_Updates.paginate}
	 * @returns {void}
	 */
	function load_next() {
		var current_page = parseInt(cache.item('current_page'));

		cache.update('current_page', current_page + 1);
		paginate();
	}

	/**
	 * Moves to the previous page of the update items result
	 *
	 * @see {UpdraftCentral_Updates.paginate}
	 * @returns {void}
	 */
	function load_previous() {
		var current_page = parseInt(cache.item('current_page'));

		cache.update('current_page', current_page - 1);
		paginate();
	}

	/**
	 * Fascade method for controlling and maintaining the ui elements
	 * of the mass update interface.
	 *
	 * @borrows {UpdraftCentral_Updates.paginate}
	 * @borrows {UpdraftCentral_Updates.check_selected_updates}
	 * @returns {void}
	 */
	function process_sort_filter_actions() {
		
		process_filter_action();
		process_sort_action();

		var $container = jQuery('#updraftcentral_dashboard_existingsites #updates_container');
		var $item_container = $container.find('div.updraftcentral_table > .tbody');
		var $mass_container = jQuery('div.updates_table_container.mass_updates');
		var plugin_count = 0,
			theme_count = 0,
			core_count = 0;
		
		var sorted_items = [];
		$item_container.find('div.updates-update').each(function() {
			var item = jQuery(this);
			
			if (item.is(':visible')) {
				var entity = item.data('entity');
				if ('plugin' === entity) plugin_count++;
				if ('theme' === entity) theme_count++;
				if ('core' === entity) core_count++;
				
				sorted_items.push(item);
			}
		});

		if (!cache.exists('sorted_items')) {
			cache.add('sorted_items', sorted_items);
		} else {
			cache.update('sorted_items', sorted_items);
		}

		// When triggering a sort and filter action we always reset
		// the current_page to the first page to avoid confusion.
		cache.update('current_page', 1);
		paginate();

		// Refresh current selections to update queue content basing
		// on the current filtered action.
		check_selected_updates();
		
		// Update entity counts:
		$mass_container.find('.filter-elements span.filter_plugin_count').html(plugin_count);
		$mass_container.find('.filter-elements span.filter_theme_count').html(theme_count);
		$mass_container.find('.filter-elements span.filter_core_count').html(core_count);
	}

	/**
	 * Handles the item selection and adding them for processing
	 *
	 * @borrows {UpdraftCentral_Library.md5}
	 * @borrows {UpdraftCentral_Updates.mass_update_button_state}
	 * @returns {void}
	 */
	function check_selected_updates() {
		var selected = 0;
		
		// Making sure that we start with empty tasks.
		site_runner.clear_tasks();

		// Initially clears backup list
		sites_for_backup.clear();


		var sorted_items = (cache.exists('sorted_items')) ? cache.item('sorted_items') : [];
		for (var i=0; i<sorted_items.length; i++) {
			var $update_row = sorted_items[i];
			var update_item = $update_row.find('input[name="uc_updates_check_item"]');
			var site_id = $update_row.data('website_id');
			var site = sites.item(site_id);

			if (typeof site !== 'undefined') {
				if (update_item.is(':checked')) {
					var entity = $update_row.data('entity');
					var name = $update_row.data('name');

					if ('undefined' !== typeof name && name.length) {
						var key = UpdraftCentral_Library.md5(site.id+'_'+name);
						var update_info = site.get_update_info(entity, key);
						if (update_info) {

							var task_key = site_runner.add_task(process_update_info, [update_info, site]);
							if (task_key) {
								if (debug_level > 0) {
									console.log('Item queued for processing:');
									console.log(update_info);
								}

								// Add site for backup processing later if automatic backup
								// is set for the site and it hasn't been backed up yet.
								if (site.automatic_backups && !site.autobackup_complete) {
									if (!sites_for_backup.exists(site.id)) {
										sites_for_backup.add(site.id, site);
									}
								}

								selected++;
							} else {
								// To avoid confusion, we unchecked the previously checked/clicked
								// checkbox if we fail to queue the item.
								update_item.removeAttr('checked');
							}

						} else {
							// Unchecked if we fail to retrieve a valid update info for the item.
							update_item.removeAttr('checked');
						}
					} else {
						// Unchecked if we don't have a valid key to use to pull the item's update info.
						update_item.removeAttr('checked');
					}
				}
			}

		}


		// Update mass update button state
		mass_update_button_state(site_runner);


		if (selected > 0) {
			jQuery('#updates_container button#btn-mass-update').removeClass('disabled');
		} else {
			jQuery('#updates_container button#btn-mass-update').addClass('disabled');
		}
	}

	/**
	 * Resets the mass updates process (buttons, cache, runners, etc.)
	 *
	 * @param {object} options - An object containing options needed to reset the ui.
	 * @param {string} abort_message - An optional message that indicates whether the reset
	 *								   was called due to an error or due to a normal completion.
	 * @returns {void}
	 */
	function reset_mass_loading_process(options, abort_message) {
		if (typeof options.site_runner !== 'undefined') {
			if (typeof abort_message !== 'undefined') {
				options.site_runner.progress.abort(abort_message);
			}

			// After a successful run, we clear all tasks to give
			// room for a new process.
			options.site_runner.clear_tasks();

			// Initialize starting cache variables:
			var current_page = 1,
				items_per_page = 50;

			if (!cache.exists('current_page')) {
				cache.add('current_page', current_page);
			} else {
				cache.update('current_page', current_page);
			}

			if (!cache.exists('items_per_page')) {
				cache.add('items_per_page', items_per_page);
			} else {
				cache.update('items_per_page', items_per_page);
			}

			// Reset mass updates loading flag
			mass_updates_loading = false;

			// Enable reload button
			options.container.find('button#btn-reload-updates').removeClass('disabled');


			if (typeof options.has_non_skipped_items !== 'undefined' && !options.has_non_skipped_items) {
				options.container.find('div.updraftcentral_table > .thead').hide();
				options.site_runner.progress.reset();
			} else {
				// Re-enable the form elements.
				options.form_container.find('input, select').removeAttr('disabled');
				options.container.find('div.updraftcentral_table > .tbody input[name="uc_updates_check_item"]').each(function() {
					var item = jQuery(this);
					var unavailable = item.data('unavailable');

					if ('undefined' !== typeof unavailable && unavailable) {
						item.prop('disabled', true);
					} else {
						item.prop('disabled', false);
					}
				});

				// Re-enable sort and filter fields:
				// Sort and filter with default parameters initially.
				process_sort_filter_actions();

				// We're giving the user a two seconds window before completely removing
				// the progress var from view.
				setTimeout(function() {
					// Reset the progress bar to its original state
					options.site_runner.progress.reset();
				}, 2000);
			}

			
		}
	}

	/**
	 * Handles and controls the backup process of all the sites
	 * that was set to run an automatic backup before update
	 *
	 * @params {object} button - A jQuery object representing the button that triggered the action
	 * @param {object} progress - An UpdraftCentral_Task_Progress object from the current task runner instance
	 * @borrows {UpdraftCentral_Updates.process_auto_backup}
	 * @returns {void}
	 */
	function process_sites_backup(button, progress) {

		if (sites_for_backup.count() === 0) {
			if (debug_level > 0) {
				console.log('UpdraftCentral_Updates: process_site_backup - All sites backup has been processed. Proceeding to mass updates now.');
			}

			// Sets current backup status
			progress.set_custom_status(udclion.updates.backup_done);

			setTimeout(function() {
				// Proceed with the pending mass updates process by triggering
				// the same button from which it was initially triggered.
				button.trigger('click');
			}, 2000);

		} else {
			var items = sites_for_backup.get_items();
			if (items.length) {
				var site = items[0];

				site.autobackup_options = {
					caller: process_sites_backup,
					mass_updates: true,
					args: [button, progress]
				};
				process_auto_backup(site, progress);
			}
		}
	}


	/**
	 * Registers all available row clickers and listeners for this tab
	 *
	 * @see {@link http://api.jquery.com/on}
	 */
	jQuery('#updraftcentral_dashboard_existingsites').on('updraftcentral_dashboard_mode_set_updates', function() {

		/**
		 * Executes the load previous feature (move to previous page)
			 *
		 * @see {UpdraftCentral.register_event_handler}
		 * @borrows {UpdraftCentral_Updates.load_previous}
		 */
		UpdraftCentral.register_event_handler('click', '#updates_container div.updraftcentral_table span.uc_updates_paginator a#load_previous', function() {
			if (!jQuery(this).hasClass('disabled')) {
				load_previous();
			}
		});

		/**
		 * Executes the load next feature (move to next page)
		 *
		 * @see {UpdraftCentral.register_event_handler}
		 * @borrows {UpdraftCentral_Updates.load_next}
		 */
		UpdraftCentral.register_event_handler('click', '#updates_container div.updraftcentral_table span.uc_updates_paginator a#load_next', function() {
			if (!jQuery(this).hasClass('disabled')) {
				load_next();
			}
		});

		/**
		 * Handles the sorting and filtering actions from the selected choices
		 *
		 * N.B. - Basically, this triggers the method that handles all the
		 *		  the needed ui changes.
		 *
		 * @see {UpdraftCentral.register_event_handler}
		 * @borrows {UpdraftCentral_Updates.process_sort_filter_actions}
		 */
		UpdraftCentral.register_event_handler('change', '#updates_container select[name="uc_updates_sort"], #updates_container input.uc_updates_filter_type, #updates_container select[name="uc_updates_filter_website"]', function() {
			process_sort_filter_actions();
		});

		/**
		 * Filter the items for update by the entered keyword
		 *
		 * N.B. - Basically, this triggers the method that handles all the
		 *		  the needed ui changes.
		 *
		 * @see {UpdraftCentral.register_event_handler}
		 * @borrows {UpdraftCentral_Updates.process_sort_filter_actions}
		 */
		UpdraftCentral.register_event_handler('keyup', '#updates_container input[name="uc_updates_filter_keyword"]', function() {
			process_sort_filter_actions();
		});

		/**
		 * Process all available items for update
		 *
		 * @see {UpdraftCentral.register_event_handler}
		 * @borrows {UpdraftCentral_Updates.mass_update_button_state}
		 * @borrows {UpdraftCentral_Updates.process_sites_backup}
		 * @borrows {UpdraftCentral_Updates.process_sort_filter_actions}
		 */
		UpdraftCentral.register_event_handler('click', '#updates_container button#btn-mass-update', function() {
			if (!jQuery(this).hasClass('disabled') || (sites_for_backup.count() === 0 && site_runner.tasks_count() && !mass_updates_loading)) {
				var button = jQuery(this);
				var $container = jQuery('div.updates_table_container.mass_updates');

				if (debug_level > 0) {
					console.log('Mass updates execution started...');
				}

				// Setting mass updates processing flag
				mass_updates_processing = true;
				
				// Update button with "Updates in progress" state:
				mass_update_button_state(site_runner, true);
				
				// We're preventing user here to dequeue any tasks when the process
				// is already running.
				jQuery('div.updates_table_container.mass_updates').find('input, select, button#btn-reload-updates').attr('disabled', true);
				
				var progress_bar_container = $container.find('div.progress-section div.progress-bar');
				site_runner.progress.set_container(progress_bar_container);
				
				// Backup Process: (if autobackup is set)
				// We make sure we only call the autobackup process once for the given session.
				if (sites_for_backup.count() > 0) {
					process_sites_backup(button, site_runner.progress);
				} else {
					
					site_runner.process_tasks().then(function(result) {
						if (debug_level > 0) {
							console.log('Mass updates execution has been completed!');
						}

						var message = '<h2>'+udclion.updates.error_items_header+' ('+udclion.updates.skipped+')</h2>';
						var item;
						var error_items = [];
						for (var i=0; i<result.length; i++) {
							item = result[i];
							if (typeof item.skip !== 'undefined' && item.skip) {
								if ('undefined' !== typeof item.item && item.item) {
									var info = item.response;
									error_items.push({
										label: info.label,
										version: info.old_version,
										site: item.site
									});
								} else {
									UpdraftCentral.add_dashboard_notice_singleton(message + item.response + ' - ' + item.site, 'error', 30000, {}, 'errors');
								}
							}
						}

						if (error_items.length) {
							for (var i=0; i<error_items.length; i++) {
								var error = error_items[i];
								message += '<div>'+sprintf('%s (%s) - %s.', error.label, error.version, error.site)+'</div>';
							}

							UpdraftCentral.add_dashboard_notice_singleton(message, 'error', 30000, {}, 'error_items');
						}

						// Manually set the progress bar to complete.
						site_runner.progress.set_complete();
						site_runner.clear_tasks();

						// Restore original (default) UI states
						mass_update_button_state(site_runner);
						$container.find('input, select, button#btn-reload-updates').each(function() {
							var item = jQuery(this);
							var unavailable = item.data('unavailable');

							if ('undefined' !== typeof unavailable && unavailable) {
								item.prop('disabled', true);
							} else {
								item.prop('disabled', false);
							}
						});

						// Unsetting mass updates processing flag
						mass_updates_processing = false;

						jQuery('#updates_container input[name="uc_updates_check_all"]').removeAttr('checked');
						jQuery('#updates_container input[name="uc_updates_check_item"]').removeAttr('checked');


						// Check whether we still have valid update items to process.
						// Applicable only on successful process.
						setTimeout(function() {
							// Reset the progress bar to its original state
							site_runner.progress.reset();

							// Refresh entries after successful process and removal
							// of update items. This is to ensure that the ui/paging won't break if some
							// items were skipped.
							process_sort_filter_actions();
							

							var $tbody = $container.find("div.updraftcentral_table > .tbody");
							if ($tbody.find('div.updates-update').length < 1) {
								$container.find('div.updraftcentral_table > .thead').hide();
								if ($tbody.find('div#no_matching_items').length > 0) {
									$tbody.find('div#no_matching_items').remove();
								}
								$tbody.append('<div class="row"><div class="col-md-12"><h5>' + udclion.updates.no_available_updates + '</h5></div></div>');
							}
						}, 3000);

					}).fail(function(result) {
						if (debug_level > 0) {
							console.log('Mass updates execution has stopped due to the following error(s):');
							console.log(result);
						}

						site_runner.progress.abort(udclion.updates.process_aborted);
						site_runner.clear_tasks();


						// Restore original (default) UI states
						mass_update_button_state(site_runner);
						jQuery('div.updates_table_container.mass_updates').find('input, select, button#btn-reload-updates').each(function() {
							var item = jQuery(this);
							var unavailable = item.data('unavailable');

							if ('undefined' !== typeof unavailable && unavailable) {
								item.prop('disabled', true);
							} else {
								item.prop('disabled', false);
							}
						});

						// Unsetting mass updates processing flag
						mass_updates_processing = false;

						jQuery('#updates_container input[name="uc_updates_check_all"]').removeAttr('checked');
						jQuery('#updates_container input[name="uc_updates_check_item"]').removeAttr('checked');

						// Re-enable sort and filter when error occurs.
						process_sort_filter_actions();


						// We're giving the user a two seconds window before completely removing
						// the progress var from view.
						setTimeout(function() {
							// Reset the progress bar to its original state
							site_runner.progress.reset();
						}, 2000);

					});
				}
				
			}
		});

		/**
		 * Restart the loading process
		 *
		 * @see {UpdraftCentral.register_event_handler}
		 */
		UpdraftCentral.register_event_handler('click', '#updates_container #btn-reload-updates', function() {
			if (!jQuery(this).hasClass('disabled')) {
				jQuery(document).find('button.updraftcentral_action_show_all_updates').trigger('click');
			}
		});

		/**
		 * Select and checks all items
		 *
		 * @see {UpdraftCentral.register_event_handler}
		 * @borrows {UpdraftCentral_Updates.check_selected_updates}
		 */
		UpdraftCentral.register_event_handler('change', '#updates_container input[name="uc_updates_check_all"]', function() {
			var checked = false;
			if (jQuery(this).is(':checked')) { checked = true; }
			
			jQuery('#updates_container input[name="uc_updates_check_item"]').each(function() {
				jQuery(this).prop('checked', checked);
			});

			check_selected_updates();
		});

		/**
		 * Select and checks a single item
		 *
		 * @see {UpdraftCentral.register_event_handler}
		 * @borrows {UpdraftCentral_Updates.check_selected_updates}
		 */
		UpdraftCentral.register_event_handler('change', '#updates_container input[name="uc_updates_check_item"]', function() {
			check_selected_updates();
		});

		/**
		 * Opens a modal window showing a much more
		 * detailed information about the item.
		 *
		 * @see {UpdraftCentral.register_event_handler}
		 * @borrows {UpdraftCentral_Library.ucfirst}
		 */
		UpdraftCentral.register_event_handler('click', '.updraftcentral_row_extracontents button.update-info', function() {
			var $container = jQuery(this).closest('.row.update-item');
			var entity = $container.data('entity');
			
			var info = $container.data(entity + '-info');
			if (!info) {
				if (debug_level > 0) {
					console.log(UpdraftCentral_Library.ucfirst(entity) + ' info not found');
				}
				return;
			}
			
			UpdraftCentral.open_modal(udclion.updates.update_info, UpdraftCentral.template_replace('updates-' + entity + '-update-info', info), true, false, post_modal_open);
		});

		/**
		 * Loads all updates from all the sites registered on this UpdraftCentral plugin instance
		 *
		 * @see {UpdraftCentral.register_event_handler}
		 * @borrows {UpdraftCentral_Updates.reset_mass_loading_process}
		 */
		UpdraftCentral.register_event_handler('click', '#updraftcentral_updraftplus_actions > button.updraftcentral_action_show_all_updates', function() {

			// Mass update is non site specific. Thus, we hide all sites and only reference
			// it in the background to execute the needed actions.
			jQuery('#updraftcentral_sites_search_area, #updraftcentral_dashboard_existingsites .updraftcentral_site_row, #updraftcentral_dashboard_existingsites .updraftcentral_row_divider').hide();

			var $existing_sites = jQuery('#updraftcentral_dashboard_existingsites');

			// Load Initial Template:
			var $container = $existing_sites.find('#updates_container');
			if ($container.length === 0) {
				$container = jQuery('<div/>', {
					id: 'updates_container',
					class: 'updraftcentral_row_extracontents'
				});

				$existing_sites.append($container);
			}


			var template = UpdraftCentral.template_replace('updates-table-mass-header', {});
			$container.html('<div class="updraft_updates_output updraft_module_output">' + template + '</div>');


			// Clear process cache
			cache.clear();


			// Making sure that we start with empty tasks, in case the
			// "Show Updates For All Sites" button is triggered more than once.
			site_runner.clear_tasks();


			$existing_sites.find('.updraftcentral_site_row').each(function() {
				var $site_row = jQuery(this);
				site_runner.add_task(load_updates, [$site_row, $container]);
			});


			// Disable reload button while the loading updates
			// process is in progress.
			$container.find('button#btn-reload-updates').addClass('disabled');

			// Reset original website options:
			// $container.find('select[name="uc_updates_filter_website"] option:gt(0)').remove();


			// Disabled sort and filter fields while loading updates is on-going:
			var $form_container = $container.find('div.updates_table_container.mass_updates');
			$form_container.find('input, select').attr('disabled', true);


			// Set mass updates loading flag
			mass_updates_loading = true;


			site_runner.progress.set_container($form_container.find('div.progress-section div.progress-bar'));
			site_runner.process_tasks().then(function(result) {
				if (debug_level > 0) {
					console.log('Tasks execution has been completed!');
				}

				var item,
					has_non_skipped_items = false;

				for (var i=0; i<result.length; i++) {
					item = result[i];
					if (typeof item.skip !== 'undefined' && !item.skip) {
						has_non_skipped_items = true;
					} else {
						if (debug_level > 0) {
							if (typeof item.site !== 'undefined') {
								console.log(item.site + ' has been skipped due to the following reason or error:');
								console.log(item);
							}
						}
					}
				}

				if (!has_non_skipped_items) {
					if (!$container.find('div.updraftcentral_table').is(':visible')) {
						$container.find('div.updraftcentral_table').show();
					}
					$container.find('div.updraftcentral_table > .tbody').append('<div class="row"><div class="col-md-12"><h5>' + udclion.updates.no_available_updates + '</h5></div></div>');
				}

				// Set progress bar to complete.
				site_runner.progress.set_complete(udclion.updates.loading_process_completed);

				
				reset_mass_loading_process({
					site_runner: site_runner,
					container: $container,
					form_container: $form_container,
					has_non_skipped_items: has_non_skipped_items
				});

			}).fail(function(result) {
				if (debug_level > 0) {
					console.log('Tasks execution has stopped due to the following error(s):');
					console.log(result);
				}

				reset_mass_loading_process({
					site_runner: site_runner,
					container: $container,
					form_container: $form_container
				}, udclion.updates.abort);

			});

		});

		// @codingStandardsIgnoreLine
		/**
		 * @see {UpdraftCentral.register_modal_listener}
		 */
		UpdraftCentral.register_modal_listener('ul#updates-sections-list a.updates-section-link', function(e) {
			e.preventDefault();
			var section = jQuery(this).data('section');
			jQuery('#updraftcentral_modal #updates-sections-list li.selected').removeClass('selected');
			jQuery(this).closest('li').addClass('selected');
			jQuery('#updraftcentral_modal .updates-section').hide();
			jQuery('#updraftcentral_modal #updates-section-'+section).show();
		});
		
		// @codingStandardsIgnoreLine
		/**
		 * @see {UpdraftCentral.register_modal_listener}
		 */
		UpdraftCentral.register_modal_listener('.request-filesystem-credentials-dialog-content #ssh', function () {
			jQuery("#updraftcentral_modal .request-filesystem-credentials-dialog-content #ssh_keys").show();
		});
		
		// @codingStandardsIgnoreLine
		/**
		 * @see {UpdraftCentral.register_modal_listener}
		 */
		UpdraftCentral.register_modal_listener('.request-filesystem-credentials-dialog-content #ftp, .request-filesystem-credentials-dialog-content #ftps', function () {
			jQuery("#updraftcentral_modal .request-filesystem-credentials-dialog-content #ssh_keys").hide();
		});
		
		/**
		 * Starts the update process for all available
		 * items for update or an upgrade using the UpdraftCentral_Tasks_Runner.
		 *
		 * @see {UpdraftCentral.register_row_clicker}
		 * @borrows {UpdraftCentral_Tasks_Runner.add_task}
		 * @borrows {UpdraftCentral_Tasks_Runner.process_tasks}
		 */
		UpdraftCentral.register_row_clicker('.updraftcentral_row_extracontents button#btn-update-all', function($site_row) {
			var site = sites.item($site_row.data('site_id'));
			var uc_runner = uc_runners.item(site.id);
			
			if (!jQuery(this).hasClass('disabled') || (site.autobackup_complete && !site.update_processing && uc_runner.tasks_count())) {
				var button = jQuery(this);

				if (debug_level > 0) {
					console.log('Task runner execution started...');
				}
				
				// Update button with "Updates in progress" state:
				update_button_state(uc_runner, true);
				
				// We're preventing user here to dequeue any tasks when the process
				// is already running.
				jQuery('.updraftcentral_row_extracontents button.update-go').addClass('disabled');
				jQuery('.updraftcentral_row_extracontents button.update-in-progress').addClass('disabled');

				uc_runner.progress.set_container(jQuery(this).parent());
				
				// Backup Process: (if autobackup is set)
				// We make sure we only call the autobackup process once for the given session.
				if (site.automatic_backups && !site.autobackup_complete) {
					site.autobackup_options = {
						caller: button,
						bypass: false
					};
					process_auto_backup(site, uc_runner.progress);
				} else {

					var timeout = 0;
					if (site.autobackup_complete && site.autobackup_options.hasOwnProperty('bypass') && !site.autobackup_options.bypass) {
						// Sets current backup status
						uc_runner.progress.set_custom_status(udclion.updates.backup_done);

						// Set bypass to true to avoid showing the notice again once the backup process already completed
						site.autobackup_options.bypass = true;

						// Add two seconds delay to display the message properly. Otherwise, it will
						// jump straight to the below code block.
						timeout = 2000;
					}
					
					setTimeout(function() {
						// Update processing status:
						site.update_processing = true;
						sites.update(site.id, site);
						
						
						uc_runner.process_tasks().then(function(result) {
							if (debug_level > 0) {
								console.log('Tasks execution has been completed!');
							}

							var message = '<h2>'+udclion.updates.error_items_header+' ('+udclion.updates.skipped+')</h2>';
							var item;
							var error_items = [];
							for (var i=0; i<result.length; i++) {
								item = result[i];
								if (typeof item.skip !== 'undefined' && item.skip) {
									if ('undefined' !== typeof item.item && item.item) {
										var info = item.response;
										error_items.push({
											label: info.label,
											version: info.old_version,
											site: item.site
										});
									} else {
										UpdraftCentral.add_dashboard_notice_singleton(message + item.response + ' - ' + item.site, 'error', 30000, {}, 'errors');
									}
								}
							}

							if (error_items.length) {
								for (var i=0; i<error_items.length; i++) {
									var error = error_items[i];
									message += '<div>'+sprintf('%s (%s) - %s.', error.label, error.version, error.site)+'</div>';
								}

								UpdraftCentral.add_dashboard_notice_singleton(message, 'error', 30000, {}, 'error_items');
							}

							// Manually set the progress bar to complete.
							uc_runner.progress.set_complete();

							// Restore original (default) UI states
							reset_updates_process(site);

							// Check whether we still have valid update items to process.
							// Applicable only on successful process.
							setTimeout(function() {
								var $tbody = $site_row.find(".updates_table_container .tbody");
								if ($tbody.children().length < 1) {
									$tbody.closest('.updates_table_container').remove();
									$site_row.find('.updraft_updates_output').append("<h5>" + udclion.updates.no_updates + "</h5>");
								}
							}, 3000);

						}).fail(function(result) {
							if (debug_level > 0) {
								console.log('Tasks execution has stopped due to the following error(s):');
								console.log(result);
							}

							// Restore original (default) UI states with abort message.
							reset_updates_process(site, udclion.updates.process_aborted);
						});
					}, timeout);
				}
				
			}
		});
	
		/**
		 * Starts the update process for each individual
		 * items available for update or an upgrade.
		 *
		 * @see {UpdraftCentral.register_row_clicker}
		 * @borrows {UpdraftCentral_Updates.process_update}
		 * @borrows {UpdraftCentral_Library.md5}
		 */
		UpdraftCentral.register_row_clicker('.updraftcentral_row_extracontents button.update-go', function($site_row) {
			if (!jQuery(this).hasClass('disabled')) {
				var site = sites.item($site_row.data('site_id'));
				var uc_runner = uc_runners.item(site.id);
				var $update_row = jQuery(this).closest('.row.update-item');
				var entity = $update_row.data('entity');
				var name = $update_row.data('name');
			
				if ('undefined' === typeof name) {
					switch (entity) {
						case 'plugin':
						case 'theme':
							var info = $update_row.data(entity + '-info');
							name = info.update[entity];
							break;
						case 'core':
							name = udclion.updates.wordpress;
							break;
						default:
							break;
					}
				}

				if ('undefined' !== typeof site && 'undefined' !== typeof name && name.length) {
					var key = UpdraftCentral_Library.md5(site.id+'_'+name);
					var update_info = site.get_update_info(entity, key);
					if (update_info) {

						// Check Mysql Errors:
						if (typeof update_info.mysql_error !== 'undefined') {
							UpdraftCentral_Library.dialog.alert(update_info.mysql_error, null, false);
						} else {

							var task_key = uc_runner.add_task(process_update_info, [update_info, site]);
							if (task_key) {
								uc_runners.update(site.id, uc_runner);

								if (debug_level > 0) {
									console.log('Item queued for processing:');
									console.log(update_info);
								}

								// Prevent them clicking again on the same button
								var $button = $update_row.find('button.update-go');
								$button.hide();
								$update_row.find('.update-in-progress').css('width', 'auto').show();
								
								// Saved task_key to cache in case the user wanted to de-queue
								// the currently queued task afterwards.
								cache.add(key, task_key);

								// Update button state:
								update_button_state(uc_runner);
							}
							
						}
					}
				}
			}
		});
		
		/**
		 * De-queues the previously queued task for update
		 *
		 * @see {UpdraftCentral.register_row_clicker}
		 * @borrows {UpdraftCentral_Tasks_Runner.remove_task}
		 * @borrows {UpdraftCentral_Library.md5}
		 */
		UpdraftCentral.register_row_clicker('.updraftcentral_row_extracontents button.update-in-progress', function($site_row) {
			if (!jQuery(this).hasClass('disabled')) {
				var site = sites.item($site_row.data('site_id'));
				var uc_runner = uc_runners.item(site.id);
				var $update_row = jQuery(this).closest('.row.update-item');
				var entity = $update_row.data('entity');
				var name = $update_row.data('name');
			
				if ('undefined' === typeof name) {
					switch (entity) {
						case 'plugin':
						case 'theme':
							var info = $update_row.data(entity + '-info');
							name = info.update[entity];
							break;
						case 'core':
							name = udclion.updates.wordpress;
							break;
						default:
							break;
					}
				}

				if ('undefined' !== typeof site && 'undefined' !== typeof name && name.length) {
					var key = UpdraftCentral_Library.md5(site.id+'_'+name);
					if (cache.exists(key)) {
						var task_key = cache.item(key);

						if (uc_runner.remove_task(task_key)) {
							// Prevent them clicking again on the same button
							var $button = $update_row.find('button.update-in-progress');
							$button.hide();
							$update_row.find('.update-go').css('width', 'auto').show();

							// Remove task_key from cache
							cache.remove(key);

							// Update button state:
							update_button_state(uc_runner);
						}
					}
				}
			}
		});

		/**
		 * Shows all available items from the server that needs
		 * updating or an upgrade, and pre-loads site information
		 * that is needed by the process.
		 *
		 * @see {UpdraftCentral.register_row_clicker}
		 */
		UpdraftCentral.register_row_clicker('.updraftcentral_action_show_updates', function($site_row) {
			var update_options = {
				force_refresh: false
			}
			
			if (jQuery(this).hasClass('updraftcentral_updates_force_check')) {
				update_options.force_refresh = true;
			}
			
			UpdraftCentral.send_site_rpc('updates.get_updates', update_options , $site_row, function(response, code, error_code) {
				if ('ok' == code && response && 'updates' == UpdraftCentral.get_dashboard_mode()) {
					var site_id = $site_row.data('site_id');
					var site = new UpdraftCentral_Site($site_row);
					
					if (sites.exists(site_id)) {
						site = sites.item(site_id);
					}
					
					// We make sure that we have a task runner instance
					// for the given Site.
					if (!uc_runners.exists(site.id)) {
						uc_runners.add(site.id, new UpdraftCentral_Tasks_Runner({
							concurrency: 1
						}));
					} else {
						var uc_runner = uc_runners.item(site.id);
						uc_runner.clear_tasks();

						// Update current runner instance
						uc_runners.update(site.id, uc_runner);
					}
					
					var $row_extra_contents = $site_row.find('.updraftcentral_row_extracontents');
					var output = '',
						entities = {
							plugins: null,
							themes: null,
							core: null
						};
					
					if (response.data) {
						if (response.data.hasOwnProperty('plugins') && response.data.plugins.length) {
							entities.plugins = UpdraftCentral.template_replace('updates-plugin-updates', { plugins: response.data.plugins});
						}
						
						if (response.data.hasOwnProperty('themes') && response.data.themes.length) {
							entities.themes = UpdraftCentral.template_replace('updates-theme-updates', { themes: response.data.themes});
						}
						
						if (response.data.hasOwnProperty('core') && response.data.core.length) {
							entities.core = UpdraftCentral.template_replace('updates-core-updates', { core: response.data.core});
						}
						
						if (response.data.hasOwnProperty('meta')) {
							if (typeof response.data.meta.automatic_backups !== 'undefined') {
								site.automatic_backups = response.data.meta.automatic_backups;
							}
						}
					}
					
					if (entities.plugins || entities.themes || entities.core) {
						output = UpdraftCentral.template_replace('updates-table-header', entities);
					} else {
						output = "<h5>" + udclion.updates.no_updates + "</h5>";
					}
					
					$row_extra_contents.html('<div class="updraft_updates_output updraft_module_output">' +
					'<div class="dashicons dashicons-image-rotate updraftcentral_action_show_updates updraftcentral_updates_force_check"></div>' + UpdraftCentral_Library.sanitize_html(output) + '</div>');
					
					if (response.data.plugins.length) {
						fill_wporg_metadata($site_row, response.data.plugins, 'plugin');
					}
					if (response.data.themes.length) {
						fill_wporg_metadata($site_row, response.data.themes, 'theme');
					}
					
					// Add Site to Sites Collection:
					if (!sites.exists(site_id)) sites.add(site.id, site);
					
					// Preload Site Updates
					load_site_updates(site);
				}
			});
		}, true);
		
		
		/**
		 * Shows a much more detailed messages from the log when
		 * an error has occured.
		 *
		 * @see {@link http://api.jquery.com/on}
		 */
		jQuery('#updraftcentral_notice_container').on('click', '.updraftcentral_notice .update-failure-messages-show', function(e) {
			e.preventDefault();
			jQuery(this).hide().siblings('.update-failure-messages-text').slideDown();
		});
		
		/**
		 * Resets the "site.update_processing" as a means to fix an issue
		 * that stops the process.
		 *
		 * @see {@link http://api.jquery.com/on}
		 */
		jQuery('#updraftcentral_notice_container').on('click', '.updraftcentral_notice > .updraftcentral_notice_dismiss', function() {
			var $container = jQuery(this).closest('#updraftcentral_notice_container');
			var $error_notices = $container.find('.update-errors');
			
			if (jQuery.trim($error_notices.html()).length > 1) {
				var site_id = $site_row.data('site_id');
				var site = sites.item(site_id);
				
				site.update_processing = false;
				sites.update(site.id, site);
			}
		});
	
		/**
		 * Setting some of process flags to continue with the update process if queue
		 * is still not empty.
		 *
		 * @see {@link http://api.jquery.com/on}
		 */
		jQuery('#updraftcentral_dashboard_existingsites').on('updraftcentral_listener_finished_updraftplus_backup', function(event, data) {
			event.preventDefault();
			
			var site_id = data.site_id;
			var site = sites.item(site_id);
			
			if (typeof site !== 'undefined') {
				if (!site.autobackup_complete) {
					if (debug_level > 0) {
						console.log("UpdraftCentral: automatic backup is complete.");
					}
					site.autobackup_complete = true;
					sites.update(site.id, site);
					
					// Proceed with the process after backup has finished.
					if (typeof site.autobackup_options.caller !== 'undefined') {
						var caller = site.autobackup_options.caller;
						if (typeof site.autobackup_options.mass_updates !== 'undefined' && site.autobackup_options.mass_updates) {
							if (sites_for_backup.exists(site.id)) {
								sites_for_backup.remove(site.id);
							}

							caller.apply(null, site.autobackup_options.args);
						} else {
							caller.trigger('click');
						}
					}
				}
			}
		});
		
		/**
		 * Put clicked links within the settings sections into their own tab
		 *
		 * @see {@link http://api.jquery.com/on}
		 */
		jQuery('#updraftcentral_dashboard_existingsites_container').on('click', '.updraftcentral_site_row '+settings_css_sub_prefix+' .updates-update a', function(e) {
			var href = jQuery(this).attr('href');
			if ('undefined' === typeof href) { return; }
			if (href.substring(0, 4) == 'http') {
				e.preventDefault();
				var win = window.open(href, '_blank');
				win.focus();
			}
		});
	
	});
	
}
