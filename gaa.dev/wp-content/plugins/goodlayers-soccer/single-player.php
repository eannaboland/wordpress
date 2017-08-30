<?php get_header(); ?>
<div class="gdlr-content">

	<?php 
		global $gdlr_sidebar, $theme_option;
		if( empty($gdlr_post_option['sidebar']) || $gdlr_post_option['sidebar'] == 'default-sidebar' ){
			$gdlr_sidebar = array(
				'type'=>$theme_option['player-sidebar-template'],
				'left-sidebar'=>$theme_option['player-sidebar-left'], 
				'right-sidebar'=>$theme_option['player-sidebar-right']
			); 
		}else{
			$gdlr_sidebar = array(
				'type'=>$gdlr_post_option['sidebar'],
				'left-sidebar'=>$gdlr_post_option['left-sidebar'], 
				'right-sidebar'=>$gdlr_post_option['right-sidebar']
			); 				
		}
		$gdlr_sidebar = gdlr_get_sidebar_class($gdlr_sidebar);
		
		$social_type = 'dark';
		$player_val = gdlr_lms_decode_preventslashes(get_post_meta(get_the_ID(), 'gdlr-soccer-player-settings', true));
		$player_options = empty($player_val)? array(): json_decode($player_val, true);
	?>
	
	<!-- player info -->
	<div class="gdlr-soccer-player-general-info-wrapper">
		<div class="gdlr-soccer-player-general-info-container container">
			<div class="gdlr-soccer-player-general-info-inner gdlr-item">
				<div class="gdlr-soccer-player-general-info-left">
					<div class="gdlr-soccer-player-general-info-left-overlay"></div>
					<?php echo gdlr_soccer_get_player_avatar(); ?>
					<h1 class="gdlr-soccer-player-title"><?php the_title(); ?></h1>
					<h4 class="gdlr-soccer-player-title-info">
						<span class="gdlr-soccer-player-squad" ><?php echo $player_options['player-info']['squad']; ?></span>
						<span class="gdlr-soccer-player-position" ><?php echo $player_options['player-info']['position']; ?></span>
					</h4>
				</div>
				<div class="gdlr-soccer-player-general-info-right-wrapper">
					<div class="gdlr-soccer-player-general-info-right-inner">
					<?php 
						gdlr_soccer_get_player_info($player_options['player-info'], 
							array('nationality', 'date-of-birth', 'height', 'weight'),
							'<div class="gdlr-soccer-player-general-info-right"><span class="gdlr-soccer-head">%t :</span><span class="gdlr-soccer-tail">%v</span></div>'); 
					?>
					</div>
				</div>
				<div class="clear"></div>
			</div>
		</div>
	</div>
	
	<!-- tab title -->
	<div class="gdlr-soccer-player-tab-title-wrapper">
		<div class="gdlr-soccer-player-tab-title-container container">
			<div class="gdlr-soccer-player-tab-title-inner gdlr-item gdlr-title-font">
				<a class="gdlr-soccer-tab active" href="#" data-tab="player-stats" ><?php _e('Player Stats', 'gdlr-soccer'); ?></a> 
				<span class="gdlr-separator" >|</span> 
				<a class="gdlr-soccer-tab" href="#" data-tab="biography" ><?php _e('Biography', 'gdlr-soccer'); ?></a> 
				<span class="gdlr-separator" >|</span> 
				<a class="gdlr-soccer-tab" href="#" data-tab="gallery" ><?php _e('Gallery', 'gdlr-soccer'); ?></a> 
			</div>

			<div class="gdlr-soccer-player-social-wrapper">
				<?php if( !empty($player_options['player-info']['facebook']) ){ ?>
				<div class="social-icon">
					<a href="<?php echo $player_options['player-info']['facebook']; ?>" target="_blank" >
						<img width="32" height="32" src="<?php echo GDLR_PATH . '/images/' . $social_type . '/social-icon/facebook.png'; ?>" alt="facebook" />
					</a>
				</div>
				<?php } ?>
				<?php if( !empty($player_options['player-info']['twitter']) ){ ?>
				<div class="social-icon">
					<a href="<?php echo $player_options['player-info']['twitter']; ?>" target="_blank" >
						<img width="32" height="32" src="<?php echo GDLR_PATH . '/images/' . $social_type . '/social-icon/twitter.png'; ?>" alt="twitter" />
					</a>
				</div>
				<?php } ?>
				<?php if( !empty($player_options['player-info']['instagram']) ){ ?>
				<div class="social-icon">
					<a href="<?php echo $player_options['player-info']['instagram']; ?>" target="_blank" >
						<img width="32" height="32" src="<?php echo GDLR_PATH . '/images/' . $social_type . '/social-icon/instagram.png'; ?>" alt="instagram" />
					</a>
				</div>
				<?php } ?>
				<?php if( !empty($player_options['player-info']['youtube']) ){ ?>
				<div class="social-icon">
					<a href="<?php echo $player_options['player-info']['youtube']; ?>" target="_blank" >
						<img width="32" height="32" src="<?php echo GDLR_PATH . '/images/' . $social_type . '/social-icon/youtube.png'; ?>" alt="youtube" />
					</a>
				</div>
				<?php } ?>	
			</div>
		</div>
		<div class="clear"></div>
	</div>
	
	<!-- start content -->
	<div class="with-sidebar-wrapper">
		<div class="with-sidebar-container container">
			<div class="with-sidebar-left <?php echo $gdlr_sidebar['outer']; ?> columns">
				<div class="with-sidebar-content <?php echo $gdlr_sidebar['center']; ?> columns">
					<div class="gdlr-soccer-single-player gdlr-item gdlr-item-start-content" >
					
						<!-- player stats -->
						<div class="gdlr-soccer-tab-content active" data-tab="player-stats">
							<ul class="gdlr-soccer-tab-player-info" >
							<?php
								gdlr_soccer_get_player_info($player_options['player-info'], 
									array('position-ab', 'games-played', 'minutes-played', 'starts', 
										'substitution-on', 'substitution-off'))
							?>
							</ul>
							
							<div class="gdlr-soccer-single-player-stats" >
								<div class="gdlr-soccer-single-player-stats-tab gdlr-item gdlr-title-font">
									<a class="gdlr-soccer-tab active" href="#" data-tab="general" ><?php _e('General', 'gdlr-soccer'); ?></a> 
									<span class="gdlr-separator" >|</span> 
									<a class="gdlr-soccer-tab" href="#" data-tab="defence-discipline" ><?php _e('Defence & Discipline', 'gdlr-soccer'); ?></a> 
									<span class="gdlr-separator" >|</span> 
									<a class="gdlr-soccer-tab" href="#" data-tab="attack" ><?php _e('Attack', 'gdlr-soccer'); ?></a> 
								</div>
								<div class="gdlr-soccer-tab-content active" data-tab="general">
									<ul class="gdlr-soccer-tab-player-stats">
									<?php 
										gdlr_soccer_get_player_info(
											$player_options['player-stats'], 
											array('passes', 'passing-accuracy', 'passing-accuracy-opp', 
												'duels-won', 'duels-lost', 'duels-won-percent', 'aerial-duels-won', 
												'aerial-duels-lost', 'aerial-duels-won-percent', 'recoveries')
										);
									?>
									</ul>
								</div>
								<div class="gdlr-soccer-tab-content" data-tab="defence-discipline">
									<ul class="gdlr-soccer-tab-player-stats">
									<?php 
										gdlr_soccer_get_player_info(
											$player_options['player-stats'], 
											array('tackles-won', 'tackles-lost', 'tackles-won-percent', 'clearances', 
												'blocks', 'interceptions', 'penalties-conceded', 'fouls-won', 
												'fouls-conceded', 'yellow-cards', 'red-cards')
										);
									?>
									</ul>
								</div>
								<div class="gdlr-soccer-tab-content" data-tab="attack">
									<ul class="gdlr-soccer-tab-player-stats">
									<?php 
										gdlr_soccer_get_player_info(
											$player_options['player-stats'], 
											array('goals', 'penalty-goals', 'minutes-per-goal', 'total-shots-on-target', 
												'total-shots-off-target', 'shooting-accuracy', 'successful-crosses', 
												'unsuccessful-crosses', 'successful-crosses-percent', 'assists', 
												'chances-created', 'penalties-won', 'offsides')
										);
									?>
									</ul>
								</div>
							</div>
						</div>
						
						<!-- biography -->
						<div class="gdlr-soccer-tab-content" data-tab="biography">
							<?php
								if( function_exists('gdlr_content_filter') ){
									echo gdlr_content_filter($player_options['biography']['biography']);
								}else{
									echo do_shortcode($player_options['biography']['biography']);
								}
							?>
						</div>
						
						<!-- gallery -->
						<div class="gdlr-soccer-tab-content" data-tab="gallery">
							<?php
								if( function_exists('gdlr_content_filter') ){
									echo gdlr_content_filter($player_options['gallery']['player-gallery']);
								}else{
									echo do_shortcode($player_options['gallery']['player-gallery']);
								}
							?>
						</div>
					</div>
				</div>
				<?php get_sidebar('left'); ?>
				<div class="clear"></div>
			</div>
			<?php get_sidebar('right'); ?>
			<div class="clear"></div>
		</div>				
	</div>				

</div><!-- gdlr-content -->
<?php get_footer(); ?>