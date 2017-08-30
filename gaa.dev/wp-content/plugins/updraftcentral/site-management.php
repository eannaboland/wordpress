<?php
// @codingStandardsIgnoreStart
/*
Plugin Name: UpdraftCentral Dashboard
Plugin URI: https://updraftcentral.com
Description: Manage your WordPress sites from a central dashboard
Version: 0.6.2
Text Domain: updraftcentral
Domain Path: /languages
Author: David Anderson + Team Updraft
Author URI: https://www.simbahosting.co.uk/s3/shop/
Requires at least: 4.0
Tested up to: 4.8
License: MIT

Copyright: 2015- David Anderson
*/
// @codingStandardsIgnoreEnd
if (!defined('ABSPATH')) die('Access denied.');

define('UD_CENTRAL_DIR', dirname(__FILE__));
define('UD_CENTRAL_URL', plugins_url('', __FILE__));
if (!defined('UPDRAFTCENTRAL_TABLE_PREFIX')) define('UPDRAFTCENTRAL_TABLE_PREFIX', 'updraftcentral_');

if (!class_exists('UpdraftCentral')) :
class UpdraftCentral {
	const VERSION = '0.6.2';

	// Minimum PHP version required to run this plugin
	const PHP_REQUIRED = '5.3';

	// Minimum WP version required to run this plugin
	const WP_REQUIRED = '4.0';

	protected static $_instance = null;

	// This gets filled from the constant, for more convenient access
	public $version;

	// An instance of UpdraftCentral_User
	public $user;

	// An instance of UpdraftCentral_Site_Meta
	public $site_meta;

	private $inited = false;

	private $notices = array();

	public $table_prefix;

	private $template_directories;

	public static function instance() {
		if (empty(self::$_instance)) {
			self::$_instance = new self();
		}

		return self::$_instance;
	}

	public function __construct() {

		$this->version = self::VERSION;

		// The shortcode will handle + provide output if running on an insufficient PHP/WP version; hence, this goes before the check/return.
		add_shortcode('updraft_central', array($this, 'shortcode'));

		if (version_compare(PHP_VERSION, self::PHP_REQUIRED, '<')) {
			add_action('all_admin_notices', array($this, 'admin_notice_insufficient_php'));
			$abort = true;
		}

		include ABSPATH.WPINC.'/version.php';
		if (version_compare($wp_version, self::WP_REQUIRED, '<')) {
			add_action('all_admin_notices', array($this, 'admin_notice_insufficient_wp'));
			$abort = true;
		}

		if (!empty($abort)) return;

		$this->table_prefix = defined('UPDRAFTCENTRAL_TABLE_PREFIX') ? UPDRAFTCENTRAL_TABLE_PREFIX : 'updraftcentral_';

		add_action('plugins_loaded', array($this, 'plugins_loaded'));
		add_action('init', array($this, 'wp_init'));
		register_activation_hook(__FILE__, array($this, 'activation_hook'));

		if (is_admin()) {
			add_action('admin_menu', array($this, 'admin_menu'));
			// Add settings link in plugin list
			$plugin = plugin_basename(__FILE__);
			add_filter('plugin_action_links_'.$plugin, array($this, 'plugin_action_links'));
			add_filter('network_admin_plugin_action_links_'.$plugin, array($this, 'plugin_action_links'));
		}

		// Possibly redirect on login back to the UC dashboard
		add_action('woocommerce_login_redirect', array($this, 'woocommerce_login_redirect'));

		add_action('updraftcentral_print_dashboard_notices', array($this, 'print_dashboard_notices'));

		if (!empty($_POST['updraftcentral_action']) && 'receive_key' == $_POST['updraftcentral_action']) {
			add_action('init', array($this, 'init_updraftcentral_action_receive_key'));
		}

		add_action('wp_ajax_updraftcentral_dashboard_ajax', array($this, 'updraftcentral_dashboard_ajax'));

		// Allow both bundled and external modules to hook into various parts of the dashboard
		$this->load_modules();

	}

	public function wp_init() {
		include_once UD_CENTRAL_DIR.'/classes/activation.php';
		UpdraftCentral_Activation::check_updates();
	}

	public function woocommerce_login_redirect($redirect_to) {
		return empty($_POST['updraftcentral_redirect_on_wc_login']) ? $redirect_to : $_POST['updraftcentral_redirect_on_wc_login'];
	}

	public function admin_notice_insufficient_php() {
		$this->show_admin_warning('<strong>'.__('Higher PHP version required', 'updraftcentral').'</strong><br> '.sprintf(__('The %s plugin requires %s version %s or higher - your current version is only %s.', 'updraftcentral'), 'UpdraftCentral', 'PHP', self::PHP_REQUIRED, PHP_VERSION), 'error');
	}

	public function admin_notice_insufficient_wp() {
		include ABSPATH.WPINC.'/version.php';
		$this->show_admin_warning('<strong>'.__('Higher WordPress version required', 'updraftcentral').'</strong><br> '.sprintf(__('The %s plugin requires %s version %s or higher - your current version is only %s.', 'updraftcentral'), 'UpdraftCentral', 'WordPress', self::WP_REQUIRED, $wp_version), 'error');
	}

	public function show_admin_warning($message, $class = 'updated') {
		echo '<div class="updraftcentral_message '.$class.'">'."<p>$message</p></div>";
	}

	public function admin_menu() {
		add_menu_page('UpdraftCentral', 'UpdraftCentral', 'manage_options', 'updraft-central', array($this, 'wp_dashboard_page'), UD_CENTRAL_URL.'/images/dashicon.png', 56.8467664);
	}

	/**
	 * These are also available from JS via udclion.common_urls
	 */
	public function get_common_urls() {
		return apply_filters('updraftcentral_common_urls', array(
			'support_forum' => 'https://wordpress.org/support/plugin/updraftcentral',
			'faqs' => 'https://updraftplus.com/updraftcentral-frequently-asked-questions/',
			'idea_suggestion' => 'https://updraftplus.com/make-a-suggestion',
			'first_link' => '<a href="http://updraftcentral.com">'.__('Home', 'updraftcentral').'</a>',
			'how_to_install' => 'https://updraftplus.com/faqs/how-do-i-install-updraftcentral/',
			'how_to_add_site' => 'https://updraftplus.com/updraftcentral-how-to-add-a-site/',
			'paid_support' => 'https://updraftplus.com/paid-support-requests/',
			'connection_checklist' => 'https://updraftplus.com/troubleshooting-updraftcentral-connection-issues/',
			'connection_advanced_issues' => 'https://updraftplus.com/faqs/how-can-i-control-a-site-that-has-access-controls-e-g-brower-password-ip-address-restrictions/',
			'get_licences' => false,
		));
	}

	public function is_premium_installed($also_require_active = false) {
		if ($also_require_active) return class_exists('UpdraftCentral_Premium');
		if (!function_exists('get_plugins')) include_once(ABSPATH.'wp-admin/includes/plugin.php');
		$plugins = get_plugins();
		$updraftcentral_premium_file = false;
		foreach ($plugins as $key => $value) {
			if ("updraftcentral-premium" == $value['TextDomain']) {
				$updraftcentral_premium_file = $key;
				break;
			}
		}
		return $updraftcentral_premium_file ? true : false;
	}
	
	public function wp_dashboard_page() {
		$extract_these = $this->get_common_urls();
		$this->include_template('wp-admin/dashboard-page.php', false, $extract_these);
	}

	public function init_updraftcentral_action_receive_key() {
		// @codingStandardsIgnoreLine
		@header('Content-Type: application/json');

		$response_array = array(
			'mothership' => 'thatsus',
			'mothership_info' => array('version' => self::VERSION),
		);

		if (empty($_POST['key'])) {
			$response_array['code'] = 'key_invalid';
			$response_array['message'] = 'Necessary data was not supplied';
		} else {

			global $wpdb;
			$ud_rpc = $this->get_udrpc('central_host.updraftplus.com', true);

			// Normally, key generation takes seconds, even on a slow machine. However, some Windows machines appear to have a setup in which it takes a minute or more. And then, if you're on a double-localhost setup on slow hardware - even worse. It doesn't hurt to just raise the maximum execution time.
		
			$key_generation_time_limit = (defined('UPDRAFTCENTRAL_SET_TIME_LIMIT') && is_numeric(UPDRAFTCENTRAL_SET_TIME_LIMIT) && UPDRAFTCENTRAL_SET_TIME_LIMIT > 10) ? UPDRAFTCENTRAL_SET_TIME_LIMIT : 900;

			// @codingStandardsIgnoreLine
			@set_time_limit($key_generation_time_limit);

			if (false != $ud_rpc->generate_new_keypair()) {
				$response_array['key_public'] = $ud_rpc->get_key_remote();
				$inserted = $this->wp_insert('site_temporary_keys', array('key_remote_public' => $_POST['key'], 'key_local_private' => $ud_rpc->get_key_local(), 'created' => time()), array('%s', '%s', '%d'));
				if ($inserted) {
					$response_array['key_id'] = $wpdb->insert_id;
				} else {
					$response_array['code'] = 'insert_error';
					$response_array['message'] = 'A database error occurred when attempting to load the key';
				}
			} else {
				$response_array['code'] = 'keygen_error';
				$response_array['message'] = 'An error occurred when attempting to generate a new key-pair';
			}

		}
		echo json_encode($response_array);
		die;
	}

	public function updraftcentral_dashboard_ajax() {
		if (empty($_REQUEST['subaction']) || empty($_REQUEST['nonce']) || empty($_REQUEST['component']) || !wp_verify_nonce($_REQUEST['nonce'], 'updraftcentral_dashboard_nonce')) die('Security check');

		if ('dashboard' != $_REQUEST['component']) die;

		$response = array();

		if (!$this->init()) {
			$response = array('responsetype' => 'error', 'code' => 'init_failure', 'message' => __('Error:', 'updraftcentral').' '.__('failed to initialise', 'updraftcentral'));
		} else {

			$post_data = stripslashes_deep($_POST);

			if (isset($post_data['data']) && is_array($post_data['data']) && isset($post_data['data']['site_id'])) {
				$site_id = (int) $post_data['data']['site_id'];
				if (!in_array($site_id, array_keys($this->user->sites))) {
					$response = array('responsetype' => 'error', 'code' => 'unauthorised', 'message' => __('Error:', 'updraftcentral').' '.__('you are not authorized to access this site', 'updraftcentral'));
				}
			}

			// Rememberm, if doing any processing here, that the site has not yet been checked as to whether it is licenced
		
			// Any data will be in $_REQUEST['data'];
			switch ($_REQUEST['subaction']) {
				default:
				$response = apply_filters('updraftcentral_dashboard_ajaxaction_'.$_REQUEST['subaction'], $response, $post_data);
					break;
			}

		}

		if (empty($response)) {
			$response['responsetype'] = 'error';
			$response['code'] = 'empty';
			$response['message'] = __('Error:', 'updraftcentral').' '.sprintf(__('This action (%s) could not be handled', 'updraftcentral'), $_REQUEST['subaction']);
		} elseif (is_wp_error($response)) {
			$new_response = array(
				'responsetype' => 'error',
				'code' => $response->get_error_code(),
				'message' => __('Error:', 'updraftcentral').' '.$response->get_error_message().' ('.$response->get_error_code().')',
				'data' => $response->get_error_data(),
			);
			$response = $new_response;
		}

		echo json_encode($response);

		die;

	}

	/**
	 * This shortcode function for [updraft_central] checks the user's access level, and then despatches to the appropriate page in the /pages sub-directory
	 *
	 * @param  array $atts
	 */
	public function shortcode($atts) {

		// Short-circuit plugins that run do_shortcode out-of-context (e.g. Relevansii)
		if (is_admin()) return '';

		if (version_compare(PHP_VERSION, self::PHP_REQUIRED, '<')) {
			return sprintf(__('The %s plugin requires %s version %s or higher - your current version is only %s.', 'updraftcentral'), 'UpdraftCentral', 'PHP', self::PHP_REQUIRED, PHP_VERSION);
		}
		include ABSPATH.WPINC.'/version.php';
		if (version_compare($wp_version, self::WP_REQUIRED, '<')) {
			return sprintf(__('The %s plugin requires %s version %s or higher - your current version is only %s.', 'updraftcentral'), 'UpdraftCentral', 'WordPress', self::WP_REQUIRED, $wp_version);
		}

		$atts = shortcode_atts(array(
			'page' => 'dashboard',
			'require_role' => 'administrator',
			'require_cap' => false,
		), $atts, 'updraft_central');

		// Security check - only valid characters
		if (!preg_match('/^[_a-z]+$/', $atts['page'])) return;

		ob_start();

		if (!is_user_logged_in()) {
			$this->include_template('dashboard/not-logged-in.php');
		} else {

			add_action('wp_footer', array($this, 'wp_footer'));

			if (!$this->init()) {

				// We want the notice styles
				$this->load_dashboard_css();

				// Get the header, which invokes the notice-printing actions
				$this->include_template('dashboard/header.php');

				// Print this, in case for some reason the notices don't display (or there weren't any)
				echo 'Setup error';

			} else {

				// Check they are a customer (i.e. have customer role)
				
				$require_role = empty($atts['require_role']) ? false : explode(',', str_replace(' ', '', $atts['require_role']));
				$require_cap = empty($atts['require_cap']) ? false : explode(',', str_replace(' ', '', $atts['require_cap']));

				if (!$this->access_role_check($atts['page'], $require_role, $require_cap)) {
					$this->include_template('dashboard/not-authorised.php');
				} elseif ('dashboard' == $atts['page']) {
					include_once UD_CENTRAL_DIR.'/pages/dashboard.php';
				}

			}

		}

		return ob_get_clean();
	}

	private function load_modules() {

		do_action('updraftcentral_load_modules');

		if (is_dir(UD_CENTRAL_DIR.'/modules') && $dir_handle = opendir(UD_CENTRAL_DIR.'/modules')) {
			while (false !== ($e = readdir($dir_handle))) {
				if (is_dir(UD_CENTRAL_DIR.'/modules/'.$e) && file_exists(UD_CENTRAL_DIR.'/modules/'.$e.'/loader.php') && apply_filters('updraftcentral_load_module', true, $e, UD_CENTRAL_DIR.'/modules')) {
					include_once UD_CENTRAL_DIR.'/modules/'.$e.'/loader.php';
				}
			}
			// @codingStandardsIgnoreLine
			@closedir($dir_handle);
		}

		do_action('updraftcentral_loaded_modules');

	}

	public function sort_navigation_items($a, $b) {
		if (!is_array($a) || !isset($a['sort_order']) || !is_numeric($a['sort_order'])) return 1;
		if (!is_array($b) || !isset($b['sort_order']) || !is_numeric($b['sort_order'])) return -1;
		if ($a['sort_order'] < $b['sort_order']) return -1;
		if ($a['sort_order'] > $b['sort_order']) return 1;

		return 0;
	}

	public function load_dashboard_js() {
		// @codingStandardsIgnoreLine
		$enqueue_version = @constant('WP_DEBUG') ? self::VERSION.'.'.time() : self::VERSION;

		$min_or_not = (defined('SCRIPT_DEBUG') && SCRIPT_DEBUG) ? '' : '.min';

		// https://github.com/alexei/sprintf.js
		wp_register_script('sprintf', UD_CENTRAL_URL.'/js/sprintf/sprintf'.$min_or_not.'.js', array(), '20151204');

		// https://github.com/digitalbazaar/forge
		wp_register_script('forge', UD_CENTRAL_URL.'/js/forge-js/forge.min.js', array(), '0.7.0');

		wp_register_script('class-udrpc', UD_CENTRAL_URL.'/js/class-udrpc'.$min_or_not.'.js', array('forge'), '0.3.3');

		/*
		// https://github.com/google/caja/
		wp_register_script('caja-html4-defs', UD_CENTRAL_URL.'/js/caja/html4-defs.js', array(), '20151215');
		wp_register_script('caja-uri', UD_CENTRAL_URL.'/js/caja/uri.js', array(), '20151215');
		wp_register_script('google-caja-sanitizer', UD_CENTRAL_URL.'/js/caja/sanitizer.js', array('caja-html4-defs', 'caja-uri'), '20151215');
		*/

		wp_register_script('tether', UD_CENTRAL_URL.'/js/tether/tether'.$min_or_not.'.js', array(), '1.4.0');

		// https://cdn.rawgit.com/twbs/bootstrap/v4-dev/dist/js/bootstrap(.min).js
		wp_register_script('bootstrap4', UD_CENTRAL_URL.'/vendor/twbs/bootstrap/dist/js/bootstrap'.$min_or_not.'.js', array('jquery', 'tether'), '4.0.0-alpha5');

		// https://github.com/makeusabrew/bootbox/releases/download/v(version)/bootbox(.min).js / http://bootboxjs.com/#download
		wp_register_script('bootbox', UD_CENTRAL_URL.'/js/bootbox/bootbox'.$min_or_not.'.js', array('bootstrap4'), '4.4.0');

		// https://github.com/iyogeshjoshi/google-caja-sanitizer/
		wp_register_script('google-caja-sanitizer', UD_CENTRAL_URL.'/js/caja/sanitizer'.$min_or_not.'.js', array(), '20150315');

		// Handlebars - http://www.handlebarsjs.com - https://github.com/wycats/handlebars.js
		// The "run-time" build handles only pre-compiled templates
		// Visit http://builds.handlebarsjs.com.s3.amazonaws.com/bucket-listing.html?sort=lastmod&sortdir=desc to spot the Git ID for new versions
		// http://builds.handlebarsjs.com.s3.amazonaws.com/handlebars.runtime.min-(Git ID).js - then rename it to match the non-minified version
		// http://builds.handlebarsjs.com.s3.amazonaws.com/handlebars.runtime-v(version).js
		// Rename them all to get rid of the version number from the file - ever-shifting filenames irritate when managing within SVN
		// For run-time - all templates must be pre-compiled
		// handlebars_file = 'handlebars.runtime'.$min_or_not.'.js';
		// For development - the full thing
		// @codingStandardsIgnoreLine
		$handlebars_file = (@constant('UPDRAFTCENTRAL_DEV_ENVIRONMENT') || apply_filters('updraftcentral_handlebars_full', false)) ? 'handlebars'.$min_or_not.'.js' : 'handlebars.runtime'.$min_or_not.'.js';
		wp_register_script('handlebars', UD_CENTRAL_URL.'/js/handlebars/'.$handlebars_file, array(), '4.0.5');

		// https://github.com/behigh/bootstrap_dropdowns_enhancement
		wp_register_script('bootstrap-dropdowns-enhancement', UD_CENTRAL_URL.'/js/dropdowns-enhancement/dropdowns-enhancement.js', array('jquery'), '1.1.0');

		// https://github.com/private-face/jquery.fullscreen
		wp_register_script('jquery-fullscreen', UD_CENTRAL_URL.'/js/jquery-fullscreen/jquery.fullscreen'.$min_or_not.'.js', array('jquery'), '0.5.1');
		wp_register_script('modernizr-custom', UD_CENTRAL_URL.'/js/modernizr/modernizr-custom'.$min_or_not.'.js', array(), '3.3.1');

		wp_register_script('updraftcentral-queue', UD_CENTRAL_URL.'/js/queue.js', array(), $enqueue_version);
		wp_register_script('d3-queue', UD_CENTRAL_URL.'/js/d3-queue/d3-queue'.$min_or_not.'.js', array(), '3.0.3');
		
		$library_deps = array('jquery', 'jquery-fullscreen', 'sprintf', 'google-caja-sanitizer', 'bootbox', 'handlebars','forge');
		wp_register_script('uc-library', UD_CENTRAL_URL.'/js/uc-library'.$min_or_not.'.js', $library_deps, $enqueue_version);

		$dashboard_deps = array('jquery', 'jquery-fullscreen', 'sprintf', 'class-udrpc', 'google-caja-sanitizer', 'bootbox', 'handlebars', 'bootstrap-dropdowns-enhancement', 'modernizr-custom', 'updraftcentral-queue','d3-queue','uc-library','jquery-ui-sortable');

		include ABSPATH.WPINC.'/version.php';
		global $wpdb;

		if (function_exists('curl_version')) {
			$curl_version = curl_version();
			$curl_version = $curl_version['version'];
			 if (!function_exists('curl_exec')) $curl_version .= '/Disabled';
		} else {
			$curl_version = '-';
		}

		$pass_to_js = array(
			'udc_version' => self::VERSION,
			'php_version' => PHP_VERSION,
			'wp_version' => $wp_version,
			'mysql_version' => $wpdb->db_version(),
			'curl_version' => $curl_version,
			'home_url' => home_url(),
			'handlebars' => $this->get_handlebars_data(),
			'show_licence_counts' => apply_filters('updraftcentral_show_licence_counts', false),
		);

		if (!empty($pass_to_js['handlebars']['enqueue'])) {
			$dashboard_deps[] = 'updraftcentral-handlebars-compiled';
			wp_register_script('updraftcentral-handlebars-compiled', $pass_to_js['handlebars']['enqueue']['url'], array('handlebars'), filemtime($pass_to_js['handlebars']['enqueue']['file']));
			unset($pass_to_js['handlebars']['enqueue']);
		}

		// Our dashboard framework
		wp_register_script('updraftcentral-dashboard', UD_CENTRAL_URL.'/js/dashboard'.$min_or_not.'.js', $dashboard_deps, $enqueue_version);

		$localize = array_merge(
			array('common_urls' => $this->get_common_urls()),
			$pass_to_js,
			include(UD_CENTRAL_DIR.'/dashboard-translations.php')
		);

		wp_localize_script('updraftcentral-dashboard', 'udclion', apply_filters('updraftcentral_udrclion', $localize));

		do_action('updraftcentral_load_dashboard_js', $enqueue_version);

	}

	public function get_templates_dir() {
		return apply_filters('updraftcentral_templates_dir', wp_normalize_path(UD_CENTRAL_DIR.'/templates'));
	}

	public function get_templates_url() {
		return apply_filters('updraftcentral_templates_url', UD_CENTRAL_URL.'/templates');
	}

	private function register_template_directories() {

		$template_directories = array();

		$templates_dir = $this->get_templates_dir();

		if ($dh = opendir($templates_dir)) {
			while (($file = readdir($dh)) !== false) {
				if ('.' == $file || '..' == $file) continue;
				if (is_dir($templates_dir.'/'.$file)) {
					$template_directories[$file] = $templates_dir.'/'.$file;
				}
			}
			closedir($dh);
		}

		// This is the optimal hook for most extensions to hook into
		$this->template_directories = apply_filters('updraftcentral_template_directories', $template_directories);

	}

	private function get_handlebars_data() {

		$templates_dir = $this->get_templates_dir();
		$templates_url = $this->get_templates_url();

		$handlebars = array('base' => $templates_url);

		$handlebars_compile = array();

		$compiled_file = apply_filters('updraftcentral_handlebars_templates_compiled_file', $templates_dir.'/handlebars-compiled.js');

		// @codingStandardsIgnoreLine
		if (!@constant('UPDRAFTCENTRAL_DEV_ENVIRONMENT') && file_exists($compiled_file)) {
			$handlebars['enqueue'] = apply_filters('updraftcentral_handlebars_templates_enqueue', array('url' => $templates_url.'/handlebars-compiled.js', 'file' => $compiled_file));
		}

		// @codingStandardsIgnoreLine
		if (@constant('UPDRAFTCENTRAL_DEV_ENVIRONMENT') || !file_exists($compiled_file)) {
			foreach ($this->template_directories as $prefix => $directory) {
				$templates = $this->register_handlebars_templates($prefix, $directory);
				$handlebars_compile = array_merge($handlebars_compile, $templates);
			}
		}

		$handlebars['compile'] = apply_filters('updraftcentral_handlebars_compile', $handlebars_compile);

		return $handlebars;
	}

	/**
	 * This method is for telling UpdraftCentral to recursively scan the indicated directory, and to add all found handlebars templates (i.e. ones ending in .handlebars.html) to the list of templates to (potentially) compile
	 *
	 * @param  string $prefix
	 * @param  string $directory
	 * @return array
	 */
	public function register_handlebars_templates($prefix, $directory) {

		$handlebars_compile = array();

		try {

			$directory_iterator = new RecursiveDirectoryIterator($directory);
			$iterator = new RecursiveIteratorIterator($directory_iterator);
			$regex = new RegexIterator($iterator, '/^.+\.handlebars\.html$/i', RecursiveRegexIterator::GET_MATCH);

			foreach ($regex as $files) {
				foreach ($files as $file) {
					$basename = substr($file, 1 + strlen($directory));
					$template_name = $prefix.'-'.str_replace('/', '-', wp_normalize_path(substr($basename, 0, -strlen('.handlebars.html'))));
					$get_template_from = apply_filters('updraftcentral_handlebars_template_file', $file, $template_name);
					$handlebars_compile[$template_name] = apply_filters('updraftcentral_handlebars_template_contents', file_get_contents($get_template_from), $template_name, $get_template_from);
				}

			}
		} catch (Exception $e) {
			error_log('UpdraftCentral: error when scanning for handlebars templates: '.$e->getMessage());
		}

		return $handlebars_compile;
	}

	public function load_dashboard_css() {
		// @codingStandardsIgnoreLine
		$enqueue_version = @constant('WP_DEBUG') ? self::VERSION.'.'.time() : self::VERSION;

		wp_enqueue_style('updraftcentral-dashboard-css', UD_CENTRAL_URL.'/css/dashboard.css', array('dashicons'), $enqueue_version);

		wp_enqueue_style('updraftcentral-mobile-css', UD_CENTRAL_URL.'/css/mobile.css', array('updraftcentral-dashboard-css'), $enqueue_version);

		// Temporary file for developers to add CSS in without stepping on the toes of people working on styling
		wp_enqueue_style('updraftcentral-dashboard-temp-css', UD_CENTRAL_URL.'/css/dashboard-temp.css', array('updraftcentral-dashboard-css'), $enqueue_version);

		do_action('updraftcentral_load_dashboard_css', $enqueue_version);

	}

	public function wp_footer() {
		// @codingStandardsIgnoreLine
		$bootstrap_file = @constant('SCRIPT_DEBUG') ? 'bootstrap' : 'bootstrap.min';
		// https://cdn.rawgit.com/twbs/bootstrap/v4-dev/dist/css/$bootstrap_file
		wp_enqueue_style('bootstrap4', UD_CENTRAL_URL."/vendor/twbs/bootstrap/dist/css/${bootstrap_file}.css", array(), '4.0.0-alpha5');

		// Old testing sandbox used PageLines; no longer; but perhaps someone else will be doing
		wp_dequeue_script('pagelines-bootstrap-all');

	}

	/**
	 * Runs upon the WordPress action plugins_loaded
	 */
	public function plugins_loaded() {
		load_plugin_textdomain('updraftcentral', false, basename(UD_CENTRAL_DIR).'/languages');
	}

	/**
	 * Verify whether the currently logged-in WP user is allowed to access the specified page (or any pages)
	 *
	 * @param Boolean|String $page		   - The page
	 * @param Boolean|String $require_role - Require the user to have a particular role
	 * @param Boolean		 $require_cap  - Require the user to have a particular capability
	 *
	 * @return Boolean - the result
	 */
	public function access_role_check($page = false, $require_role = false, $require_cap = false) {

		$current_user = wp_get_current_user();
		$user_roles = $current_user->roles;
		
		$allowed = false;
		
		if (is_super_admin()) $allowed = true;

		// With this option, *any* matching role grants access
		if (is_array($require_role) && !empty($require_role)) {
			foreach ($require_role as $rr) {
				if (in_array(trim(strtolower($rr)), $user_roles)) {
					$allowed = true;
					break;
				}
			}
		} else {
			$allowed = true;
		}

		// With this option, *all* specified capabilities are required
		if ($allowed && is_array($require_cap) && !empty($require_cap)) {
			foreach ($require_cap as $rc) {
				if (!current_user_can($rc)) {
					$allowed = false;
					break;
				}
			}
		}

		return apply_filters('updraftcentral_access_role_check', $allowed, $current_user, $page, $require_role, $require_cap);
	}

	public function activation_hook() {
		include_once UD_CENTRAL_DIR.'/classes/activation.php';
		UpdraftCentral_Activation::install();
	}

	public function log_notice($content, $level = 'error', $unique_id = false, $options = array()) {
		if (apply_filters('updraftcentral_log_notice', true, $content, $level, $unique_id)) {

			$defaults = array(
				'show_dismiss' => 'true'
			);

			$options = wp_parse_args($options, $defaults);

			$log_this = apply_filters('updraftcentral_log_notice_content', array('level' => $level, 'content' => $content, 'options' => $options), $level, $unique_id);

			if ($unique_id) {
				$this->notices[$unique_id] = $log_this;
			} else {
				$this->notices[] = $log_this;
			}

		}
	}

	public function print_dashboard_notices() {
		// We only want one notice area
		static $printed_notice_container = false;
		if ($printed_notice_container) return;
		$this->include_template('dashboard/notices.php', false, array('notices' => $this->notices));
		$printed_notice_container = true;
	}

	private function init() {
		if ($this->inited) return true;

		if (!is_user_logged_in()) return false;

		$this->register_template_directories();

		$user = wp_get_current_user();

		try {
			$this->user = $this->get_user_object($user->ID);
		} catch (Exception $e) {
			$failure = true;
			$this->log_notice($e->getMessage().' ('.get_class($e).')', 'error');
		}

		if (!class_exists('UpdraftCentral_Site_Meta')) include_once UD_CENTRAL_DIR.'/classes/site-meta.php';

		if (!class_exists('UpdraftCentral_Options')) include_once UD_CENTRAL_DIR.'/classes/updraftcentral-options.php';

		try {
			$this->site_meta = new UpdraftCentral_Site_Meta($this->table_prefix);
		} catch (Exception $e) {
			$failure = true;
			$this->log_notice($e->getMessage().' ('.get_class($e).')', 'error');
		}

		if (empty($failure)) {
			$this->inited = true;
			do_action('updraftcentral_inited');
		}

		return $this->inited;
	}

	public function get_user_object($user_id) {
		if (!class_exists('UpdraftCentral_User')) include_once UD_CENTRAL_DIR.'/classes/user.php';

		return new UpdraftCentral_User($user_id);
	}

	/**
	 * Gets an RPC object, and sets some defaults on it that we always want
	 *
	 * @param  string $indicator_name
	 * @return UpdraftPlus_Remote_Communications
	 */
	public function get_udrpc($indicator_name = 'central.updraftplus.com') {
		// Include composer autoload.php to get libraries
		include_once UD_CENTRAL_DIR.'/vendor/autoload.php';

		// Check if UpdraftPlus_Remote_Communications is present before including class-udrpc.php
		if (!class_exists('UpdraftPlus_Remote_Communications')) include_once UD_CENTRAL_DIR.'/classes/class-udrpc.php';
		
		$ud_rpc = new UpdraftPlus_Remote_Communications($indicator_name);
		$ud_rpc->set_can_generate(true);

		return $ud_rpc;
	}

	public function plugin_action_links($links) {

		$link = '<a href="'.admin_url('admin.php?page=updraft-central').'">'.__('Settings', 'updraftcentral').'</a>';
		array_unshift($links, $link);

		$link2 = '<a href="http://updraftcentral.com">'.__('UpdraftCentral website', 'updraftcentral').'</a>';

		array_unshift($links, $link2);

		return $links;
	}

	public function include_template($path, $return_instead_of_echo = false, $extract_these = array()) {
		if ($return_instead_of_echo) ob_start();

		if (preg_match('#^([^/]+)/(.*)$#', $path, $matches)) {
			$prefix = $matches[1];
			$suffix = $matches[2];
			if (isset($this->template_directories[$prefix])) {
				$template_file = $this->template_directories[$prefix].'/'.$suffix;
			}
		}

		// @codingStandardsIgnoreStart
		// Not yet used
		// 	public function wp_get_var($table, $where) {
		// 		global $wpdb;
		// 		$var = $wpdb->get_var("SELECT * FROM ".$wpdb->base_prefix.$this->table_prefix.$table." WHERE ".$where);
		// 		if (null === $var && !empty($wpdb->last_error)) return new WP_Error('database_getvar_error', $wpdb->last_error);
		// 		return $var;
		// 	}
		// @codingStandardsIgnoreEnd

		if (!isset($template_file)) {
			$template_file = UD_CENTRAL_DIR.'/templates/'.$path;
		}

		$template_file = apply_filters('updraftcentral_template', $template_file, $path);

		do_action('updraftcentral_before_template', $path, $template_file, $return_instead_of_echo, $extract_these);

		if (!file_exists($template_file)) {
			error_log("UpdraftCentral: template not found: $template_file");
			echo __('Error:', 'updraftcentral').' '.__('template not found', 'updraftcentral')." ($path)";
		} else {
			extract($extract_these);
			$updraft_central = $this;
			include $template_file;
		}

		do_action('updraftcentral_after_template', $path, $template_file, $return_instead_of_echo, $extract_these);

		if ($return_instead_of_echo) return ob_get_clean();
	}

	public function wp_get_row($table, $where) {
		global $wpdb;
		$row = $wpdb->get_row('SELECT * FROM '.$wpdb->base_prefix.$this->table_prefix.$table.' WHERE '.$where);
		if (null === $row && !empty($wpdb->last_error)) return new WP_Error('database_get_row_error', $wpdb->last_error);

		return $row;
	}

	/**
	 * Performs a database delete operation. A thin layer on WPDB::delete().
	 *
	 * @see    WPDB::delete()
	 * @param  String $table - the table to delete from (without any of our prefixes)
	 * @param  Array  $where - A named array of WHERE clauses (in column/value pairs)
	 * @return Integer|WP_Error - the number of rows deleted, or a WP_Error object
	 */
	public function wp_delete($table, $where) {
		global $wpdb;
		$deleted = $wpdb->delete($wpdb->base_prefix.$this->table_prefix.$table, $where);
		if (false === $deleted) return new WP_Error('database_delete_error', $wpdb->last_error);

		return $deleted;
	}

	/**
	 * Performs a database insert operation. A thin layer on WPDB::insert().
	 *
	 * @see    WPDB::insert()
	 * @param  String 			 $table  - the table to insert into (without any of our prefixes)
	 * @param  Array 			 $data   - A named array of column/value pairs
	 * @param  Array|String|null $format - An array of formats to be mapped to each of the value in $data. If string, that format will be used for all of the values in $data.
	 * @return Integer|WP_Error - the number of rows inserted, or a WP_Error object
	 */
	public function wp_insert($table, $data, $format = null) {
		global $wpdb;
		$inserted = $wpdb->insert($wpdb->base_prefix.$this->table_prefix.$table, $data, $format);
		if (false === $inserted) return new WP_Error('database_add_error', $wpdb->last_error);

		return $inserted;
	}

	/**
	 * Performs a database update operation. A thin layer on WPDB::update().
	 *
	 * @see WPDB::insert()
	 * @param  String 			 $table  	   - the table to insert into (without any of our prefixes)
	 * @param  Array 			 $data 		   - A named array of column/value pairs
	 * @param  Array 			 $where 	   - A named array of WHERE clauses (in column/value pairs)
	 * @param  Array|String|null $format 	   - An array of formats to be mapped to each of the value in $data. If string, that format will be used for all of the values in $data.
	 * @param  Array|String|null $where_format - An array of formats to be mapped to each of the value in $where. If string, that format will be used for all of the values in $data.
	 * @return Integer|WP_Error - the number of rows updated, or a WP_Error object
	 */
	public function wp_update($table, $data, $where, $format = null, $where_format = null) {
		global $wpdb;
		$updated = $wpdb->update($wpdb->base_prefix.$this->table_prefix.$table, $data, $where, $format, $where_format);
		if (false === $updated) return new WP_Error('database_update_error', $wpdb->last_error);

		return $updated;
	}

	/**
	 * Does not have to (and should not be relied upon to) be able to infallibly detect
	 *
	 * @param  string $url
	 * @return boolean
	 */
	public function url_looks_internal($url) {
		$url_host = strtolower(parse_url($url, PHP_URL_HOST));
		if (0 === strpos($url_host, 'localhost') || strpos($url_host, '127.') === 0 || strpos($url_host, '10.') === 0 || '::1' == $url_host || substr($url_host, -10, 10) == '.localhost' || substr($url_host, -4, 4) == '.dev' || '.localdomain' == substr($url_host, -12, 12)) return true;

		return false;
	}
}

endif;

function UpdraftCentral() {
	return UpdraftCentral::instance();
}

$GLOBALS['updraft_central'] = UpdraftCentral();
