<?php
	/*	
	*	Goodlayers League Table Option File
	*/	
	 
	// create the league table post type
	add_action( 'init', 'gdlr_soccer_create_league_table' );
	function gdlr_soccer_create_league_table() {
		register_post_type( 'league_table',
			array(
				'labels' => array(
					'name'               => __('League Table', 'gdlr-soccer'),
					'singular_name'      => __('League Table', 'gdlr-soccer'),
					'add_new'            => __('Add New', 'gdlr-soccer'),
					'add_new_item'       => __('Add New league table', 'gdlr-soccer'),
					'edit_item'          => __('Edit league table', 'gdlr-soccer'),
					'new_item'           => __('New league table', 'gdlr-soccer'),
					'all_items'          => __('All league tables', 'gdlr-soccer'),
					'view_item'          => __('View league table', 'gdlr-soccer'),
					'search_items'       => __('Search league tables', 'gdlr-soccer'),
					'not_found'          => __('No league table found', 'gdlr-soccer'),
					'not_found_in_trash' => __('No league table found in Trash', 'gdlr-soccer'),
					'parent_item_colon'  => '',
					'menu_name'          => __('League Tables', 'gdlr-soccer')
				),
				'public'             => true,
				'publicly_queryable' => true,
				'show_ui'            => true,
				'show_in_menu'       => true,
				'query_var'          => true,
				//'rewrite'            => array( 'slug' => 'league_table'  ),
				'has_archive'        => true,
				'hierarchical'       => false,
				'menu_position'      => 5,
				'exclude_from_search' => true,
				'supports'           => array( 'title', 'author', 'thumbnail', 'custom-fields' )
			)
		);	
		
		// create league categories
		register_taxonomy(
			'league_category', array("league_table"), array(
				'hierarchical' => true,
				'show_admin_column' => true,
				'label' => __('League Categories', 'gdlr-soccer'), 
				'singular_label' => __('League Category', 'gdlr-soccer'), 
				'rewrite' => array( 'slug' => 'league_category'  )));
		register_taxonomy_for_object_type('league_category', 'league_table');		
		
		add_filter('single_template', 'gdlr_soccer_register_league_table_template');
	}
	
	// register single league table template
	function gdlr_soccer_register_league_table_template($template) {
		global $wpdb, $post, $current_user;

		if( $post->post_type == 'league_table' ){
			$template = get_template_directory() . '/404.php';
		}
		
		return $template;	
	}

	// enqueue the necessary admin script
	add_action('admin_enqueue_scripts', 'gdlr_soccer_league_table_script');
	function gdlr_soccer_league_table_script() {
		global $post; if( !empty($post) && $post->post_type != 'league_table' ) return;
		
		wp_enqueue_style('gdlr-soccer-meta-box', plugins_url('/stylesheet/meta-box.css', __FILE__));
		wp_enqueue_style('gdlr-date-picker', 'http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.2/themes/smoothness/jquery-ui.css');
		
		wp_enqueue_script('jquery-ui-datepicker');	
		wp_enqueue_script('jquery-ui-core');
		wp_enqueue_script('jquery-ui-slider');	
		wp_enqueue_script('gdlr-soccer-meta-box', plugins_url('/javascript/meta-box.js', __FILE__));
	}

	// add the league table option
	add_action('add_meta_boxes', 'gdlr_soccer_add_league_table_meta_box');	
	add_action('pre_post_update', 'gdlr_soccer_save_league_table_meta_box');
	function gdlr_soccer_add_league_table_meta_box(){
		add_meta_box('league-table-option', __('League Table Option', 'gdlr-soccer'), 
			'gdlr_soccer_create_league_table_meta_box', 'league_table', 'normal', 'high');
	}
	function gdlr_soccer_create_league_table_meta_box(){
		global $post;

?>
<style type="text/css"> #edit-slug-box{display: none !important;} </style>
<?php
		
		// Add an nonce field so we can check for it later.
		wp_nonce_field('league_table_meta_box', 'league_table_meta_box_nonce');

		/////////////////
		//// setting ////
		/////////////////
		
		$league_table_val = gdlr_lms_decode_preventslashes(get_post_meta($post->ID, 'gdlr-soccer-league-table-settings', true));
		$league_table_settings_val = empty($league_table_val)? array(): json_decode($league_table_val, true);
		
		// flag
		echo '<div class="gdlr-lms-meta-wrapper">';
		$flag = array(
			'title' => __('Team Flag', 'gdlr-soccer'),
			'type' => 'upload',
			'slug' => 'flag',
			'wrapper-class' => 'team-flag-wrapper',
			'value' => (empty($league_table_settings_val['flag'])? '': $league_table_settings_val['flag'])
		);
		gdlr_lms_print_meta_box($flag);
		
		$league_table_settings = array(
			'win' => array(
				'title' => __('Wins', 'gdlr-soccer'),
				'type' => 'text',
				'class' => 'medium',
			),
			'draw' => array(
				'title' => __('Draws', 'gdlr-soccer'),
				'type' => 'text',
				'class' => 'medium',
			),
			'lose' => array(
				'title' => __('Loses', 'gdlr-soccer'),
				'type' => 'text',
				'class' => 'medium',
			),
			'goal-score' => array(
				'title' => __('Goals Scored', 'gdlr-soccer'),
				'type' => 'text',
				'class' => 'medium',
			),
			'goal-concede' => array(
				'title' => __('Goals Conceded', 'gdlr-soccer'),
				'type' => 'text',
				'class' => 'medium',
			),		
		);

		echo '<div class="gdlr-lms-meta-inner gdlr-left">';
		echo '<h3>' . __('Home', 'gdlr-soccer') .  '</h3>';
		foreach($league_table_settings as $slug => $league_table_setting){
			$league_table_setting['slug'] = 'home-' . $slug;
			$league_table_setting['value'] = isset($league_table_settings_val['home-' . $slug])? $league_table_settings_val['home-' . $slug]: '';
			gdlr_lms_print_meta_box($league_table_setting);
		}
		$league_table_settings_val['sticky'] = empty($league_table_settings_val['sticky'])? '': $league_table_settings_val['sticky'];
		gdlr_lms_print_meta_box(array(
			'title' => __('Always show in League Table (summary)', 'gdlr-soccer'),
			'type' => 'checkbox',
			'default' => 'disable',
			'slug' => 'sticky',
			'value' => $league_table_settings_val['sticky']
		));
		echo '</div>';
		
		echo '<div class="gdlr-lms-meta-inner gdlr-right">';
		echo '<h3>' . __('Away', 'gdlr-soccer') .  '</h3>';
		foreach($league_table_settings as $slug => $league_table_setting){
			$league_table_setting['slug'] = 'away-' . $slug;
			$league_table_setting['value'] = isset($league_table_settings_val['away-' . $slug])? $league_table_settings_val['away-' . $slug]: '';
			gdlr_lms_print_meta_box($league_table_setting);
		}		
		echo '</div>';
		echo '<div class="clear"></div>';
		
		echo '<textarea name="gdlr-soccer-league-table-settings">' . esc_textarea($league_table_val) . '</textarea>';
		echo '</div>'; // gdlr-lms-meta-wrapper
	}
	function gdlr_soccer_save_league_table_meta_box($post_id){
	
		// verify nonce & user's permission
		if(!isset($_POST['league_table_meta_box_nonce'])){ return; }
		if(!wp_verify_nonce($_POST['league_table_meta_box_nonce'], 'league_table_meta_box')){ return; }
		if(!current_user_can('edit_post', $post_id)){ return; }

		// save value
		if( isset($_POST['gdlr-soccer-league-table-settings']) ){
			update_post_meta($post_id, 'gdlr-soccer-league-table-settings', gdlr_lms_preventslashes($_POST['gdlr-soccer-league-table-settings']));
		}
		
	}
	
	// add the function to collaborate with page builder
	add_filter('gdlr_page_builder_option', 'gdlr_register_league_table_item');
	function gdlr_register_league_table_item( $page_builder = array() ){
		global $gdlr_spaces;
	
		$page_builder['content-item']['options']['league-table'] = array(
			'title'=> __('League Table', 'gdlr-soccer'), 
			'type'=>'item',
			'options'=>array_merge(gdlr_page_builder_title_option(true), array(					
				'category'=> array(
					'title'=> __('Category' ,'gdlr-soccer'),
					'type'=> 'multi-combobox',
					'options'=> gdlr_get_term_list('league_category'),
					'description'=> __('You can use Ctrl/Command button to select multiple categories or remove the selected category. <br><br> Leave this field blank to select all categories.', 'gdlr-portfolio')
				),	
				'style'=> array(
					'title'=> __('Table Style' ,'gdlr-soccer'),
					'type'=> 'combobox',
					'options'=> array(	
						'full' => __('Full', 'gdlr-soccer'),
						'summary' => __('Summary', 'gdlr-soccer')
					),
					'description'=> __('You can use Ctrl/Command button to select multiple categories or remove the selected category. <br><br> Leave this field blank to select all categories.', 'gdlr-portfolio')
				),		
				'num-display' => array(
					'title' => __('Display Number' ,'gdlr-soccer'),
					'type' => 'text',
					'default' => 8,
					'wrapper-class' => 'style-wrapper summary-wrapper'
				),			
				'button-text' => array(
					'title' => __('View Full Table Text' ,'gdlr-soccer'),
					'type' => 'text',
					'default' => __('View Full Table' ,'gdlr-soccer'),
					'wrapper-class' => 'style-wrapper summary-wrapper'
				),		
				'button-link' => array(
					'title' => __('View Full Table Link' ,'gdlr-soccer'),
					'type' => 'text',
					'wrapper-class' => 'style-wrapper summary-wrapper'
				),
				'margin-bottom' => array(
					'title' => __('Margin Bottom', 'gdlr-soccer'),
					'type' => 'text',
					'default' => $gdlr_spaces['bottom-item'],
					'description' => __('Spaces after ending of this item', 'gdlr-soccer')
				),				
			))
		);
		return $page_builder;
	}

?>