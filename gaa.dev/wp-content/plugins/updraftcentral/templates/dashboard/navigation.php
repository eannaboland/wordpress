<div id="updraft-central-navigation">
	<div class="top_menu_right">
		<?php do_action('updraftcentral_main_navigation_after_items'); ?>
		
		<span class="dashicons dashicons-editor-expand updraft-full-screen" title="<?php esc_attr_e('Full screen', 'updraftcentral');?>"></span>
		<span class="dashicons dashicons-editor-help updraftcentral-help" title="<?php esc_attr_e('Help', 'updraftcentral');?>"></span>
		<span class="dashicons dashicons-admin-tools updraftcentral-settings" title="<?php esc_attr_e('Settings', 'updraftcentral');?>"></span>
		<span class="updraft-mobile-menu dashicons dashicons-menu"></span>
		
		<?php if (!empty($common_urls['get_licences'])) :?>
		<a 
			href="<?php esc_attr_e($common_urls['get_licences']);?>"
			id="updraftcentral_licence_info" 
			title="
			<?php esc_attr_e('This is your licence usage/availability count.', 'updraftcentral');
				if (!empty($common_urls['get_licences']) && $how_many_licences_available >= 0) {
				echo ' '.__('Follow the link to purchase more licences.', 'updraftcentral');
				}
				?>
				" 
			class="updraftcentral_licence_info">
				<span class="updraftcentral_licences_in_use"><?php echo $how_many_licences_in_use;?></span>
				 / 
				<span class="updraftcentral_licences_total"><?php echo ($how_many_licences_available < 0) ? '&#8734;' : $how_many_licences_available;?></span>	
		</a>
		<?php endif;?>
		
		<?php do_action('updraftcentral_main_navigation_after_icons'); ?>
	</div>
	
	<div class="updraft-menu updraft-central-logo">
		<img src="<?php echo UD_CENTRAL_URL; ?>/images/updraft-central.png">
	</div>	
</div>
