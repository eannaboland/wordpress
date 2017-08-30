<?php
	/*	
	*	Goodlayers Fixtures Results Option File
	*/	
	 
	// create the fixture and result post type
	add_action( 'init', 'gdlr_soccer_create_fixtures_results' );
	function gdlr_soccer_create_fixtures_results() {
		register_post_type( 'fixture_and_result',
			array(
				'labels' => array(
					'name'               => __('Fixtures & Results', 'gdlr-soccer'),
					'singular_name'      => __('Fixture & Result', 'gdlr-soccer'),
					'add_new'            => __('Add New', 'gdlr-soccer'),
					'add_new_item'       => __('Add New fixture & result', 'gdlr-soccer'),
					'edit_item'          => __('Edit fixture & result', 'gdlr-soccer'),
					'new_item'           => __('New fixture & result', 'gdlr-soccer'),
					'all_items'          => __('All fixtures & results', 'gdlr-soccer'),
					'view_item'          => __('View fixture & result', 'gdlr-soccer'),
					'search_items'       => __('Search fixtures & results', 'gdlr-soccer'),
					'not_found'          => __('No fixtures & results found', 'gdlr-soccer'),
					'not_found_in_trash' => __('No fixtures & results found in Trash', 'gdlr-soccer'),
					'parent_item_colon'  => '',
					'menu_name'          => __('Fixtures & Results', 'gdlr-soccer')
				),
				'public'             => true,
				'publicly_queryable' => true,
				'show_ui'            => true,
				'show_in_menu'       => true,
				'query_var'          => true,
				//'rewrite'            => array( 'slug' => 'fixture_and_result'  ),
				'has_archive'        => true,
				'hierarchical'       => false,
				'menu_position'      => 5,
				'supports'           => array( 'title', 'author', 'thumbnail', 'custom-fields' )
			)
		);	

		register_taxonomy(
			'result_category', array("fixture_and_result"), array(
				'hierarchical' => true,
				'show_admin_column' => true,
				'label' => __('Result Categories', 'gdlr-soccer'), 
				'singular_label' => __('Result Category', 'gdlr-soccer'), 
				'rewrite' => array( 'slug' => 'result_category'  )));
		register_taxonomy_for_object_type('result_category', 'fixture_and_result');		
		
		add_filter('single_template', 'gdlr_soccer_register_fixture_result_template');
	}
	
	// register single fixture and result template
	function gdlr_soccer_register_fixture_result_template($template) {
		global $wpdb, $post, $current_user;

		if( $post->post_type == 'fixture_and_result' ){
			$template = dirname(dirname( __FILE__ )) . '/single-fixture-result.php';
		}
		
		return $template;	
	}

	// enqueue the necessary admin script
	add_action('admin_enqueue_scripts', 'gdlr_soccer_fixture_result_script');
	function gdlr_soccer_fixture_result_script() {
		global $post; if( !empty($post) && $post->post_type != 'fixture_and_result' ) return;
		
		wp_enqueue_style('gdlr-soccer-meta-box', plugins_url('/stylesheet/meta-box.css', __FILE__));
		wp_enqueue_style('gdlr-date-picker', 'http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.2/themes/smoothness/jquery-ui.css');
		
		wp_enqueue_script('jquery-ui-datepicker');	
		wp_enqueue_script('jquery-ui-core');
		wp_enqueue_script('jquery-ui-slider');	
		wp_enqueue_script('gdlr-soccer-meta-box', plugins_url('/javascript/meta-box.js', __FILE__));
	}

	// add the fixture and result option
	add_action('add_meta_boxes', 'gdlr_soccer_add_fixture_result_meta_box');	
	add_action('pre_post_update', 'gdlr_soccer_save_fixture_result_meta_box');
	function gdlr_soccer_add_fixture_result_meta_box(){
		add_meta_box('fixture-result-option', __('Fixture & Result Option', 'gdlr-soccer'), 
			'gdlr_soccer_create_fixture_result_meta_box', 'fixture_and_result', 'normal', 'high');
	}
	function gdlr_soccer_create_fixture_result_meta_box(){
		global $post;
		
		// Add an nonce field so we can check for it later.
		wp_nonce_field('fixture_result_meta_box', 'fixture_result_meta_box_nonce');

		/////////////////
		//// setting ////
		/////////////////
		
		$fixture_result_settings = array(
			'competition' => array(
				'title' => __('Competition', 'gdlr-soccer'),
				'type' => 'text',
			),
			'home-flag' => array(
				'title' => __('Home Team Flag', 'gdlr-soccer'),
				'type' => 'upload',
				'slug' => 'flag',
			),
			'away-flag' => array(
				'title' => __('Away Team Flag', 'gdlr-soccer'),
				'type' => 'upload',
				'slug' => 'flag',
				'wrapper-class' => 'team-flag-wrapper'
			),
		
			'home' => array(
				'title' => __('Home Team', 'gdlr-soccer'),
				'type' => 'text',
				'wrapper-class' => 'gdlr-lms-left',
			),
			'home-goal' => array(
				'title' => __('Goal', 'gdlr-soccer'),
				'type' => 'text',
				'class' => 'small',
				'wrapper-class' => 'gdlr-lms-left',
				//'description' => __('* Leave this field blank if the match hasn\'t start yet.', 'gdlr-soccer')
			),
			'home-point' => array(
				'title' => __('Point', 'gdlr-soccer'),
				'type' => 'text',
				'class' => 'small',
				'wrapper-class' => 'gdlr-lms-right',
				'description' => __('* Leave this field blank if the match hasn\'t start yet.', 'gdlr-soccer')
			),
			'away' => array(
				'title' => __('Away Team', 'gdlr-soccer'),
				'type' => 'text',
				'wrapper-class' => 'gdlr-lms-left',
			),
			'away-goal' => array(
				'title' => __('Goal', 'gdlr-soccer'),
				'type' => 'text',
				'class' => 'small',
				'wrapper-class' => 'gdlr-lms-left',
				//'description' => __('* Leave this field blank if the match hasn\'t start yet.', 'gdlr-soccer')
			),
			'away-point' => array(
				'title' => __('Point', 'gdlr-soccer'),
				'type' => 'text',
				'class' => 'small',
				'wrapper-class' => 'gdlr-lms-right',
				'description' => __('* Leave this field blank if the match hasn\'t start yet.', 'gdlr-soccer')
			),
			'referee' => array(
				'title' => __('Referee', 'gdlr-soccer'),
				'type' => 'text',
				//'wrapper-class' => 'gdlr-lms-left',
			),
			'date-of-match' => array(
				'title' => __('Date Of Match', 'gdlr-soccer'),
				'type' => 'datepicker',
			),	
			'match-time' => array(
				'title' => __('Match Time', 'gdlr-soccer'),
				'type' => 'text',
				'description' => __('* have to be in HH:MM format', 'gdlr-soccer')
			),	
			'location' => array(
				'title' => __('Location', 'gdlr-soccer'),
				'type' => 'textarea',
			),
			'show-match-detail' => array(
				'title' => __('Show Match Detail Before Date Of Match', 'gdlr-soccer'),
				'type' => 'checkbox',
				'default' => 'enable'
			),	
		);

		$fixture_result_val = gdlr_lms_decode_preventslashes(get_post_meta($post->ID, 'gdlr-soccer-fixture-result-settings', true));
		$fixture_result_settings_val = empty($fixture_result_val)? array(): json_decode($fixture_result_val, true);

		echo '<div class="gdlr-lms-meta-wrapper">';
		echo '<h3>' . __('Fixtures & Result', 'gdlr-soccer') . '</h3>';
		foreach($fixture_result_settings as $slug => $fixture_result_setting){
			$fixture_result_setting['slug'] = $slug;
			$fixture_result_setting['value'] = (!isset($fixture_result_settings_val[$slug]))? '': $fixture_result_settings_val[$slug];
			gdlr_lms_print_meta_box($fixture_result_setting);
		}
		
		echo '<div class="clear" style="height: 40px;"></div>';
		echo '<h3>' . __('Match Report', 'gdlr-soccer') . '</h3>';
		gdlr_lms_print_meta_box(array(
			'slug' => 'match-report',
			'value' => empty($fixture_result_settings_val['match-report'])? '': $fixture_result_settings_val['match-report'],
			'type' => 'wysiwyg'
		));
		
		echo '<textarea name="gdlr-soccer-fixture-result-settings">' . esc_textarea($fixture_result_val) . '</textarea>';
		echo '</div>';
	}
	function gdlr_soccer_save_fixture_result_meta_box($post_id){
	
		// verify nonce & user's permission
		if(!isset($_POST['fixture_result_meta_box_nonce'])){ return; }
		if(!wp_verify_nonce($_POST['fixture_result_meta_box_nonce'], 'fixture_result_meta_box')){ return; }
		if(!current_user_can('edit_post', $post_id)){ return; }

		// save value
		if( isset($_POST['gdlr-soccer-fixture-result-settings']) ){
			$far_val = $_POST['gdlr-soccer-fixture-result-settings']; 
			$far_options = empty($far_val)? array(): json_decode(stripslashes($far_val), true);
			
			update_post_meta($post_id, 'gdlr-soccer-fixture-result-settings', gdlr_lms_preventslashes($far_val));
			update_post_meta($post_id, 'gdlr-start-date', $far_options['date-of-match'] . ' ' . $far_options['match-time']);
		}
		
	}

	// add the function to collaborate with page builder
	add_filter('gdlr_page_builder_option', 'gdlr_register_fixture_result_item');
	function gdlr_register_fixture_result_item( $page_builder = array() ){
		global $gdlr_spaces;
		
		$page_builder['content-item']['options']['upcoming-match'] = array(
			'title'=> __('Upcoming Match', 'gdlr-soccer'), 
			'type'=>'item',
			'options'=>array(					
				'category'=> array(
					'title'=> __('Category' ,'gdlr-soccer'),
					'type'=> 'multi-combobox',
					'options'=> gdlr_get_term_list('result_category'),
					'description'=> __('You can use Ctrl/Command button to select multiple categories or remove the selected category. <br><br> Leave this field blank to select all categories.', 'gdlr-soccer')
				),
				'image-id'=> array(
					'title'=> __('Background Image', 'gdlr_translate'),
					'type'=> 'upload',
					'button'=> __('Upload', 'gdlr_translate')
				),					
				'margin-bottom' => array(
					'title' => __('Margin Bottom', 'gdlr-soccer'),
					'type' => 'text',
					'default' => $gdlr_spaces['bottom-item'],
					'description' => __('Spaces after ending of this item', 'gdlr-soccer')
				),
			)
		);
		
		$page_builder['content-item']['options']['fixture-result'] = array(
			'title'=> __('Fixtures & Results', 'gdlr-soccer'), 
			'type'=>'item',
			'options'=>array_merge(gdlr_page_builder_title_option(true), array(					
				'category'=> array(
					'title'=> __('Category' ,'gdlr-soccer'),
					'type'=> 'multi-combobox',
					'options'=> gdlr_get_term_list('result_category'),
					'description'=> __('You can use Ctrl/Command button to select multiple categories or remove the selected category. <br><br> Leave this field blank to select all categories.', 'gdlr-soccer')
				),	
				'style'=> array(
					'title'=> __('Item Style' ,'gdlr-soccer'),
					'type'=> 'combobox',
					'options'=> array(	
						'full' => __('Full', 'gdlr-soccer'),
						'summary' => __('Summary', 'gdlr-soccer')
					),
					'description'=> __('You can use Ctrl/Command button to select multiple categories or remove the selected category. <br><br> Leave this field blank to select all categories.', 'gdlr-portfolio')
				),		
				'button-text' => array(
					'title' => __('View All Fixtures Text' ,'gdlr-soccer'),
					'type' => 'text',
					'default' => __('View All Fixtures' ,'gdlr-soccer'),
					'wrapper-class' => 'style-wrapper summary-wrapper'
				),		
				'button-link' => array(
					'title' => __('View All Fixtures Link' ,'gdlr-soccer'),
					'type' => 'text',
					'wrapper-class' => 'style-wrapper summary-wrapper'
				),				
				'num-fetch'=> array(
					'title'=> __('Num Fetch' ,'gdlr-soccer'),
					'type'=> 'text',	
					'default'=> '8',
					'description'=> __('Specify the number of records you want to pull out.', 'gdlr-soccer')
				),									
				'filter'=> array(
					'title'=> __('Enable Category Filter' ,'gdlr-soccer'),
					'type'=> 'checkbox',
					'default'=> 'disable',
					'description'=> __('*** You have to select only 1 ( or none ) category when enable this option','gdlr-soccer')
				),						
				'order'=> array(
					'title'=> __('Order' ,'gdlr-soccer'),
					'type'=> 'combobox',
					'options'=> array(
						'desc'=>__('Descending Order', 'gdlr-soccer'), 
						'asc'=> __('Ascending Order', 'gdlr-soccer'), 
					)
				),			
				'pagination'=> array(
					'title'=> __('Enable Pagination' ,'gdlr-soccer'),
					'type'=> 'checkbox'
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