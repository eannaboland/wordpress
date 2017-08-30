<?php
/**
 * Plugin Name: Goodlayers Soccer
 * Plugin URI: http://goodlayers.com/
 * Description: 
 * Version: 1.0.0
 * Author: Goodlayers
 * Author URI: http://goodlayers.com/
 * License: 
 */
	
	include_once('framework/meta-template.php');
	include_once('framework/player-option.php');
	include_once('framework/league-table-option.php');
	include_once('framework/fixtures-results-option.php');
	include_once('framework/admin-option.php');
	
	include_once('include/utility.php');
	include_once('include/player-item.php');
	include_once('include/league-table-item.php');
	include_once('include/fixture-result-item.php');
	
	//include_once('framework/quiz-option.php');
	//include_once('framework/user.php');
	//include_once('framework/table-management.php');
	//include_once('include/login-form.php');
	
	//include_once('include/misc.php');
	//include_once('include/shortcode.php');
	//include_once('include/lightbox-form.php');
	//include_once('include/course-item.php');
	//include_once('include/instructor-item.php');
	//
	//include_once('framework/plugin-option/recent-course-widget.php');
	//include_once('framework/plugin-option/popular-course-widget.php');
	//include_once('framework/plugin-option/course-category-widget.php');
	
	// action to load plugin script
	// include script for front end
	add_action( 'wp_enqueue_scripts', 'gdlr_soccer_include_script' );
	function gdlr_soccer_include_script(){
		wp_enqueue_script( 'gdlr-soccer-script', plugins_url('javascript/gdlr-soccer.js', __FILE__), array(), '1.0.0', true );
	}
	
	// action to loaded the plugin translation file
	add_action('plugins_loaded', 'gdlr_lms_textdomain_init');
	if( !function_exists('gdlr_lms_textdomain_init') ){
		function gdlr_lms_textdomain_init() {
			load_plugin_textdomain('gdlr-soccer', false, dirname(plugin_basename( __FILE__ ))  . '/languages/'); 
		}
	}	
	
?>