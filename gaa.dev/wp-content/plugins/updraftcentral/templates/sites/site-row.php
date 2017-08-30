<div data-site_id = <?php echo $site->site_id;?>>
	<div class="row updraftcentral_site_row<?php if (!empty($site->unlicensed)) echo ' site_unlicensed';?>" <?php echo $site_data_attributes;?>>

		<div class="col-sm-6 updraftcentral_row_sitelabel" title="<?php _e('Drag to set the site order', 'updraftcentral'); ?>">

			<?php
			if (empty($site->description)) {
				?>
				<div class="updraft_site_title">
					<a href="<?php esc_attr_e($site->url); ?>"><?php echo htmlspecialchars($site->url); ?></a> <span class="updraftcentral_site_dashboard dashicons dashicons-wordpress-alt updraftcentral-show-in-other-tabs" title="<?php esc_attr_e('Go to the WordPress dashboard', 'updraftcentral');?>"></span>
					<?php if (!empty($site->unlicensed)) { ?>
						<br><span class="updraft_site_unlicensed"><?php _e('A licence is required to manage this site', 'updraftcentral');?></span>
					<?php } ?>
				</div>
				<br>
				<?php
			} else {
				?>
				<div class="updraft_site_title">
					<span class="updraftcentral_site_sort_icon dashicons dashicons-sort" title="<?php _e('Drag to set the site order', 'updraftcentral'); ?>"></span>
					<span title="<?php esc_attr_e($site->url); ?>"><?php echo htmlspecialchars($site->description);?></span>
				</div>
				<br class="updraft-full-hidden">
				<br>
				<a href="<?php esc_attr_e($site->url); ?>" class="updraftcentral_site_url_after_description"><?php esc_attr_e($site->url); ?></a> <span class="updraftcentral_site_dashboard dashicons dashicons-wordpress-alt updraftcentral-show-in-other-tabs" title="<?php esc_attr_e('Go to the WordPress dashboard', 'updraftcentral');?>"></span>
				<?php if (!empty($site->unlicensed)) { ?>
					<br><span class="updraft_site_unlicensed"><?php _e('A licence is required to manage this site', 'updraftcentral');?></span>
				<?php } ?>
				<br>
				<?php
			}
			?>
		</div>
		<div class="col-sm-6 updraftcentral_row_site_buttons">
			<div class="updraftcentral_row_container">
				<div class="updraft_site_actions btn-group btn-group-sm updraftcentral-hide-in-other-tabs updraftcentral-show-in-tab-sites" role="group">
					<button type="button" class="btn btn-primary row_siteinfo" title="<?php _e('Site information', 'updraftcentral'); ?>">
						<span class="dashicons dashicons-info"></span>
					</button>
					<button type="button" class="btn btn-primary updraftcentral_site_dashboard">
						<span class="dashicons dashicons-wordpress-alt"></span>
						<?php _e('Dashboard', 'updraftcentral'); ?>
					</button>
				</div>

				<?php do_action('updraftcentral_site_row_after_buttons'); ?>
				<?php require 'site-menu.php'; ?>

			</div>
		</div>

		<div class="col-sm-12 updraftcentral_row_extracontents"></div>

	</div>

	<hr class="updraftcentral_row_divider">
</div>