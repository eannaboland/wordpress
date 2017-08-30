<?php

if (!defined('UD_CENTRAL_DIR')) die('Security check');

class UpdraftCentral_Activation {

	private static $table_prefix;

	private static $db_updates = array(
		'0.3.8' => array(
			'update_038_add_admin_url_column_to_sites',
		),
	);

	public static function init() {
		self::$table_prefix = defined('UPDRAFTCENTRAL_TABLE_PREFIX') ? UPDRAFTCENTRAL_TABLE_PREFIX : 'updraftcentral_';
	}

	public static function install() {
		self::init();
		self::create_tables();
		update_option('updraftcentral_dbversion', UpdraftCentral()->version);
	}

	public static function check_updates() {
		self::init();
		$our_version = UpdraftCentral()->version;
		$db_version = get_option('updraftcentral_dbversion');
		if (!$db_version || version_compare($our_version, $db_version, '>')) {
			foreach (self::$db_updates as $version => $updates) {
				if (version_compare($version, $db_version, '>')) {
					foreach ($updates as $update) {
						call_user_func(array(__CLASS__, $update));
					}
				}
			}
		}
		update_option('updraftcentral_dbversion', UpdraftCentral()->version);
	}

	/**
	 * Add the 'admin_url' column to the sites table
	 */
	public static function update_038_add_admin_url_column_to_sites() {
		global $wpdb;
		$our_prefix = $wpdb->base_prefix.self::$table_prefix;
		$wpdb->query('ALTER TABLE '.$our_prefix.'sites ADD admin_url varchar(300) AFTER url');
	}

	public static function create_tables() {
		global $wpdb;

// $wpdb->hide_errors();

		$our_prefix = $wpdb->base_prefix.self::$table_prefix;
		$collate = '';

		if ($wpdb->has_cap('collation')) {
			if (!empty($wpdb->charset)) {
				$collate .= "DEFAULT CHARACTER SET $wpdb->charset";
			}
			if (!empty($wpdb->collate)) {
				$collate .= " COLLATE $wpdb->collate";
			}
		}

		include_once ABSPATH.'wp-admin/includes/upgrade.php';

		// Important: obey the magical/arbitrary rules for formatting this stuff: https://codex.wordpress.org/Creating_Tables_with_Plugins
		// Otherwise, you get SQL errors and unwanted header output warnings when activating
		
		$create_tables = 'CREATE TABLE '.$our_prefix."sites (
			site_id bigint(20) NOT NULL auto_increment,
			user_id bigint(20) NOT NULL,
			url varchar(300) NOT NULL,
			admin_url varchar(300),
			key_local_private blob,
			key_remote_public blob,
			key_name_indicator varchar(200) NOT NULL,
			description text,
			sequence_id bigint(20) DEFAULT 0,
			remote_user_id bigint(20) NOT NULL,
			remote_user_login varchar(60),
			remote_site_id bigint(20) DEFAULT 0,
			connection_method varchar(30),
			send_cors_headers tinyint(1) DEFAULT 1,
			PRIMARY KEY  (site_id),
			KEY user_id (user_id)
			) $collate;
		";
		// KEY attribute_name (attribute_name)
		dbDelta($create_tables);

		$create_tables = 'CREATE TABLE '.$our_prefix."site_temporary_keys (
			key_id bigint(20) NOT NULL auto_increment,
			key_local_private blob,
			key_remote_public blob,
			created bigint(20),
			PRIMARY KEY  (key_id),
			KEY created (created)
			) $collate;
		";

		dbDelta($create_tables);

		$max_index_length = 191;
		$create_tables = 'CREATE TABLE '.$our_prefix."sitemeta (
			meta_id bigint(20) NOT NULL auto_increment,
			site_id bigint(20) NOT NULL default '0',
			meta_key varchar(255) default NULL,
			meta_value longtext,
			PRIMARY KEY  (meta_id),
			KEY meta_key (meta_key($max_index_length)),
			KEY site_id (site_id)
			) $collate;
		";

		dbDelta($create_tables);
	}
}
