<?php

if (!defined('UD_CENTRAL_DIR')) die('Security check');

class UpdraftCentral_Module_UpdraftPlus {
	const MODULE_NAME = 'updraftplus';

	public function __construct() {
		add_action('updraftcentral_load_dashboard_js', array($this, 'load_dashboard_js'));
		add_action('updraftcentral_load_dashboard_css', array($this, 'load_dashboard_css'));
		add_filter('updraftcentral_udrclion', array($this, 'udrclion'));
		add_action('updraftcentral_dashboard_post_navigation', array($this, 'dashboard_post_navigation'));
		add_filter('updraftcentral_main_navigation_items', array($this, 'main_navigation_items'));
		add_action('updraftcentral_site_row_after_buttons', array($this, 'site_row_after_buttons'));
		add_filter('updraftcentral_template_directories', array($this, 'template_directories'));
	}

	public function template_directories($template_directories) {
		$template_directories[self::MODULE_NAME] = __DIR__.'/templates';

		return $template_directories;
	}

	public function site_row_after_buttons() {
		UpdraftCentral()->include_template(self::MODULE_NAME.'/site-row-buttons.php');
	}

	public function load_dashboard_css($enqueue_version) {
		wp_enqueue_style('jquery-labelauty', UD_CENTRAL_URL.'/modules/'.self::MODULE_NAME.'/jquery-labelauty.css', array(), '20160622-ud');
		wp_enqueue_style('updraftcentral-dashboard-css-'.self::MODULE_NAME, UD_CENTRAL_URL.'/modules/'.self::MODULE_NAME.'/'.self::MODULE_NAME.'.css', array('updraftcentral-dashboard-css'), $enqueue_version);
	}

	public function load_dashboard_js($enqueue_version) {
		$min_or_not = (defined('SCRIPT_DEBUG') && SCRIPT_DEBUG) ? '' : '.min';
		
		// Code on top of the framework for doing actual work
		wp_register_script('jquery-labelauty', UD_CENTRAL_URL.'/modules/'.self::MODULE_NAME.'/jquery-labelauty.js', array('jquery'), '20150925');

		wp_enqueue_script('updraftcentral-dashboard-activities-'.self::MODULE_NAME, UD_CENTRAL_URL.'/modules/'.self::MODULE_NAME.'/'.self::MODULE_NAME.$min_or_not.'.js', array('updraftcentral-dashboard', 'jquery-labelauty'), $enqueue_version);
	}

	public function main_navigation_items($items) {
		$items['backups'] = array('label' => __('Backups', 'updraftcentral'), 'sort_order' => 20);

		return $items;
	}

	public function udrclion($localize) {
		$localize['updraftplus'] = include __DIR__.'/translations-dashboard.php';

		return $localize;
	}

	public function dashboard_post_navigation() {
		global $updraft_central;
		$updraft_central->include_template(self::MODULE_NAME.'/management-actions.php');
	}
}

$updraftcentral_module_updraftplus = new UpdraftCentral_Module_UpdraftPlus();
