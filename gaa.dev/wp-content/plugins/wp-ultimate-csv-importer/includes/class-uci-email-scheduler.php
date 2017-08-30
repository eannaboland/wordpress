<?php
/*********************************************************************************
 * WP Ultimate CSV Importer is a Tool for importing CSV for the Wordpress
 * plugin developed by Smackcoders. Copyright (C) 2016 Smackcoders.
 *
 * WP Ultimate CSV Importer is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License version 3
 * as published by the Free Software Foundation with the addition of the
 * following permission added to Section 15 as permitted in Section 7(a): FOR
 * ANY PART OF THE COVERED WORK IN WHICH THE COPYRIGHT IS OWNED BY WP Ultimate
 * CSV Importer, WP Ultimate CSV Importer DISCLAIMS THE WARRANTY OF NON
 * INFRINGEMENT OF THIRD PARTY RIGHTS.
 *
 * WP Ultimate CSV Importer is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public
 * License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program; if not, see http://www.gnu.org/licenses or write
 * to the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor,
 * Boston, MA 02110-1301 USA.
 *
 * You can contact Smackcoders at email address info@smackcoders.com.
 *
 * The interactive user interfaces in original and modified versions
 * of this program must display Appropriate Legal Notices, as required under
 * Section 5 of the GNU Affero General Public License version 3.
 *
 * In accordance with Section 7(b) of the GNU Affero General Public License
 * version 3, these Appropriate Legal Notices must retain the display of the
 * WP Ultimate CSV Importer copyright notice. If the display of the logo is
 * not reasonably feasible for technical reasons, the Appropriate Legal
 * Notices must display the words
 * "Copyright Smackcoders. 2016. All rights reserved".
 ********************************************************************************/

if ( ! defined( 'ABSPATH' ) )
        exit; // Exit if accessed directly

class SmackUCIEmailScheduler {

	public static function send_login_credentials_to_users() {

		global $wpdb;
		$ucisettings = get_option('sm_uci_pro_settings');
		if($ucisettings['send_log_email'] == "on") {
			$get_user_meta_info = $wpdb->get_results( $wpdb->prepare( "select *from {$wpdb->prefix}usermeta where meta_key like %s", '%' . 'smack_uci_import' . '%' ) );
			if ( ! empty( $get_user_meta_info ) ) {
				foreach ( $get_user_meta_info as $key => $value ) {
					$data_array   = maybe_unserialize( $value->meta_value );
					$currentUser  = wp_get_current_user();
					$admin_email  = $currentUser->user_email;
					$em_headers   = "From: Administrator <$admin_email>"; # . "\r\n";
					$message      = "Hi,You've been invited with the role of " . $data_array['role'] . ". Here, your login details." . "\n" . "username: " . $data_array['user_login'] . "\n" . "userpass: " . $data_array['user_pass'] . "\n" . "Please click here to login " . wp_login_url();
					$emailaddress = $data_array['user_email'];
					$subject      = 'Login Details';
					if ( wp_mail( $emailaddress, $subject, $message, $em_headers ) ) {
						#delete_user_meta($value->umeta_id);
						delete_user_meta( $value->user_id, 'smack_uci_import' );
					}
				}
			}
		}
	}
}