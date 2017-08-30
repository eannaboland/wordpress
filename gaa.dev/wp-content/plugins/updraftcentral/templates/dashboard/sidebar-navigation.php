<?php
	if (!defined('ABSPATH')) die('No direct access allowed');
	// @codingStandardsIgnoreFile
?>
<div id="updraft-central-navigation-sidebar">
	<?php do_action('updraftcentral_main_navigation_before_items'); ?>

	<?php $first = true;
		foreach ($main_navigation_items as $id => $item): ?>
			
		<div 
			id="updraft-menu-item-<?php echo $id; ?>" 
			class="updraft-menu-item updraft-menu-item-<?php echo $id; ?> updraft-menu-item-links <?php if($first) { echo 'updraft-menu-item-links-active'; $first = false; } if (!empty($item['classes'])) echo implode(' ', $item['classes']);?>">
			<?php echo htmlspecialchars($item['label']); ?>
		</div>
	<?php endforeach; ?>
</div>
<div id="updraft-central-sidebar-button">
	<span class="dashicons dashicons-arrow-left-alt2 updraft-central-sidebar-button-icon"></span>
	<span class="dashicons dashicons-arrow-right-alt2 updraft-central-sidebar-button-icon" style="display: none;"></span>
</div>
