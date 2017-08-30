<?php
	
if (!defined('UD_CENTRAL_DIR')) die('Security check');

class UpdraftCentral_Module_Notices {

	const MODULE_NAME = 'notices';
	
	public function __construct() {
		add_action('updraftcentral_load_dashboard_css', array($this, 'load_dashboard_css'));
		add_action('updraftcentral_dashboard_post_navigation', array($this, 'dashboard_post_navigation'));
		add_action('updraftcentral_dashboard_pre_header', array($this, 'dashboard_pre_header'));
		add_action('updraftcentral_dashboard_post_content', array($this, 'dashboard_post_content'));
		add_filter('updraftcentral_main_navigation_items', array($this, 'main_navigation_items'));
		add_filter('updraftcentral_template_directories', array($this, 'template_directories'));
		add_action('updraftcentral_dashboard_ajaxaction_dismiss_notice', array($this, 'dashboard_ajaxaction_dismiss_notice'), 10, 2);
	}

	public function template_directories($template_directories) {
		$template_directories[self::MODULE_NAME] = __DIR__.'/templates';
		return $template_directories;
	}

	public function load_dashboard_css($enqueue_version) {
		wp_enqueue_style('updraftcentral-dashboard-css-'.self::MODULE_NAME, UD_CENTRAL_URL.'/modules/'.self::MODULE_NAME.'/'.self::MODULE_NAME.'.css', array('updraftcentral-dashboard-css'), $enqueue_version);
	}
	
	public function main_navigation_items($items) {
	
		if (!UpdraftCentral()->is_premium_installed() || (defined('UPDRAFTCENTRAL_NOTICES_SHOW_ALWAYS') && UPDRAFTCENTRAL_NOTICES_SHOW_ALWAYS)) {

			$items[self::MODULE_NAME] = array('label' => __('Upgrade', 'updraftcentral'), 'sort_order' => 1000);

		}
		
		return $items;
	}

	public function dashboard_post_navigation() {
		UpdraftCentral()->include_template(self::MODULE_NAME.'/management-actions.php');
	}

	public function dashboard_post_content() {
		UpdraftCentral()->include_template(self::MODULE_NAME.'/notice-upgrade.php');
	}

	public function dashboard_pre_header() {
		if (!class_exists('UpdraftCentral_Notices')) include_once(__DIR__.'/updraftcentral-notices.php');
		global $updraftcentral_notices;
		$notice = $updraftcentral_notices->do_notice(false, 'top', true);
		if (!empty($notice)) {
			UpdraftCentral()->log_notice($notice, 'info', 'updraftcentral_notice', array('extra_classes' => array('remove_after_load'), 'show_dismiss' => false));
		}
	}

	public function dashboard_ajaxaction_dismiss_notice() {
		UpdraftCentral_Options::update_option('dismissed_general_notices_until', time() + 84*86400);
	}
}

new UpdraftCentral_Module_Notices();
