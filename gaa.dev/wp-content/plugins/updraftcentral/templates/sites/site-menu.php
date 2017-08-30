<div class="updraft_site_actions btn-group btn-group-sm">
	<button id="btn_group_drop" type="button" class="btn btn-primary dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
		<span class="dashicons dashicons-menu"></span>
	</button>
	<div class="dropdown-menu dropdown-menu-right" aria-labelledby="btn_group_drop" data-site_id="<?php echo $site->site_id; ?>">
	<a href="#" class="dropdown-item row_backupnow">
	<span class="updraft-dropdown-item">
		<span class="dashicons dashicons-upload"></span>
		<?php _e('Backup now', 'updraftcentral'); ?>
	</span>
	</a>
	<?php
		if (empty($site->description)) {
	?>
	<a class="dropdown-item" href="#">
	<span class="updraft-dropdown-item updraftcentral_site_adddescription">
	<span class="dashicons dashicons-edit"> </span>
	<span><?php _e('Site configuration', 'updraftcentral'); ?></span>
	</span>
	</a>
	<?php
		} else {
	?>
	<a class="dropdown-item" href="#">
	<span class="updraft-dropdown-item updraftcentral_site_adddescription updraftcentral_site_editdescription">
	<span class="dashicons dashicons-edit"> </span>
	<span><?php _e('Site configuration', 'updraftcentral'); ?></span>
	</span>
	</a>
	<?php
		}
	?>
	<a class="dropdown-item" href="#">
		<span class="updraft-dropdown-item updraftcentral_site_delete">
			<span class="dashicons dashicons-no-alt"></span>
			<span><?php _e('Remove site', 'updraftcentral'); ?></span>
		</span>
	</a>
</div>
</div>