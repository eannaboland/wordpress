<?php
	/*	
	*	Goodlayers Player Option File
	*/	
	 
	// create the player post type
	add_action( 'init', 'gdlr_soccer_create_player' );
	function gdlr_soccer_create_player() {
		register_post_type( 'player',
			array(
				'labels' => array(
					'name'               => __('Players', 'gdlr-soccer'),
					'singular_name'      => __('Player', 'gdlr-soccer'),
					'add_new'            => __('Add New', 'gdlr-soccer'),
					'add_new_item'       => __('Add New player', 'gdlr-soccer'),
					'edit_item'          => __('Edit player', 'gdlr-soccer'),
					'new_item'           => __('New player', 'gdlr-soccer'),
					'all_items'          => __('All players', 'gdlr-soccer'),
					'view_item'          => __('View player', 'gdlr-soccer'),
					'search_items'       => __('Search players', 'gdlr-soccer'),
					'not_found'          => __('No players found', 'gdlr-soccer'),
					'not_found_in_trash' => __('No players found in Trash', 'gdlr-soccer'),
					'parent_item_colon'  => '',
					'menu_name'          => __('Players', 'gdlr-soccer')
				),
				'public'             => true,
				'publicly_queryable' => true,
				'show_ui'            => true,
				'show_in_menu'       => true,
				'query_var'          => true,
				//'rewrite'            => array( 'slug' => 'player'  ),
				'has_archive'        => true,
				'hierarchical'       => false,
				'menu_position'      => 5,
				'supports'           => array( 'title', 'author', 'thumbnail', 'custom-fields' )
			)
		);	
		
		// create player categories
		register_taxonomy(
			'player_category', array("player"), array(
				'hierarchical' => true,
				'show_admin_column' => true,
				'label' => __('Player Categories', 'gdlr-soccer'), 
				'singular_label' => __('Player Category', 'gdlr-soccer'), 
				'rewrite' => array( 'slug' => 'player_category'  )));
		register_taxonomy_for_object_type('player_category', 'player');
		
		add_filter('single_template', 'gdlr_soccer_register_player_template');
	}
	
	// register single player template
	function gdlr_soccer_register_player_template($template) {
		global $wpdb, $post, $current_user;

		if( $post->post_type == 'player' ){
			$template = dirname(dirname( __FILE__ )) . '/single-player.php';
		}
		
		return $template;	
	}

	// enqueue the necessary admin script
	add_action('admin_enqueue_scripts', 'gdlr_soccer_player_script');
	function gdlr_soccer_player_script() {
		global $post; if( !empty($post) && $post->post_type != 'player' ) return;
		
		wp_enqueue_style('gdlr-soccer-meta-box', plugins_url('/stylesheet/meta-box.css', __FILE__));
		wp_enqueue_style('gdlr-date-picker', 'http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.2/themes/smoothness/jquery-ui.css');
		
		wp_enqueue_script('jquery-ui-datepicker');	
		wp_enqueue_script('jquery-ui-core');
		wp_enqueue_script('jquery-ui-slider');	
		wp_enqueue_script('gdlr-soccer-meta-box', plugins_url('/javascript/meta-box.js', __FILE__));
	}

	// add the player option
	add_action('add_meta_boxes', 'gdlr_soccer_add_player_meta_box');	
	add_action('pre_post_update', 'gdlr_soccer_save_player_meta_box');
	function gdlr_soccer_add_player_meta_box(){
		add_meta_box('player-option', __('Player Option', 'gdlr-soccer'), 
			'gdlr_soccer_create_player_meta_box', 'player', 'normal', 'high');
	}
	function gdlr_soccer_create_player_meta_box(){
		global $post;
		
		// Add an nonce field so we can check for it later.
		wp_nonce_field('player_meta_box', 'player_meta_box_nonce');

		/////////////////
		//// setting ////
		/////////////////
		
		$player_settings = array(
			'player-info' => array(
				'title' => __('Player Info', 'gdlr-soccer'),
				'options' => array(
					'general-info' => array(
						'title' => __('General Info', 'gdlr-soccer'),
						'type' => 'title'
					),
					'first-name' => array(
						'title' => __('First Name', 'gdlr-soccer'),
						'type' => 'text'
					),
					'last-name' => array(
						'title' => __('Last Name', 'gdlr-soccer'),
						'type' => 'text'
					),
					'squad' => array(
						'title' => __('Squad', 'gdlr-soccer'),
						'type' => 'text'
					),
					'position' => array(
						'title' => __('Position', 'gdlr-soccer'),
						'type' => 'text'
					),
					'position-ab' => array(
						'title' => __('Position (abbreviation)', 'gdlr-soccer'),
						'type' => 'text'
					),
					'nationality' => array(
						'title' => __('Nationality', 'gdlr-soccer'),
						'type' => 'text'
					),	
					'date-of-birth' => array(
						'title' => __('Date Of Birth', 'gdlr-soccer'),
						'type' => 'text'
					),	
					'height' => array(
						'title' => __('Height', 'gdlr-soccer'),
						'type' => 'text'
					),	
					'weight' => array(
						'title' => __('Weight', 'gdlr-soccer'),
						'type' => 'text'
					),	
					'games-played' => array(
						'title' => __('Games Played', 'gdlr-soccer'),
						'type' => 'text'
					),	
					'minutes-played' => array(
						'title' => __('Minutes Played', 'gdlr-soccer'),
						'type' => 'text'
					),	
					'starts' => array(
						'title' => __('Starts', 'gdlr-soccer'),
						'type' => 'text'
					),		
					'substitution-on' => array(
						'title' => __('Substitution On', 'gdlr-soccer'),
						'type' => 'text'
					),		
					'substitution-off' => array(
						'title' => __('Substitution Off', 'gdlr-soccer'),
						'type' => 'text'
					),	
					
					'social-media' => array(
						'title' => __('Social Media', 'gdlr-soccer'),
						'type' => 'title',
						'class' => 'with-space'
					),
					'facebook' => array(
						'title' => __('Facebook', 'gdlr-soccer'),
						'type' => 'text'
					),
					'twitter' => array(
						'title' => __('Twitter', 'gdlr-soccer'),
						'type' => 'text'
					),
					'youtube' => array(
						'title' => __('Youtube', 'gdlr-soccer'),
						'type' => 'text'
					),
					'instagram' => array(
						'title' => __('Instagram', 'gdlr-soccer'),
						'type' => 'text'
					),
				),
			),
			'player-stats' => array(
				'title' => __('Player Stats', 'gdlr-soccer'),
				'options' => array(
					'general' => array(
						'title' => __('General', 'gdlr-soccer'),
						'type' => 'title'
					),
					'passes' => array(
						'title' => __('Passes', 'gdlr-soccer'),
						'type' => 'text'
					),
					'passing-accuracy' => array(
						'title' => __('Passing Accuracy', 'gdlr-soccer'),
						'type' => 'text'
					),
					'passing-accuracy-opp' => array(
						'title' => __('Passing Accuracy opp. Half', 'gdlr-soccer'),
						'type' => 'text'
					),
					'duels-won' => array(
						'title' => __('Duels Won', 'gdlr-soccer'),
						'type' => 'text'
					),
					'duels-lost' => array(
						'title' => __('Duels Lost', 'gdlr-soccer'),
						'type' => 'text'
					),
					'duels-won-percent' => array(
						'title' => __('Duels Won (%)', 'gdlr-soccer'),
						'type' => 'text'
					),
					'aerial-duels-won' => array(
						'title' => __('Aerial Duels Won', 'gdlr-soccer'),
						'type' => 'text'
					),
					'aerial-duels-lost' => array(
						'title' => __('Aerial Duels Lost', 'gdlr-soccer'),
						'type' => 'text'
					),
					'aerial-duels-won-percent' => array(
						'title' => __('Aerial Duels Won (%)', 'gdlr-soccer'),
						'type' => 'text'
					),
					'recoveries' => array(
						'title' => __('Recoveries', 'gdlr-soccer'),
						'type' => 'text'
					),	
					
					'defence-descipline' => array(
						'title' => __('Defence & Descipline', 'gdlr-soccer'),
						'type' => 'title',
						'class' => 'with-space'
					),
					'tackles-won' => array(
						'title' => __('Tackles Won', 'gdlr-soccer'),
						'type' => 'text'
					),
					'tackles-lost' => array(
						'title' => __('Tackles Lost', 'gdlr-soccer'),
						'type' => 'text'
					),
					'tackles-won-percent' => array(
						'title' => __('Tackles Won (%)', 'gdlr-soccer'),
						'type' => 'text'
					),
					'clearances' => array(
						'title' => __('Clearances', 'gdlr-soccer'),
						'type' => 'text'
					),
					'blocks' => array(
						'title' => __('Blocks', 'gdlr-soccer'),
						'type' => 'text'
					),
					'interceptions' => array(
						'title' => __('Interceptions', 'gdlr-soccer'),
						'type' => 'text'
					),
					'penalties-conceded' => array(
						'title' => __('Penalties Conceded', 'gdlr-soccer'),
						'type' => 'text'
					),
					'fouls-won' => array(
						'title' => __('Fouls Won', 'gdlr-soccer'),
						'type' => 'text'
					),
					'fouls-conceded' => array(
						'title' => __('Fouls Conceded', 'gdlr-soccer'),
						'type' => 'text'
					),
					'yellow-cards' => array(
						'title' => __('Yellow Cards', 'gdlr-soccer'),
						'type' => 'text'
					),
					'red-cards' => array(
						'title' => __('Red Cards', 'gdlr-soccer'),
						'type' => 'text'
					),
					
					'attack' => array(
						'title' => __('Attack', 'gdlr-soccer'),
						'type' => 'title',
						'class' => 'with-space'
					),
					'goals' => array(
						'title' => __('Goals', 'gdlr-soccer'),
						'type' => 'text'
					),
					'penalty-goals' => array(
						'title' => __('Penalty Goals', 'gdlr-soccer'),
						'type' => 'text'
					),
					'minutes-per-goal' => array(
						'title' => __('Minutes Per Goal', 'gdlr-soccer'),
						'type' => 'text'
					),
					'total-shots-on-target' => array(
						'title' => __('Total Shots On Target', 'gdlr-soccer'),
						'type' => 'text'
					),
					'total-shots-off-target' => array(
						'title' => __('Total Shots Off Target', 'gdlr-soccer'),
						'type' => 'text'
					),
					'shooting-accuracy' => array(
						'title' => __('Shooting Accuracy', 'gdlr-soccer'),
						'type' => 'text'
					),
					'successful-crosses' => array(
						'title' => __('Successful Crosses', 'gdlr-soccer'),
						'type' => 'text'
					),
					'unsuccessful-crosses' => array(
						'title' => __('Unsuccessful Crosses', 'gdlr-soccer'),
						'type' => 'text'
					),
					'successful-crosses-percent' => array(
						'title' => __('Successful Crosses (%)', 'gdlr-soccer'),
						'type' => 'text'
					),
					'assists' => array(
						'title' => __('Assists', 'gdlr-soccer'),
						'type' => 'text'
					),
					'chances-created' => array(
						'title' => __('Chances Created', 'gdlr-soccer'),
						'type' => 'text'
					),
					'penalties-won' => array(
						'title' => __('Penalties Won', 'gdlr-soccer'),
						'type' => 'text'
					),
					'offsides' => array(
						'title' => __('Offsides', 'gdlr-soccer'),
						'type' => 'text'
					),
				),
			),
			'biography' => array(
				'title' => __('Biography', 'gdlr-soccer'),
				'options' => array(
					'biography' => array(
						'type' => 'wysiwyg'
					),	
				),
			),
			'gallery' => array(
				'title' => __('Gallery', 'gdlr-soccer'),
				'options' => array(
					'player-gallery' => array(
						'type' => 'wysiwyg'
					),	
				),
			),
		);
		$player_val = gdlr_lms_decode_preventslashes(get_post_meta($post->ID, 'gdlr-soccer-player-settings', true));
		$player_settings_val = empty($player_val)? array(): json_decode($player_val, true);
		
		echo '<div class="gdlr-lms-meta-wrapper gdlr-tabs">';
		
		// tab title
		$count = 0;
		echo '<div class="soccer-tab-title">';
		foreach( $player_settings as $section_slug => $player_setting ){ 
			echo '<span data-tab="' . $section_slug . '" ';
			echo ($count == 0)? 'class="active" ': '';
			echo '>' . $player_setting['title'] . '</span>';
			
			$count++;
		}
		echo '</div>'; // soccer-tab-title
		
		// tab content
		$count = 0;
		echo '<div class="soccer-tab-content-wrapper">';
		foreach( $player_settings as $section_slug => $player_setting ){
			echo '<div class="soccer-tab-content ';
			echo ($count == 0)? 'active': '';
			echo '" data-tab="' . $section_slug . '" >';
			foreach( $player_setting['options'] as $option_slug => $option_val ){
				$option_val['slug'] = $option_slug;
				if( !empty($player_settings_val[$section_slug][$option_slug]) ){
					$option_val['value'] = $player_settings_val[$section_slug][$option_slug];
				}else{
					$option_val['value'] = '';
				}
				gdlr_lms_print_meta_box($option_val);
			}
			echo '</div>';
			
			$count++;
		}
		echo '</div>'; // soccer-tab-content-wrapper
		
		echo '<textarea name="gdlr-soccer-player-settings">' . esc_textarea($player_val) . '</textarea>';
		echo '</div>';
	}
	function gdlr_soccer_save_player_meta_box($post_id){
	
		// verify nonce & user's permission
		if(!isset($_POST['player_meta_box_nonce'])){ return; }
		if(!wp_verify_nonce($_POST['player_meta_box_nonce'], 'player_meta_box')){ return; }
		if(!current_user_can('edit_post', $post_id)){ return; }

		// save value
		if( isset($_POST['gdlr-soccer-player-settings']) ){
			update_post_meta($post_id, 'gdlr-soccer-player-settings', gdlr_lms_preventslashes($_POST['gdlr-soccer-player-settings']));
		}
		
	}
	
	// add the function to collaborate with page builder
	add_filter('gdlr_page_builder_option', 'gdlr_register_player_item');
	function gdlr_register_player_item( $page_builder = array() ){
		global $gdlr_spaces;
	
		$page_builder['content-item']['options']['player'] = array(
			'title'=> __('Player', 'gdlr-soccer'), 
			'type'=>'item',
			'options'=>array_merge(gdlr_page_builder_title_option(true), array(					
				'category'=> array(
					'title'=> __('Category' ,'gdlr-soccer'),
					'type'=> 'multi-combobox',
					'options'=> gdlr_get_term_list('player_category'),
					'description'=> __('You can use Ctrl/Command button to select multiple categories or remove the selected category. <br><br> Leave this field blank to select all categories.', 'gdlr-soccer')
				),		
				'player-style'=> array(
					'title'=> __('Player Style' ,'gdlr-soccer'),
					'type'=> 'combobox',
					'options'=> array(
						'classic' => __('Classic Style', 'gdlr-soccer'),
						'modern' => __('Modern Style', 'gdlr-soccer'),
					),
				),					
				'num-fetch'=> array(
					'title'=> __('Num Fetch' ,'gdlr-soccer'),
					'type'=> 'text',	
					'default'=> '8',
					'description'=> __('Specify the number of player items you want to pull out.', 'gdlr-soccer')
				),					
				'player-size'=> array(
					'title'=> __('Player Item Size' ,'gdlr-soccer'),
					'type'=> 'combobox',
					'options'=> array(
						'4'=>'1/4',
						'3'=>'1/3',
						'2'=>'1/2',
						'1'=>'1/1'
					),
					'default'=>'1/3'
				),					
				'player-layout'=> array(
					'title'=> __('Player Layout Order' ,'gdlr-soccer'),
					'type'=> 'combobox',
					'options'=> array(
						'fitRows' =>  __('FitRows ( Order items by row )', 'gdlr-soccer'),
						'carousel' => __('Carousel ( Only For Grid And Modern Style )', 'gdlr-soccer'),
					)
				),
				'player-filter'=> array(
					'title'=> __('Enable Player Filter' ,'gdlr-soccer'),
					'type'=> 'checkbox',
					'default'=> 'disable',
					'description'=> __('*** You have to select only 1 ( or none ) player category when enable this option','gdlr-soccer')
				),						
				'thumbnail-size'=> array(
					'title'=> __('Thumbnail Size' ,'gdlr-soccer'),
					'type'=> 'combobox',
					'options'=> gdlr_get_thumbnail_list(),
					'description'=> __('Only effects to <strong>standard and gallery post format</strong>','gdlr-soccer')
				),	
				'orderby'=> array(
					'title'=> __('Order By' ,'gdlr-soccer'),
					'type'=> 'combobox',
					'options'=> array(
						'date' => __('Publish Date', 'gdlr-soccer'), 
						'title' => __('Title', 'gdlr-soccer'), 
						'rand' => __('Random', 'gdlr-soccer'), 
					)
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