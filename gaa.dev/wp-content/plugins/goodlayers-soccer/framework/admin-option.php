<?php
	/*	
	*	Goodlayers Admin Option File
	*/	
	
	// add a post option to custom post type page
	if( is_admin() ){ 
		add_action('init', 'gdlr_create_soccer_sidebar_options'); 
	}
	function gdlr_create_soccer_sidebar_options(){
		global $gdlr_sidebar_controller;
		
		if( !class_exists('gdlr_page_options') ) return;
		new gdlr_page_options( 
			
			// page option attribute
			array(
				'post_type' => array('player', 'fixture_and_result'),
				'meta_title' => __('Goodlayers Sidebar Option', 'gdlr-soccer'),
				'meta_slug' => 'goodlayers-page-option',
				'option_name' => 'post-option',
				'position' => 'side',
				'priority' => 'core',
			),
				  
			// page option settings
			array(
				'page-layout' => array(
					'title' => __('Sidebar Layout', 'gdlr-soccer'),
					'options' => array(
							'sidebar' => array(
								'type' => 'radioimage',
								'options' => array(
									'default-sidebar'=>GDLR_PATH . '/include/images/default-sidebar-2.png',
									'no-sidebar'=>GDLR_PATH . '/include/images/no-sidebar-2.png',
									'both-sidebar'=>GDLR_PATH . '/include/images/both-sidebar-2.png', 
									'right-sidebar'=>GDLR_PATH . '/include/images/right-sidebar-2.png',
									'left-sidebar'=>GDLR_PATH . '/include/images/left-sidebar-2.png'
								),
								'default' => 'default-sidebar'
							),	
							'left-sidebar' => array(
								'title' => __('Left Sidebar' , 'gdlr-soccer'),
								'type' => 'combobox',
								'options' => $gdlr_sidebar_controller->get_sidebar_array(),
								'wrapper-class' => 'sidebar-wrapper left-sidebar-wrapper both-sidebar-wrapper'
							),
							'right-sidebar' => array(
								'title' => __('Right Sidebar' , 'gdlr-soccer'),
								'type' => 'combobox',
								'options' => $gdlr_sidebar_controller->get_sidebar_array(),
								'wrapper-class' => 'sidebar-wrapper right-sidebar-wrapper both-sidebar-wrapper'
							),						
					)
				),

			)
		);
		
	}
	
	// add an admin option
	add_filter('gdlr_admin_option', 'gdlr_register_soccer_admin_option');
	function gdlr_register_soccer_admin_option( $array ){
		global $gdlr_sidebar_controller;
	
		if( empty($array['general']['options']) ) return $array;
		
		$soccer_option = array( 									
			'title' => __('Soccer Style', 'gdlr-soccer'),
			'options' => array(
				'single-player-title-background' => array(
					'title' => __('Single Player Title Background', 'gdlr_translate'),
					'type' => 'upload',	
					'selector' => '.single-player .gdlr-soccer-player-general-info-left{ background-image: url(\'#gdlr#\'); }',
					'data-type' => 'upload'
				),			
				'player-sidebar-template' => array(
					'title' => __('Player Sidebar Template', 'gdlr_translate'),
					'type' => 'radioimage',
					'options' => array(
						'no-sidebar'=>GDLR_PATH . '/include/images/no-sidebar.png',
						'both-sidebar'=>GDLR_PATH . '/include/images/both-sidebar.png', 
						'right-sidebar'=>GDLR_PATH . '/include/images/right-sidebar.png',
						'left-sidebar'=>GDLR_PATH . '/include/images/left-sidebar.png'
					),
					'default' => 'no-sidebar'							
				),
				'player-sidebar-left' => array(
					'title' => __('Player Sidebar Left', 'gdlr_translate'),
					'type' => 'combobox',
					'options' => $gdlr_sidebar_controller->get_sidebar_array(),		
					'wrapper-class'=>'left-sidebar-wrapper both-sidebar-wrapper player-sidebar-template-wrapper',											
				),
				'player-sidebar-right' => array(
					'title' => __('Player Sidebar Right', 'gdlr_translate'),
					'type' => 'combobox',
					'options' => $gdlr_sidebar_controller->get_sidebar_array(),
					'wrapper-class'=>'right-sidebar-wrapper both-sidebar-wrapper player-sidebar-template-wrapper',
				),
				'single-result-title-background' => array(
					'title' => __('Single Fixture & Result Title Background', 'gdlr_translate'),
					'type' => 'upload',	
					'selector' => '.gdlr-soccer-match-results-wrapper{ background-image: url(\'#gdlr#\'); }',
					'data-type' => 'upload'
				),
				'result-sidebar-template' => array(
					'title' => __('Fixtures & Results Sidebar Template', 'gdlr_translate'),
					'type' => 'radioimage',
					'options' => array(
						'no-sidebar'=>GDLR_PATH . '/include/images/no-sidebar.png',
						'both-sidebar'=>GDLR_PATH . '/include/images/both-sidebar.png', 
						'right-sidebar'=>GDLR_PATH . '/include/images/right-sidebar.png',
						'left-sidebar'=>GDLR_PATH . '/include/images/left-sidebar.png'
					),
					'default' => 'no-sidebar'							
				),
				'result-sidebar-left' => array(
					'title' => __('Fixtures & Results Sidebar Left', 'gdlr_translate'),
					'type' => 'combobox',
					'options' => $gdlr_sidebar_controller->get_sidebar_array(),		
					'wrapper-class'=>'left-sidebar-wrapper both-sidebar-wrapper result-sidebar-template-wrapper',											
				),
				'result-sidebar-right' => array(
					'title' => __('Fixtures & Results Sidebar Right', 'gdlr_translate'),
					'type' => 'combobox',
					'options' => $gdlr_sidebar_controller->get_sidebar_array(),
					'wrapper-class'=>'right-sidebar-wrapper both-sidebar-wrapper result-sidebar-template-wrapper',
				),
				
			)
		);
		
		$array['general']['options']['soccer-style'] = $soccer_option;
		return $array;
	}

?>