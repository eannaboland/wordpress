<?php get_header(); ?>
<div class="gdlr-content">

	<?php 
		global $gdlr_sidebar, $theme_option;
		if( empty($gdlr_post_option['sidebar']) || $gdlr_post_option['sidebar'] == 'default-sidebar' ){
			$gdlr_sidebar = array(
				'type'=>$theme_option['result-sidebar-template'],
				'left-sidebar'=>$theme_option['result-sidebar-left'], 
				'right-sidebar'=>$theme_option['result-sidebar-right']
			); 
		}else{
			$gdlr_sidebar = array(
				'type'=>$gdlr_post_option['sidebar'],
				'left-sidebar'=>$gdlr_post_option['left-sidebar'], 
				'right-sidebar'=>$gdlr_post_option['right-sidebar']
			); 				
		}
		$gdlr_sidebar = gdlr_get_sidebar_class($gdlr_sidebar);
		
		$match_val = gdlr_lms_decode_preventslashes(get_post_meta(get_the_ID(), 'gdlr-soccer-fixture-result-settings', true));
		$match_options = empty($match_val)? array(): json_decode($match_val, true);
	?>
	
	<!-- player info -->
	<div class="gdlr-soccer-match-results-wrapper">
		<div class="gdlr-soccer-match-results-overlay"></div>
		<div class="gdlr-soccer-match-results-container container">
			<div class="gdlr-soccer-match-results gdlr-item">
				<span class="match-results-team"><?php echo $match_options['competition']; ?></span>
				<div class="gdlr-soccer-match-results-title gdlr-title-font">

					<?php if( !empty($match_options['home-flag']) ){ ?>
						<span class="gdlr-team-flag"><?php echo gdlr_get_image($match_options['home-flag']); ?></span>
					<?php } ?>

					<span class="match-results-team"><?php echo $match_options['home']; ?></span>
					<span class="match-results-score"><?php echo $match_options['home-goal']; ?></span>
					<span class="match-results-score"><?php echo $match_options['home-point']; ?></span>
					<span class="match-results-separator">-</span>
					<span class="match-results-score"><?php echo $match_options['away-goal']; ?></span>
					<span class="match-results-score"><?php echo $match_options['away-point']; ?></span>
					<span class="match-results-team"><?php echo $match_options['away']; ?></span>
					<?php if( !empty($match_options['away-flag']) ){ ?>
						<span class="gdlr-team-flag"><?php echo gdlr_get_image($match_options['away-flag']); ?></span>
					<?php } ?>
				</div>
				<div class="gdlr-soccer-match-results-info">
					<?php 
						echo gdlr_soccer_get_match_info($match_options);
					?>
				</div>
			</div>
		</div>
	</div>
	
	<!-- start content -->
	<div class="with-sidebar-wrapper">
		<div class="with-sidebar-container container">
			<div class="with-sidebar-left <?php echo $gdlr_sidebar['outer']; ?> columns">
				<div class="with-sidebar-content <?php echo $gdlr_sidebar['center']; ?> columns">
					<div class="gdlr-soccer-single-fixture-result gdlr-item gdlr-item-start-content" >
						<?php
							echo gdlr_soccer_get_match_thumbnail();
						
							if( function_exists('gdlr_content_filter') ){
								echo gdlr_content_filter($match_options['match-report']);
							}else{
								echo do_shortcode($match_options['match-report']);
							}
						?>
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