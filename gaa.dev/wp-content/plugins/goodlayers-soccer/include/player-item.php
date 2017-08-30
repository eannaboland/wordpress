<?php
	/*	
	*	Goodlayers Player File
	*/	

	function gdlr_soccer_get_player_avatar($size = 'thumbnail', $link = true){
		if( function_exists('gdlr_get_image') ){
			if( is_single() && $link ){
				return '<div class="gdlr-soccer-player-thumbnail">' . gdlr_get_image(get_post_thumbnail_id(), $size, true) . '</div>';
			}else{
				return '<div class="gdlr-soccer-player-thumbnail">' . gdlr_get_image(get_post_thumbnail_id(), $size, array('url'=>get_permalink())) . '</div>';
			}
		}
		return '';
	}
	
	function gdlr_soccer_get_player_info($options = array(), $get='', 
		$format = '<li><span class="gdlr-soccer-head">%v</span><span class="gdlr-soccer-tail">%t</span></li>'){
		
		$title = array(
			'height' => __('Height', 'gdlr-soccer'),
			'weight' => __('Weight', 'gdlr-soccer'),
			'nationality' => __('Nationality', 'gdlr-soccer'),
			'date-of-birth' => __('Date Of Birth', 'gdlr-soccer'),
			'position-ab' => __('Position', 'gdlr-soccer'),
			'games-played' => __('Games Played', 'gdlr-soccer'),
			'minutes-played' => __('Minutes Played', 'gdlr-soccer'),
			'starts' => __('Starts', 'gdlr-soccer'),
			'substitution-on' => __('Substitution On', 'gdlr-soccer'),
			'substitution-off' => __('Substitution Off', 'gdlr-soccer'),
			
			'passes' => __('Passes', 'gdlr-soccer'),
			'passing-accuracy' => __('Passing Accuracy', 'gdlr-soccer'),
			'passing-accuracy-opp' => __('Passing Accuracy opp. Half', 'gdlr-soccer'),
			'duels-won' => __('Duels Won', 'gdlr-soccer'),
			'duels-lost' => __('Duels Lost', 'gdlr-soccer'),
			'duels-won-percent' => __('Duels Won (%)', 'gdlr-soccer'),
			'aerial-duels-won' => __('Aerial Duels Won', 'gdlr-soccer'),
			'aerial-duels-lost' => __('Aerial Duels Lost', 'gdlr-soccer'),
			'aerial-duels-won-percent' => __('Aerial Duels Won (%)', 'gdlr-soccer'),
			'recoveries' => __('Recoveries', 'gdlr-soccer'),
			
			'tackles-won' => __('Tackles Won', 'gdlr-soccer'),
			'tackles-lost' => __('Tackles Lost', 'gdlr-soccer'),
			'tackles-won-percent' => __('Tackles Won (%)', 'gdlr-soccer'),
			'clearances' => __('Clearances', 'gdlr-soccer'),
			'blocks' => __('Blocks', 'gdlr-soccer'),
			'interceptions' => __('Interceptions', 'gdlr-soccer'),
			'penalties-conceded' => __('Penalties Conceded', 'gdlr-soccer'),
			'fouls-won' => __('Fouls Won', 'gdlr-soccer'),
			'fouls-conceded' => __('Fouls Conceded', 'gdlr-soccer'),
			'yellow-cards' => __('Yellow Cards', 'gdlr-soccer'),
			'red-cards' => __('Red Cards', 'gdlr-soccer'),
			
			'goals' => __('Goals', 'gdlr-soccer'), 
			'penalty-goals' => __('Penalty Goals', 'gdlr-soccer'),
			'minutes-per-goal' => __('Minutes Per Goal', 'gdlr-soccer'),
			'total-shots-on-target' => __('Total Shots On Target', 'gdlr-soccer'),
			'total-shots-off-target' => __('Total Shots Off Target', 'gdlr-soccer'),
			'shooting-accuracy' => __('Shooting Accuracy', 'gdlr-soccer'),
			'successful-crosses' => __('Successful Crosses', 'gdlr-soccer'),
			'unsuccessful-crosses' => __('Unsuccessful Crosses', 'gdlr-soccer'),
			'successful-crosses-percent' => __('Successful Crosses (%)', 'gdlr-soccer'),
			'assists' => __('Assists', 'gdlr-soccer'),
			'chances-created' => __('Chances Created', 'gdlr-soccer'),
			'penalties-won' => __('Penalties Won', 'gdlr-soccer'),
			'offsides' => __('Offsides', 'gdlr-soccer'),
		);
		
		
		if( empty($get) ){
			foreach( $options as $key => $value ){
				if( in_array($key, $get) ){
					$info = str_replace('%t', $title[$key], $format);
					echo str_replace('%v', $value, $info);
				}
			}
		}else{
			foreach( $get as $key ){
				$info = str_replace('%t', $title[$key], $format);
				echo str_replace('%v', $options[$key], $info);
			}
		}
	}	
	
	// add action to check for player item
	add_action('gdlr_print_item_selector', 'gdlr_check_player_item', 10, 2);
	function gdlr_check_player_item( $type, $settings = array() ){
		if($type == 'player'){
			gdlr_print_player_item( $settings );
		}
	}
	
	// print player item
	function gdlr_print_player_item( $settings ){
		$item_id = empty($settings['page-item-id'])? '': ' id="' . $settings['page-item-id'] . '" ';

		global $gdlr_spaces;
		$margin = (!empty($settings['margin-bottom']) && 
			$settings['margin-bottom'] != $gdlr_spaces['bottom-item'])? 'margin-bottom: ' . $settings['margin-bottom'] . ';': '';
		$margin_style = (!empty($margin))? ' style="' . $margin . '" ': '';

		// query posts section
		$args = array('post_type' => 'player', 'suppress_filters' => false);
		$args['posts_per_page'] = (empty($settings['num-fetch']))? '5': $settings['num-fetch'];
		$args['orderby'] = (empty($settings['orderby']))? 'post_date': $settings['orderby'];
		$args['order'] = (empty($settings['order']))? 'desc': $settings['order'];
		$args['paged'] = (get_query_var('paged'))? get_query_var('paged') : 1;
		$selected_category = $settings['category'];
		
		if( $settings['player-layout'] == 'carousel' ){
			$settings['carousel'] = true;
		}
				
		echo '<div class="player-item-wrapper" ' . $item_id . $margin_style . ' data-ajax="' . AJAX_URL . '" >'; 		
		echo gdlr_get_item_title($settings);

		// create the player filter
		if( $settings['player-filter'] == 'enable' ){
		
			// ajax infomation
			echo '<div class="gdlr-ajax-info" data-num-fetch="' . $args['posts_per_page'] . '" ';
			echo 'data-orderby="' . $args['orderby'] . '" data-order="' . $args['order'] . '" data-pagination="' . $settings['pagination'] . '" ';
			echo 'data-thumbnail-size="' .  $settings['thumbnail-size'] . '" data-player-style="' . $settings['player-style'] . '" ';
			echo 'data-player-size="' . $settings['player-size'] . '" data-player-layout="' .  $settings['player-layout'] . '" ';
			echo 'data-ajax="' . admin_url('admin-ajax.php') . '" data-category="' . $settings['category'] . '" ></div>';
		
			// category filter
			if( empty($settings['category']) ){
				$parent = array('gdlr-all'=>__('All', 'gdlr-soccer'));
				$settings['category-id'] = '';
			}else{
				$term = get_term_by('slug', $settings['category'], 'player_category');
				$parent = array($settings['category']=>$term->name);
				$settings['category-id'] = $term->term_id;
			}
		
			//$filters = $parent + gdlr_get_term_list('player_category', $settings['category-id']);
			$filters = gdlr_get_term_list('player_category', $settings['category-id']);
			$filter_category = empty($_GET['player-filter'])? '': $_GET['player-filter']; 
			echo '<div class="player-item-filter">';
			foreach($filters as $filter_id => $filter){
				$filter_id = ($filter_id == 'gdlr-all')? '': $filter_id;
				
				echo '<span class="gdlr-saperator">|</span>';
				if( empty($filter_category) ){
					$filter_category = 'gdlr-player-selected';
					$selected_category = $filter_id;
					echo '<a class="gdlr-title-font active" href="#" ';
				}else if($filter_category != 'gdlr-player-selected' && $filter_category == $filter_id){
					$selected_category = $filter_id;
					echo '<a class="gdlr-title-font active" href="#" ';
				}else{
					echo '<a class="gdlr-title-font" href="#" ';
				}
				echo 'data-category="' . $filter_id . '" >' . $filter . '</a>';
			}
			echo '</div>';
		}
		
		if( !empty($selected_category) ){ 
			$args['tax_query'] = array(
				array('terms'=>explode(',', $selected_category), 'taxonomy'=>'player_category', 'field'=>'slug')
			);	
		}			
		$query = new WP_Query( $args );		
		
		echo '<div class="player-item-holder">';
		if( $settings['player-style'] == 'classic' ){
			gdlr_print_classic_player($query, $settings['player-size'], $settings['thumbnail-size'], $settings['player-layout']);
		}else if( $settings['player-style'] == 'modern' ){
			gdlr_print_modern_player($query, $settings['player-size'], $settings['thumbnail-size'], $settings['player-layout']);
		}
		echo '<div class="clear"></div>';
		echo '</div>';

		// create pagination
		if($settings['player-filter'] == 'enable' && $settings['pagination'] == 'enable'){
			echo gdlr_get_ajax_pagination($query->max_num_pages, $args['paged']);
		}else if($settings['pagination'] == 'enable'){
			echo gdlr_get_pagination($query->max_num_pages, $args['paged']);
		}	
		echo '</div>'; // player item wrapper
	}
	
	// ajax function for player filter / pagination
	add_action('wp_ajax_gdlr_get_player_ajax', 'gdlr_get_player_ajax');
	add_action('wp_ajax_nopriv_gdlr_get_player_ajax', 'gdlr_get_player_ajax');
	function gdlr_get_player_ajax(){
		$settings = $_POST['args'];

		$args = array('post_type' => 'player', 'suppress_filters' => false);
		$args['posts_per_page'] = (empty($settings['num-fetch']))? '5': $settings['num-fetch'];
		$args['orderby'] = (empty($settings['orderby']))? 'post_date': $settings['orderby'];
		$args['order'] = (empty($settings['order']))? 'desc': $settings['order'];
		$args['paged'] = (empty($settings['paged']))? 1: $settings['paged'];
		if( !empty($settings['category']) ){
			$args['tax_query'] = array(
				array('terms'=>explode(',', $settings['category']), 'taxonomy'=>'player_category', 'field'=>'slug')
			);
		}			
		$query = new WP_Query( $args );
		
		echo '<div class="player-item-holder">';
		if( $settings['player-style'] == 'classic' ){
			gdlr_print_classic_player($query, $settings['player-size'], $settings['thumbnail-size'], $settings['player-layout']);
		}else if( $settings['player-style'] == 'modern' ){
			gdlr_print_modern_player($query, $settings['player-size'], $settings['thumbnail-size'], $settings['player-layout']);
		}
		echo '<div class="clear"></div>';
		echo '</div>';
		
		// pagination section
		if($settings['pagination'] == 'enable'){
			echo gdlr_get_ajax_pagination($query->max_num_pages, $args['paged']);
		}
		die("");
	}
	
	// print classic player
	function gdlr_print_classic_player($query, $size, $thumbnail_size, $layout){
		if($layout == 'carousel'){ 
			return gdlr_print_classic_carousel_player($query, $size, $thumbnail_size); 
		}
			
		$current_size = 0;
		while($query->have_posts()){ $query->the_post();
			if( $current_size % $size == 0 ){
				echo '<div class="clear"></div>';
			}	
			
			$player_val = gdlr_lms_decode_preventslashes(get_post_meta(get_the_ID(), 'gdlr-soccer-player-settings', true));
			$player_options = empty($player_val)? array(): json_decode($player_val, true);			

			echo '<div class="' . gdlr_get_column_class('1/' . $size) . '">';
			echo '<div class="gdlr-item gdlr-classic-player">';
			echo '<div class="gdlr-ux gdlr-classic-player-ux">';
			echo gdlr_soccer_get_player_avatar($thumbnail_size);
			
			echo '<div class="gdlr-classic-player-item-content">';
			echo '<div class="gdlr-soccer-player-squad gdlr-title-font gdlr-skin-info" >' . $player_options['player-info']['squad'] . '</div>';
			echo '<div class="gdlr-soccer-player-title-wrapper">';
			echo '<h3 class="gdlr-soccer-player-title gdlr-skin-title"><a href="' . get_permalink() . '" >' . get_the_title() . '</a></h3>';
			echo '<div class="gdlr-soccer-player-position gdlr-skin-info">' . $player_options['player-info']['position'] . '</div>';
			echo '</div>'; // classic-player-title-wrapper
			echo '</div>'; // classic-player-item-content
			
			echo '</div>'; // gdlr-ux
			echo '</div>'; // gdlr-item
			echo '</div>'; // gdlr-column-class
			$current_size ++;		
		}
		wp_reset_postdata();
	}
	function gdlr_print_classic_carousel_player($query, $size, $thumbnail_size){
		
		echo '<div class="gdlr-item gdlr-classic-player-carousel-wrapper">';
		echo '<div class="flexslider" data-type="carousel" data-nav-container="player-item-holder" data-columns="' . $size . '" >';	
		echo '<ul class="slides" >';		
		while($query->have_posts()){ $query->the_post();
			$player_val = gdlr_lms_decode_preventslashes(get_post_meta(get_the_ID(), 'gdlr-soccer-player-settings', true));
			$player_options = empty($player_val)? array(): json_decode($player_val, true);			

			echo '<li class="gdlr-item gdlr-classic-player">';
			echo gdlr_soccer_get_player_avatar($thumbnail_size);
			
			echo '<div class="gdlr-classic-player-item-content">';
			echo '<div class="gdlr-soccer-player-squad gdlr-title-font gdlr-skin-info" >' . $player_options['player-info']['squad'] . '</div>';
			echo '<div class="gdlr-soccer-player-title-wrapper">';
			echo '<h3 class="gdlr-soccer-player-title gdlr-skin-title"><a href="' . get_permalink() . '" >' . get_the_title() . '</a></h3>';
			echo '<div class="gdlr-soccer-player-position gdlr-skin-info">' . $player_options['player-info']['position'] . '</div>';
			echo '</div>'; // classic-player-title-wrapper
			echo '</div>'; // classic-player-item-content
			
			echo '</li>'; // gdlr-item
		}
		echo '</ul>'; 
		echo '</div>'; // flexslider
		echo '</div>'; // gdlr-item
		wp_reset_postdata();
	}
	
	// print modern player
	function gdlr_print_modern_player($query, $size, $thumbnail_size, $layout){
		if($layout == 'carousel'){ 
			return gdlr_print_modern_carousel_player($query, $size, $thumbnail_size); 
		}
		
		$current_size = 0;
		while($query->have_posts()){ $query->the_post();
			if( $current_size % $size == 0 ){
				echo '<div class="clear"></div>';
			}	
			
			$player_val = gdlr_lms_decode_preventslashes(get_post_meta(get_the_ID(), 'gdlr-soccer-player-settings', true));
			$player_options = empty($player_val)? array(): json_decode($player_val, true);			

			echo '<div class="' . gdlr_get_column_class('1/' . $size) . '">';
			echo '<div class="gdlr-item gdlr-modern-player">';
			echo gdlr_soccer_get_player_avatar($thumbnail_size);
			
			echo '<div class="gdlr-modern-player-item-content">';
			echo '<a href="' . get_permalink() . '" >';
			echo '<span class="gdlr-modern-player-item-overlay"></span>';
			echo '<span class="gdlr-modern-player-item-content-inner">';
			echo '<span class="gdlr-soccer-player-squad gdlr-title-font" >' . $player_options['player-info']['squad'] . '</span>';
			echo '<span class="gdlr-soccer-player-title gdlr-title-font">' . get_the_title() . '</span>';
			echo '<span class="gdlr-soccer-player-position">' . $player_options['player-info']['position'] . '</span>';
			echo '</span>'; // modern-player-item-content-inner
			echo '</a>';
			echo '</div>'; // modern-player-item-content
			
			echo '</div>'; // gdlr-item
			echo '</div>'; // gdlr-column-class
			$current_size ++;			
		}
		wp_reset_postdata();
	}
	function gdlr_print_modern_carousel_player($query, $size, $thumbnail_size){

		echo '<div class="gdlr-item gdlr-modern-player-carousel-wrapper">';
		echo '<div class="flexslider" data-type="carousel" data-nav-container="player-item-holder" data-columns="' . $size . '" >';	
		echo '<ul class="slides" >';	
		while($query->have_posts()){ $query->the_post();

			$player_val = gdlr_lms_decode_preventslashes(get_post_meta(get_the_ID(), 'gdlr-soccer-player-settings', true));
			$player_options = empty($player_val)? array(): json_decode($player_val, true);			

			echo '<li class="gdlr-item gdlr-modern-player">';
			echo gdlr_soccer_get_player_avatar($thumbnail_size);
			
			echo '<div class="gdlr-modern-player-item-content">';
			echo '<a href="' . get_permalink() . '" >';
			echo '<span class="gdlr-modern-player-item-overlay"></span>';
			echo '<span class="gdlr-modern-player-item-content-inner">';
			echo '<span class="gdlr-soccer-player-squad gdlr-title-font" >' . $player_options['player-info']['squad'] . '</span>';
			echo '<span class="gdlr-soccer-player-title gdlr-title-font">' . get_the_title() . '</span>';
			echo '<span class="gdlr-soccer-player-position">' . $player_options['player-info']['position'] . '</span>';
			echo '</span>'; // modern-player-item-content-inner
			echo '</a>';
			echo '</div>'; // modern-player-item-content
			
			echo '</li>'; // gdlr-item	
		}
		echo '</ul>'; 
		echo '</div>'; // flexslider
		echo '</div>'; // gdlr-item		
		wp_reset_postdata();
	}	
?>