<?php

if (!defined('UD_CENTRAL_DIR')) die('Security check');

if (!class_exists('UpdraftCentral_User')) :

class UpdraftCentral_User {

	private $rc;

	public $user_id = null;

	public $sites = null;

	public $sites_meta = null;

	private $php_events;

	private $licence_manager = null;

	public function __construct($user_id) {

		$this->user_id = (int) $user_id;
		if (!is_user_logged_in()) throw new Exception('The current visitor is not logged in');

		global $wpdb;
		$this->rc = UpdraftCentral();
		$this->sites_table = $wpdb->base_prefix.$this->rc->table_prefix.'sites';
		$this->sitemeta_table = $wpdb->base_prefix.$this->rc->table_prefix.'sitemeta';

		add_filter('updraftcentral_dashboard_ajaxaction_newsite', array($this, 'dashboard_ajaxaction_newsite'), 10, 2);
		add_filter('updraftcentral_dashboard_ajaxaction_edit_site_configuration', array($this, 'dashboard_ajaxaction_edit_site_configuration'), 10, 2);
		add_filter('updraftcentral_dashboard_ajaxaction_edit_site_connection_method', array($this, 'dashboard_ajaxaction_edit_site_connection_method'), 10, 2);
		add_filter('updraftcentral_dashboard_ajaxaction_delete_site', array($this, 'dashboard_ajaxaction_delete_site'), 10, 2);
		add_filter('updraftcentral_dashboard_ajaxaction_sites_html', array($this, 'dashboard_ajaxaction_sites_html'));
		add_filter('updraftcentral_dashboard_ajaxaction_site_rpc', array($this, 'dashboard_ajaxaction_site_rpc'), 10, 2);
		add_filter('updraftcentral_dashboard_ajaxaction_manage_site_order', array($this, 'dashboard_ajaxaction_manage_site_order'), 10, 2);

		add_filter('updraftcentral_load_user_sites', array($this, 'load_user_sites_filter'));

		// Load licence manager - this needs loading before the sites themselves are
		if (!class_exists('UpdraftCentral_Licence_Manager')) include_once UD_CENTRAL_DIR.'/classes/licence-manager.php';

		// Allow developers to implement their own licence management
		$licence_manager_class = apply_filters('updraftcentral_licence_manager_class', 'UpdraftCentral_Licence_Manager');

		$this->licence_manager = new $licence_manager_class($this, $this->rc);

		$this->load_user_sites();

	}

	/**
	 * Used to update sort order in user meta
	 *
	 * @param  array $response
	 * @param  array $post_data - site_order is an indexed array of site id's in the sorted order
	 * @return array
	 */
	public function dashboard_ajaxaction_manage_site_order($response, $post_data) {

		if (isset($post_data['data']['site_order'])) {

			$user_id = $this->user_id;
			$response['responsetype'] = "ok";
			$response['message'] = 'No change';

			if (get_user_meta($user_id, 'updraftcentral_dashboard_site_order', true) !== $post_data['data']['site_order']) { // only update if needed (user dragged and dropped in same place)

				if (update_user_meta($user_id, 'updraftcentral_dashboard_site_order', $post_data['data']['site_order'])) {
					$response['message'] = 'success';
				} else {
					$response['message'] = 'fail';
				}
			}
		} else {
			$response['responsetype'] = "error";
			$response['message'] = "Missing site order data";
		}

		return $response;
	}

	public function get_licence_manager() {
		return $this->licence_manager;
	}

	/**
	 * TODO: 1) Catch PHP events on the mothership, pass them on and let them be console.logged
	 * 		 2) Pass on caught output from the remote side, and get it console.logged
	 *
	 * @param  array $response
	 * @param  array $post_data
	 * @return array
	 */
	public function dashboard_ajaxaction_site_rpc($response, $post_data) {

		$is_preencrypted = !empty($_POST['site_rpc_preencrypted']);

		// Check the sent data
		if ($is_preencrypted) {

			if (!isset($post_data['wrapped_message']) || !is_array($post_data['wrapped_message']) || empty($post_data['site_id']) || !is_numeric($post_data['site_id'])) {
				$response['responsetype'] = 'error';
				$response['code'] = 'missing_data';
				$response['message'] = __('Missing information', 'updraftcentral');

				return $response;
			}

		} else {

			if (!isset($post_data['data']) || !is_array($post_data['data']) || empty($post_data['data']['command']) || empty($post_data['site_id']) || !is_numeric($post_data['site_id'])) {
				$response['responsetype'] = 'error';
				$response['code'] = 'missing_data';
				$response['message'] = __('Missing information', 'updraftcentral');

				return $response;
			}

		}

		$site_id = (int) $post_data['site_id'];

		// This is also a security check - whether the specified site belongs to the current user
		if (empty($this->sites[$site_id])) {
			$response['responsetype'] = 'error';
			$response['code'] = 'nonexistent_site';
			$response['message'] = sprintf(__('This site (%d / %d) was not found', 'updraftcentral'), $this->user_id, $site_id);

			return $response;
		}

		$site = $this->sites[$site_id];

		if (empty($site->key_local_private)) {
			$response['responsetype'] = 'error';
			$response['code'] = 'nonexistent_site_key';
			$response['message'] = sprintf(__('The key for this site (%d / %d) was not found', 'updraftcentral'), $this->user_id, $site_id);

			return $response;
		}

		if (!empty($site->unlicensed)) {
			$response['responsetype'] = 'error';
			$response['code'] = 'site_unlicensed';
			$response['message'] = apply_filters('updraftcentral_site_unlicensed_message', __('You have more sites in your dashboard than licences. As a result, you cannot perform actions on this site.', 'updraftcentral').' '.__('You will need to obtain more licences, or remove some sites.', 'updraftcentral'));

			return $response;
		}

		if ($this->rc->url_looks_internal($site->url) && !$this->rc->url_looks_internal(site_url()) && !apply_filters('updraftcentral_allow_contacting_internal_url_from_server', true, $url)) {
			$url_scheme = strtolower(parse_url($site->url, PHP_URL_SCHEME));
			$response['responsetype'] = 'error';
			$response['code'] = 'cannot_contact_localdev';
			$response['message'] = __('You cannot contact a website hosted on a site-local network (e.g. localhost) from this dashboard - it cannot be reached.', 'updraftcentral');

			return $response;
		}

		// @codingStandardsIgnoreLine
		@ob_start();

		$site_meta = empty($this->sites_meta[$site->site_id]) ? array() : $this->sites_meta[$site->site_id];

		$ud_rpc = $this->rc->get_udrpc($site->key_name_indicator);

		$admin_url = empty($site->admin_url) ? $site->url : untrailingslashit($site->admin_url).'/admin-ajax.php';

		if (preg_match('#/admin-ajax.php$#', $admin_url)) {
			// wp-admin/admin-ajax.php before WP 3.5 will die() if $_REQUEST['action'] is not set (3.2) or is empty (3.4). Later WP versions also check that, but after (instead of before) wp-load.php, which is where we are ultimately hooked in.
			$admin_url .= '?action=updraft_central';
		}

		$ud_rpc->set_destination_url($admin_url);

		if (!empty($site_meta['http_username'])) {

			$authentication_method = empty($site_meta['http_authentication_method']) ? 'basic' : $site_meta['http_authentication_method'];
			$http_password = empty($site_meta['http_password']) ? '' : (string) $site_meta['http_password'];

			if ('basic' != $authentication_method && version_compare(PHP_VERSION, '5.4', '<')) {
				$reply = new WP_Error('no_digest_before_php54', sprintf(__('To use HTTP digest authentication, your server running the UpdraftCentral dashboard needs at least PHP %s (your version is %s)', 'updraftcentral'), '5.4', PHP_VERSION), PHP_VERSION);
			} else {
				// Guzzle supports HTTP digest authentication - the WP HTTP API doesn't.
				include_once UD_CENTRAL_DIR.'/vendor/autoload.php';
				$guzzle_client = new GuzzleHttp\Client();

				if (!method_exists($ud_rpc, 'set_http_transport') || !method_exists($ud_rpc, 'set_http_credentials')) {
					// That's the probable cause, because we can assume that UC has a bundled UDRPC that's new enough.
					$reply = new WP_Error('incompatible_udrpc_php', sprintf(__('The loaded UDRPC library (%s) is too old - you probably need to update your installed UpdraftPlus on the server', 'updraftcentral'), $ud_rpc->version));
				} else {
					$ud_rpc->set_http_transport($guzzle_client);
					$ud_rpc->set_http_credentials(array('username' => $site_meta['http_username'], 'password' => $http_password, 'authentication_method' => $authentication_method));
				}

			}

		}

		if (!empty($reply)) {
			// Already an error condition - nothing to do
		} elseif ($is_preencrypted) {
			$reply = $this->send_message($ud_rpc, '__updraftcentral_internal_preencrypted', $post_data['wrapped_message'], 30);
		} else {

			$ud_rpc->set_key_local($site->key_local_private);
			$ud_rpc->set_key_remote($site->key_remote_public);
			$ud_rpc->activate_replay_protection();

			$command = (string) $post_data['data']['command'];
			$data = isset($post_data['data']['data']) ? $post_data['data']['data'] : null;

			$reply = $this->send_message($ud_rpc, $command, $data, 30);
		}

		// @codingStandardsIgnoreStart
		$caught_output = @ob_get_contents();
		@ob_end_clean();
		// @codingStandardsIgnoreEnd

		// Pass on PHP events from the remote side
		if (!empty($this->php_events)) $response['php_events'] = $this->php_events;
		if (!empty($caught_output)) $response['mothership_caught_output'] = $caught_output;
		if (is_wp_error($reply)) {
			$response['responsetype'] = 'error';
			$response['message'] = $reply->get_error_message();
			$response['code'] = $reply->get_error_code();
			$response['data'] = $reply->get_error_data();
		} elseif (is_array($reply) && !empty($reply['response']) && 'error' == $reply['response']) {
			$response['responsetype'] = 'error';
			$response['message'] = empty($reply['message']) ? __('The connection to the remote site returned an error', 'updraftcentral') : $reply['message'];
			$response['data'] = $reply;
		} elseif ((!$is_preencrypted && (!is_array($reply) || empty($reply['response']) || (('ping' == $command && 'pong' != $reply['response'])) && 'rpcok' != $reply['response'])) || ($is_preencrypted && null === ($decoded_reply = json_decode($reply, true)) && (false == ($found_at = strpos($reply, '{"format":')) || null === ($decoded_reply = json_decode(substr($reply, $found_at), true))))) {
			// If it is pre-encrypted, we expect a field 'udrpc_message' in the reply (after it's been JSON-decoded). We could check that. But instead, we just pass it back to the browser, since it'll be checked there anyway.
			$response['responsetype'] = 'error';
			$response['message'] = __('There was an error in contacting the remote site.', 'updraftcentral').' '.__("You should check that the remote site is online, is not firewalled, has remote control enabled, and that no security module is blocking the access. Then, check the logs on the remote site and your browser's JavaScript console.", 'updraftcentral').' '.__('If none of that helps, then you should try re-adding the site with a fresh key.', 'updraftcentral');
			$response['data'] = $reply;
			$response['code'] = 'no_pong';
		} else {
			$response['responsetype'] = 'ok';
			$response['message'] = __('The site was connected to, and returned a response', 'updraftcentral');
			if ($is_preencrypted) {
				$response['wrapped_response'] = $decoded_reply;
			} elseif ('siteinfo' == $command) {
				$response['rpc_response'] = $this->deep_sanitize($reply);
			} else {
				$response['rpc_response'] = $reply;
			}
		}

		return $response;
	}

	public function deep_sanitize($input, $sanitize_function = 'htmlspecialchars') {
		if (is_string($input)) return call_user_func($sanitize_function, $input);
		if (is_array($input)) {
			foreach ($input as $k => $v) {
				$input[$k] = $this->deep_sanitize($v, $sanitize_function);
			}
		}

		return $input;
	}

	private function send_message($ud_rpc, $message, $data = null, $timeout = 30) {
		$this->php_events = array();

		if ('__updraftcentral_internal_preencrypted' == $message) {

			$post_options = array(
				'timeout' => $timeout,
				'body' => $data,
			);

			$post_options = apply_filters('udrpc_post_options', $post_options, $message, $data, $timeout, $this);

			try {
				$post = $ud_rpc->http_post($post_options);
			} catch (Exception $e) {
				// Curl can return an error code 0, which causes WP_Error to return early, without recording the message. So, we prefix the code.
				return new WP_Error('http_post_'.$e->getCode(), $e->getMessage());
			}

			if (is_wp_error($post)) return $post;

			if (empty($post['response']) || empty($post['response']['code'])) return new WP_Error('empty_http_code', 'Unexpected HTTP response code');

			if ($post['response']['code'] < 200 || $post['response']['code'] >= 300) return new WP_Error('unexpected_http_code', 'Unexpected HTTP response code ('.$post['response']['code'].')', $post);

			if (empty($post['body'])) return new WP_Error('empty_response', 'Empty response from remote site');

			return (string) $post['body'];

		} else {
			$response = $ud_rpc->send_message($message, $data, $timeout);
		}

		// TODO: Handle caught_output
		
		if (is_array($response) && !empty($response['data']) && is_array($response['data']) && !empty($response['data']['php_events']) && !empty($response['data']['previous_data'])) {
		// global $updraftplus;
			$this->php_events = $response['data']['php_events'];
			if (defined('WP_DEBUG') && WP_DEBUG) {
				foreach ($response['data']['php_events'] as $logline) {
					error_log('From remote side: '.$logline);
				}
			}
			$response['data'] = $response['data']['previous_data'];
		}

		return $response;
	}

	public function dashboard_ajaxaction_sites_html($response) {
		$response['responsetype'] = 'ok';
		$response['sites_html'] = $this->get_sites_html();
		$response['status_info'] = array(
			'how_many_licences_in_use' => $this->licence_manager->how_many_licences_in_use(),
			'how_many_licences_available' => $this->licence_manager->how_many_licences_available(),
		);
		$response['message'] = __('The site list has been refreshed.', 'updraftcentral');

		return $response;
	}

	public function dashboard_ajaxaction_delete_site($response, $post_data) {
		if (isset($post_data['data']) && is_array($post_data['data']) && !empty($post_data['data']['site_id'])) {

			$deleted = $this->delete_site_by_id((int) $post_data['data']['site_id']);

			if (is_wp_error($deleted)) {
				$response = $deleted;
			} else {
				$response['responsetype'] = 'ok';
				$response['status_info'] = array(
					'how_many_licences_in_use' => $this->licence_manager->how_many_licences_in_use(),
					'how_many_licences_available' => $this->licence_manager->how_many_licences_available(),
				);
				$response['sites_html'] = $this->get_sites_html();
				$response['message'] = __('The site was successfully deleted from your dashboard.', 'updraftcentral');
			}

		} else {
			$response['responsetype'] = 'error';
			$response['code'] = 'missing_data';
			$response['message'] = __('Missing information', 'updraftcentral');
		}

		return $response;
	}

	public function dashboard_ajaxaction_edit_site_connection_method($response, $post_data) {

		if (isset($post_data['data']) && is_array($post_data['data']) && !empty($post_data['data']['site_id'])) {

			$site_id = (int) $post_data['data']['site_id'];

			$connection_method = isset($post_data['data']['connection_method']) ? (string) $post_data['data']['connection_method'] : 'direct_default_auth';

			$updated = $this->rc->wp_update('sites',
				array(
					'connection_method' => $connection_method,
				),
				array(
					'user_id' => $this->user_id,
					'site_id' => $site_id,
				),
				array(
					'%s',
				),
				array(
					'%d',
					'%d',
				)
			);

			if (is_numeric($updated)) {
				$response['responsetype'] = 'ok';

				$this->load_user_sites();
				$response['sites_html'] = $this->get_sites_html();
				$response['status_info'] = array(
					'how_many_licences_in_use' => $this->licence_manager->how_many_licences_in_use(),
					'how_many_licences_available' => $this->licence_manager->how_many_licences_available(),
				);

				$response['message'] = __('The site configuration was successfully edited.', 'updraftcentral');
			} else {
				$response = $updated;
			}

		} else {
			$response['responsetype'] = 'error';
			$response['code'] = 'missing_data';
			$response['message'] = __('Missing information', 'updraftcentral');
		}

		return $response;

	}

	public function dashboard_ajaxaction_edit_site_configuration($response, $post_data) {

		if (isset($post_data['data']) && is_array($post_data['data']) && !empty($post_data['data']['site_id']) && isset($post_data['data']['description'])) {

			$site_id = (int) $post_data['data']['site_id'];

			$connection_method = isset($post_data['data']['connection_method']) ? (string) $post_data['data']['connection_method'] : 'direct_default_auth';
			$send_cors_headers = (isset($post_data['data']['send_cors_headers']) && $post_data['data']['send_cors_headers']) ? 1 : 0;

			$updated = $this->rc->wp_update('sites',
				array(
					'description' => (string) $post_data['data']['description'],
					'connection_method' => $connection_method,
					'send_cors_headers' => $send_cors_headers,
				),
				array(
					'user_id' => $this->user_id,
					'site_id' => $site_id,
				),
				array(
					'%s',
					'%s',
					'%d',
				),
				array(
					'%d',
					'%d',
				)
			);

			if (is_numeric($updated)) {
				$response['responsetype'] = 'ok';

				$extra_site_info_unparsed = empty($post_data['data']['extra_site_info']) ? false : $post_data['data']['extra_site_info'];
				if (!$extra_site_info_unparsed) {
					$extra_site_info = array();
				} else {
					parse_str($extra_site_info_unparsed, $extra_site_info);
				}

				if (!empty($extra_site_info)) {
					foreach ($extra_site_info as $meta_key => $meta_value) {
						$this->rc->site_meta->update_site_meta($site_id, $meta_key, $meta_value);
					}
				}

				$this->load_user_sites();
				$response['sites_html'] = $this->get_sites_html();
				$response['status_info'] = array(
					'how_many_licences_in_use' => $this->licence_manager->how_many_licences_in_use(),
					'how_many_licences_available' => $this->licence_manager->how_many_licences_available(),
				);

				$response['message'] = __('The site configuration was successfully edited.', 'updraftcentral');
			} else {

				$response = $updated;
			}

		} else {
			$response['responsetype'] = 'error';
			$response['code'] = 'missing_data';
			$response['message'] = __('Missing information', 'updraftcentral');
		}

		return $response;
	}

	public function dashboard_ajaxaction_newsite($response, $post_data) {

		if (empty($post_data['data']) || !is_array($post_data['data']) || empty($post_data['data']['key'])) {
			$response['responsetype'] = 'error';
			$response['code'] = 'empty';
			$response['message'] = __('Please enter the site key.', 'updraftcentral');
		} else {

			$site_key = $post_data['data']['key'];

			$extra_site_info_unparsed = empty($post_data['data']['extra_site_info']) ? false : $post_data['data']['extra_site_info'];
			if (!$extra_site_info_unparsed) {
				$extra_site_info = array();
			} else {
				parse_str($extra_site_info_unparsed, $extra_site_info);
			}

			$ud_rpc = $this->rc->get_udrpc();

			// A bundle has these keys: key, name_indicator, url
			$decode_bundle = $ud_rpc->decode_portable_bundle($site_key, 'base64_with_count');

			if (!is_array($decode_bundle) || !empty($decode_bundle['code'])) {
				$response['responsetype'] = 'error';
				$response['message'] = __('Error:', 'updraftcentral');
				$response['code'] = empty($decode_bundle['code']) ? 'could_not_decode' : $decode_bundle['code'];
				if (!empty($decode_bundle['code']) && 'invalid_wrong_length' == $decode_bundle['code']) {
					$response['message'] .= ' '.__('The entered key was the wrong length - please try again.', 'updraftcentral');
				} elseif (!empty($decode_bundle['code']) && 'invalid_corrupt' == $decode_bundle['code']) {
					$response['message'] .= ' '.__('The entered key was corrupt - please try again.', 'updraftcentral').' ('.$decode_bundle['data'].')';
				} elseif (empty($decode_bundle['key']) || empty($decode_bundle['url']) || empty($decode_bundle['name_indicator'])) {
					$response['message'] .= ' '.__('The entered key was corrupt - please try again.', 'updraftcentral');
					$response['data'] = $decode_bundle;
				}
			} elseif (empty($decode_bundle['key']) || empty($decode_bundle['url']) || empty($decode_bundle['user_id'])) {
					$response['message'] = __('Error:', 'updraftcentral').' '.__('The entered key was corrupt - please try again.', 'updraftcentral');
					$response['code'] = 'corrupt_key';
					$response['data'] = $decode_bundle;
			} else {

				if (trailingslashit(network_site_url()) == $decode_bundle['url'] && !apply_filters('updraftcentral_allow_self_control', true)) {
					$response['responsetype'] = 'error';
					$response['code'] = 'this_site';
					$response['message'] = __('Error:', 'updraftcentral').' '.__('The entered key does not belong to a remote site (it belongs to this one).', 'updraftcentral');
				} elseif ($this->rc->url_looks_internal($decode_bundle['url']) && !$this->rc->url_looks_internal(site_url()) && !apply_filters('updraftcentral_allow_adding_internal_url', true, $decode_bundle['url'])) {
					// The default is to allow it, because as long as your browser is running on the same machine as the site is on, it can work.
					$response['responsetype'] = 'error';
					$response['code'] = 'cant_add_localhost';
					$response['message'] = __('Error:', 'updraftcentral').' '.__('The entered key belongs to a local development website - these cannot be controlled from this dashboard because it is not reachable from an external network.', 'updraftcentral');
				} else {
					// Was the key sent SSL to us directly?
					$key = $decode_bundle['key'];
					if (is_array($key) && !empty($key['key_hash']) && isset($key['key_id'])) {
						global $wpdb;
						// Allow them 3 hours to copy-and-paste their key
						$wpdb->query('DELETE FROM '.$wpdb->base_prefix.$this->rc->table_prefix.'site_temporary_keys WHERE created<='.(int) (time() - 10800));
						$key_info = $this->rc->wp_get_row('site_temporary_keys', $wpdb->prepare('key_id=%d', $key['key_id']));
						if (is_object($key_info) && !empty($key_info->key_local_private) && !empty($key_info->key_remote_public)) {
							$this->rc->wp_delete('site_temporary_keys', array('key_id' => $key['key_id']));
							$key_hash = hash('sha256', $key_info->key_remote_public);

							// @codingStandardsIgnoreLine
							if ((function_exists('hash_equals') && hash_equals($key_hash, $key['key_hash'])) || (!function_exists('hash_equals') && $key_hash === $key['key_hash'])) {
								$key_local_private = $key_info->key_local_private;
								$key_remote_public = $key_info->key_remote_public;
							} else {
								$response['responsetype'] = 'error';
								$response['code'] = 'wrong_hash';
								$response['message'] = __('Error:', 'updraftcentral').' '.apply_filters('updraftcentral_wrong_hash_message', __('This key could not be added, as it appears to be corrupt - please try again.', 'updraftcentral'));

								return $response;
							}
						} else {
							$response['responsetype'] = 'error';
							$response['code'] = 'no_key_found';
							$response['message'] = __('Error:', 'updraftcentral').' '.apply_filters('updraftcentral_no_key_found_message', __('This key could not be added - it may be too long since you generated it; please try again.', 'updraftcentral'));

							return $response;
						}

					} elseif (!empty($decode_bundle['mothership_firewalled'])) {

						// Need to do direct AJAX from the browser to the mothership to send our key
				
						$ud_rpc = $this->rc->get_udrpc('central_host.updraftplus.com', true);
						if (false != $ud_rpc->generate_new_keypair()) {
							$key_remote_public = $key;
							$key_local_private = $ud_rpc->get_key_local();
						} else {
							$response['responsetype'] = 'error';
							$response['code'] = 'keygen_error';
							$response['message'] = 'An error occurred when attempting to generate a new key-pair';

							return $response;
						}

					} else {
						$key_remote_public = $key;
						$key_local_private = false;
					}

					$remote_site_id = empty($decode_bundle['ms_id']) ? 0 : $decode_bundle['ms_id'];
					$description = isset($decode_bundle['site_title']) ? (string) $decode_bundle['site_title'] : '';

					$send_cors_headers = (isset($post_data['data']['send_cors_headers']) && !$post_data['data']['send_cors_headers']) ? 0 : 1;
					$connection_method = isset($post_data['data']['connection_method']) ? (string) $post_data['data']['connection_method'] : 'direct_default_auth';

					$site_url = $decode_bundle['url'];

					// Supply a default for legacy format keys that didn't include the admin URL
					$admin_url = empty($decode_bundle['admin_url']) ? trailingslashit($site_url).'wp-admin' : $decode_bundle['admin_url'];

					$added = $this->add_site($site_url, $admin_url, $key_local_private, $key_remote_public, $decode_bundle['user_id'], $decode_bundle['user_login'], $decode_bundle['name_indicator'], $remote_site_id, $description, $connection_method, $send_cors_headers);

					if (true === $added) {
						$response['responsetype'] = 'ok';

						global $wpdb;
						$new_site_id = $wpdb->insert_id;

						if (!empty($extra_site_info)) {
							if (!is_array($this->sites_meta)) $this->sites_meta = array();
							if (empty($this->sites_meta[$new_site_id])) $this->sites_meta[$new_site_id] = array();
							foreach ($extra_site_info as $meta_key => $meta_value) {
								if (!$meta_value) continue;
								// Don't bother to save the default value on the initial adding of the site
								if ('http_authentication_method' == $meta_key && 'basic' == $meta_value) continue;
								// We update the in-memory copy because this is used by get_sites_html()
								$this->sites_meta[$new_site_id][$meta_key] = $meta_value;
								$this->rc->site_meta->add_site_meta($new_site_id, $meta_key, $meta_value);
							}
						}

						// Return the new HTML widget to the front end
						$response['sites_html'] = $this->get_sites_html();
						$response['status_info'] = array(
							'how_many_licences_in_use' => $this->licence_manager->how_many_licences_in_use(),
							'how_many_licences_available' => $this->licence_manager->how_many_licences_available(),
						);

						$response['message'] = __('The key was successfully added.', 'updraftcentral').' '.__('It is for interacting with the following site: ', 'updraftcentral').htmlspecialchars($decode_bundle['url']);

						if (!empty($decode_bundle['mothership_firewalled_callback_url'])) {
							$response['key_needs_sending'] = array(
								'site_id' => $new_site_id,
								'url' => $decode_bundle['mothership_firewalled_callback_url'],
								'updraft_key_index' => $decode_bundle['updraft_key_index'],
								'remote_public_key' => $ud_rpc->get_key_remote(),
							);
						}

					} else {
						$response['responsetype'] = 'error';
						$response['code'] = $added->get_error_code();
						$response['message'] = __('Error:', 'updraftcentral').' '.$added->get_error_message();
					}

				}
			}
		}

		return $response;
	}

	public function load_user_sites_filter($sites) {
		$how_many_licences_available = $this->licence_manager->how_many_licences_available();
		$how_many_licences_in_use = count($sites);

		if ($how_many_licences_available >= $how_many_licences_in_use || $how_many_licences_available < 0) return $sites;

		$log_message = sprintf(__('You have more sites being managed (%d) than active licences (%d) - you will need to obtain more licences in order to manage all of your managed sites.', 'updraftcentral'), $how_many_licences_in_use, $how_many_licences_available);

		$this->rc->log_notice($log_message, 'error', 'not_enough_licences');

		$i = 0;
		foreach ($sites as $site_id => $site) {
			if ($i >= $how_many_licences_available) {
				$site->unlicensed = true;
				$sites[$site_id] = $site;
			}
			++$i;
		}

		return $sites;
	}

	public function load_user_sites() {
		global $wpdb;
		$sites = $wpdb->get_results('SELECT * FROM '.$this->sites_table.' WHERE user_id='.$this->user_id);

		$this->sites_meta = array();
		$sites_meta = $wpdb->get_results('SELECT * FROM '.$this->sitemeta_table);
		if (is_array($sites_meta)) {
			foreach ($sites_meta as $meta_row) {
				if (isset($meta_row->site_id)) {
					// N.B. We are assuming a single value only for each key (the WP general scheme allows for multiple)
					$this->sites_meta[$meta_row->site_id][$meta_row->meta_key] = $meta_row->meta_value;
				}
			}
		}

		if (is_array($sites)) {
			$processed_sites = array();
			foreach ($sites as $site) {
				$processed_sites[$site->site_id] = $site;
			}
			$this->sites = apply_filters('updraftcentral_load_user_sites', $processed_sites, $this, $this->licence_manager);

			return $this->sites;
		} elseif (is_wp_error($sites)) {
			$this->rc->log_notice($sites);
			$this->sites = null;

			return $sites;
		}
	}

	public function get_sites_html() {

		$ret = '';

		// Get sites. Print a line for each of them.
		if (empty($this->sites) || !is_array($this->sites)) {
			$ret .= $this->rc->include_template('sites/none-set-up.php', true, array('common_urls' => $this->rc->get_common_urls()));
		} else {

			// retrieve metadata if any exists
			$user_id = $this->user_id;

			// ensure we have an array (in even of no metadata)

			if (!$site_order_meta = get_user_meta($user_id, 'updraftcentral_dashboard_site_order', true)) {
				$site_order_meta = array();
			}

			// Add existing sites if not in siteOrderMeta (i.e. any new added sites or handling no meta data)

			foreach ($this->sites as $site) {
				if (!in_array($site->site_id, $site_order_meta)) {
					array_push($site_order_meta, $site->site_id);
				}
			}

			// Render the site rows in site_order_meta sequence using site_id to reference sites object

			foreach ($site_order_meta as $site_id_meta) {

				// Ignore invalid or removed sites

				if (!empty($this->sites[$site_id_meta])) {

					$connection_method = isset($this->sites[$site_id_meta]->connection_method) ? (string) $this->sites[$site_id_meta]->connection_method : 'direct_default_auth';
					$send_cors_headers = (isset($this->sites[$site_id_meta]->send_cors_headers) && !$this->sites[$site_id_meta]->send_cors_headers) ? 0 : 1;

					$site_data_attributes = 'data-site_url="' . esc_attr($this->sites[$site_id_meta]->url) . '" data-site_id="' . (int) $site_id_meta . '" data-key_name_indicator="' . esc_attr($this->sites[$site_id_meta]->key_name_indicator) . '" data-site_description="' . (($this->sites[$site_id_meta]->description) ? esc_attr($this->sites[$site_id_meta]->description) : esc_attr($this->sites[$site_id_meta]->url)) . '" data-remote_user_id="' . (int) $this->sites[$site_id_meta]->remote_user_id . '" data-remote_user_login="' . esc_attr($this->sites[$site_id_meta]->remote_user_login) . '"';

					if (empty($this->sites[$site_id_meta]->admin_url)) {
						$admin_url = trailingslashit($this->sites[$site_id_meta]->url) . 'wp-admin';
					} else {
						$admin_url = $this->sites[$site_id_meta]->admin_url;
					}
					$site_data_attributes .= ' data-admin_url="' . esc_attr($admin_url) . '"';

					$site_meta = empty($this->sites_meta[$site_id_meta]) ? array() : $this->sites_meta[$site_id_meta];
					if (!empty($site_meta)) {
						if (!empty($site_meta['http_username'])) {
							$http_password = empty($site_meta['http_password']) ? '' : $site_meta['http_password'];
							$site_data_attributes .= ' data-http_username="' . esc_attr($site_meta['http_username']) . '" data-http_password="' . esc_attr($http_password) . '"';
							if (!empty($site_meta['http_authentication_method'])) $site_data_attributes .= ' data-http_authentication_method="' . $site_meta['http_authentication_method'] . '"';
						}
					}

					if (empty($this->sites[$site_id_meta]->unlicensed)) {
						if ('via_mothership_encrypting' != $connection_method) {
							$site_data_attributes .= ' data-site_remote_public_key="' . esc_attr($this->sites[$site_id_meta]->key_remote_public) . '" data-site_local_private_key="' . esc_attr($this->sites[$site_id_meta]->key_local_private) . '"';
						}
					} else {
						$site_data_attributes .= ' data-site_unlicensed="1"';
					}

					$site_data_attributes .= ' data-connection_method="' . esc_attr($connection_method) . '" data-send_cors_headers="' . $send_cors_headers . '"';

					$ret .= $this->rc->include_template('sites/site-row.php', true, array('site' => $this->sites[$site_id_meta], 'site_meta' => $site_meta, 'site_data_attributes' => $site_data_attributes));
				}
			}
		}

		return $ret;
	}

	/**
	 * Returns false if not authorised at all; or a timestamp if it's authorised until a particular date
	 *
	 * @param  int $site_id [description]
	 * @return boolean|integer
	 */
	public function authorised_for_site_until($site_id) {

		if (!is_array($this->sites)) $this->load_user_sites();

		if (is_array($this->sites)) {
			foreach ($this->sites as $site) {
				if ((int) $site_id == (int) $site->site_id && isset($site->licence_until)) {
					return apply_filters('updraftcentral_authorised_for_site_until', (int) $site->licence_until, $site_id, $this->sites);
				}
			}
		}

		return apply_filters('updraftcentral_authorised_for_site_until', false, $site_id, $this->sites);

	}

	/**
	 * Adding a site
	 *
	 * @param  string  $url
	 * @param  string  $admin_url
	 * @param  string  $key_local_private
	 * @param  string  $key_remote_public
	 * @param  integer $remote_user_id
	 * @param  string  $remote_user_login
	 * @param  string  $key_name_indicator
	 * @param  integer $remote_site_id
	 * @param  string  $description
	 * @param  string  $connection_method
	 * @param  Boolean $send_cors_headers
	 * @return Boolean|WP_Error - if a Boolean, then it will be true
	 */
	public function add_site($url, $admin_url, $key_local_private, $key_remote_public, $remote_user_id, $remote_user_login, $key_name_indicator, $remote_site_id = 0, $description = '', $connection_method = 'direct_default_auth', $send_cors_headers = 1) {

		if (!$this->user_can('add_site')) return new WP_Error('permission_denied', __('You do not have the permission to do this.', 'updraftcentral'), $this->user_id);

		if (!$this->licence_manager->is_slot_available()) {
			return new WP_Error('no_licences_available', apply_filters('updraftcentral_no_licences_available_message', __('You have no licences available - to add a site, you will need to obtain some more.', 'updraftcentral')));
		}

		$this->delete_site_by_url($url);

		$added = $this->rc->wp_insert('sites',
			array(
				'user_id' => $this->user_id,
				'url' => $url,
				'admin_url' => $admin_url,
				'key_local_private' => $key_local_private,
				'key_remote_public' => $key_remote_public,
				'description' => $description,
				'connection_method' => $connection_method,
				'send_cors_headers' => $send_cors_headers,
				'sequence_id' => 0,
				'remote_user_id' => $remote_user_id,
				'remote_user_login' => $remote_user_login,
				'remote_site_id' => $remote_site_id,
				'key_name_indicator' => $key_name_indicator,
			),
			array(
				'%d',
				'%s',
				'%s',
				'%s',
				'%s',
				'%s',
				'%s',
				'%d',
				'%d',
				'%d',
				'%s',
				'%d',
				'%s',
			)
		);

		if (is_numeric($added)) {
			$result = true;
		} else {
			$result = $added;
		}

		$this->load_user_sites();

		return $result;

	}

	public function delete_site_meta($site_id) {
		return $this->rc->wp_delete('sitemeta', array('site_id' => $site_id));
	}

	public function delete_site_by_id($site_id, $reload_user_sites = true) {
		$result = $this->rc->wp_delete('sites', array('user_id' => $this->user_id, 'site_id' => $site_id));
		$this->delete_site_meta($site_id);
		if ($reload_user_sites) $this->load_user_sites();

		return $result;
	}

	public function delete_site_by_url($url) {

		// We used to do a direct delete... but we need the site ID in order to be able to wipe the site meta
		// $result = $this->rc->wp_delete('sites', array('user_id' => $this->user_id, 'url' => $url));

		$result = 0;

		foreach ($this->sites as $site_id => $site) {
			if (strtolower($url) == strtolower($site->url)) {
				$result += $this->delete_site_by_id($site_id, false);
			}
		}

		$this->load_user_sites();

		return $result;
	}

	/**
	 * This just gives some potential for the future, currently - currently, there's nothing we're forbidding through this mechanism
	 *
	 * @param  string $do_what
	 * @return Boolean
	 */
	public function user_can($do_what) {
		$result = false;
		
		$old_user_id = get_current_user_id();
		if ($old_user_id != $this->user_id) wp_set_current_user($this->user_id);
		
		$is_admin = apply_filters('updraftcentral_user_can_is_admin', current_user_can('manage_options'), $this);
		
		if ($old_user_id != $this->user_id) wp_set_current_user($old_user_id);
		
		switch ($do_what) {
			case 'add_site':
				$result = $is_admin;
				break;
			case 'delete_site':
				$result = $is_admin;
				break;
		}

		return apply_filters('updraftcentral_user_can', $result, $do_what, $this);
	}
}

endif;
