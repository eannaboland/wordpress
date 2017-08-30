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

class SmackUCIUserDataImport {

	public function importUserInformation ($data_array, $mode, $eventKey) {
		global $uci_admin;
		#$data_array = trim($data_array);
		if ( isset( $data_array['role'] ) && $data_array['role'] != '') {
			$user_capability = '';
			if ( !is_numeric( $data_array['role'] ) ) {
				$roles = $uci_admin->getRoles();
				if(array_key_exists($data_array['role'], $roles)) {
					$user_capability = $data_array['role'];
				}
			} else {
				for ( $i = 0; $i <= $data_array['role']; $i ++ ) {
					$user_capability .= $i . ",";
				}
				$roles = $uci_admin->getRoles('cap');
				if(in_array( $user_capability, $roles )) {
					foreach ( $roles as $rkey => $rval ) {
						if ( $rval == $user_capability ) {
							$user_capability = $rkey;
						}
					}
				} else {
					$user_capability = ''; #TODO: Add log message for assigning the default role
				}
			}
			if($user_capability != '')
				$data_array['role'] = $user_capability;
			else
				$data_array['role'] = 'subscriber'; #TODO: Add log message for assigning the default role
		} else {
			$data_array['role'] = 'subscriber'; #TODO: Add log message for assigning the default role
		}

		$user_email = $data_array['user_email'];
		if ( empty( $data_array['user_pass'] ) ) {
			$data_array['user_pass'] = wp_generate_password( 12, false );
			$additional_meta_info = array(
				'user_login' => $data_array['user_login'],
				'user_pass'  => $data_array['user_pass'],
				'user_email' => $data_array['user_email'],
				'role'       => $data_array['role']
			);
			$data_array['smack_uci_import'] = $additional_meta_info;
		}

		if ( $mode == 'Insert' ) {
			$retID          = wp_insert_user( $data_array );

			$mode_of_affect = 'Inserted';
			if ( is_wp_error( $retID ) ) {
				#echo $retID->get_error_message();
				$uci_admin->detailed_log[$uci_admin->processing_row_id]['Message'] = "Skipped, Due to duplicate User found with same email!.";
				return array('MODE' => $mode, 'ERROR_MSG' => $retID->get_error_message());
				#TODO Exception
			}
			$uci_admin->setAffectedRecords($retID);
			#$_SESSION[$eventKey]['summary']['inserted'][] = $retID;
			$uci_admin->setInsertedRowCount( $uci_admin->getInsertedRowCount() + 1 );
			$uci_admin->detailed_log[$uci_admin->processing_row_id]['Message'] = 'Inserted User ID: ' . $retID;
		} else {
			if ( ( $mode == 'Update' ) || ( $mode == 'Schedule' ) ) {
				global $wpdb;
				//$update_query = "select ID from $wpdb->users where user_email = '{$user_email}' order by ID DESC";
				$update_query = $wpdb->prepare( "select ID from $wpdb->users where user_email = %s order by ID DESC", $user_email );
				$ID_result    = $wpdb->get_results( $update_query );
				if ( is_array( $ID_result ) && ! empty( $ID_result ) ) {
					$retID            = $ID_result[0]->ID;
					$data_array['ID'] = $retID;
					wp_update_user( $data_array );
					$mode_of_affect = 'Updated';
					$uci_admin->setUpdatedRowCount( $uci_admin->getUpdatedRowCount() + 1 );
					$uci_admin->detailed_log[$uci_admin->processing_row_id]['Message'] = 'Updated User ID: ' . $retID;
					$uci_admin->setAffectedRecords($retID);
					#$_SESSION[$eventKey]['summary']['updated'][] = $retID;
				} else {
					$retID          = wp_insert_user( $data_array );
					if ( is_wp_error( $retID ) ) {
						#echo $retID->get_error_message();
						$uci_admin->detailed_log[$uci_admin->processing_row_id]['Message'] = "Skipped, Due to duplicate User found with same email!.";
						return array('MODE' => $mode, 'ERROR_MSG' => $retID->get_error_message());
						#TODO Exception
					}
					$mode_of_affect = 'Inserted';
					$uci_admin->setAffectedRecords($retID);
					#$_SESSION[$eventKey]['summary']['inserted'][] = $retID;
					$uci_admin->setInsertedRowCount( $uci_admin->getInsertedRowCount() + 1 );
					$uci_admin->detailed_log[$uci_admin->processing_row_id]['Message'] = 'Inserted User ID: ' . $retID;
				}
			} else {
				$retID = wp_insert_user( $data_array );
				if ( is_wp_error( $retID ) ) {
					#echo $retID->get_error_message();
					$uci_admin->detailed_log[$uci_admin->processing_row_id]['Message'] = "Skipped, Due to duplicate User found with same email!.";
					return array('MODE' => $mode, 'ERROR_MSG' => $retID->get_error_message());
					#TODO Exception
				}
				$mode_of_affect = 'Inserted';
				$uci_admin->setAffectedRecords($retID);
				#$_SESSION[$eventKey]['summary']['inserted'][] = $retID;
				$uci_admin->setInsertedRowCount( $uci_admin->getInsertedRowCount() + 1 );
				$uci_admin->detailed_log[$uci_admin->processing_row_id]['Message'] = 'Inserted User ID: ' . $retID;
			}
		}
		$metaData = array();
		foreach ( $data_array as $daKey => $daVal ) {
			switch ( $daKey ) {
				case 'biographical_info' :
					$metaData['description'] = $data_array[ $daKey ];
					break;
				case 'disable_visual_editor' :
					$metaData['rich_editing'] = $data_array[ $daKey ];
					break;
				case 'enable_keyboard_shortcuts':
					$metaData['comment_shortcuts'] = $data_array[ $daKey ];
					break;
				case 'admin_color':
					$metaData['admin_color'] = $data_array[ $daKey ];
					break;
				case 'show_toolbar':
					$metaData['show_admin_bar_front'] = $data_array[ $daKey ];
					break;
				case 'smack_uci_import':
					$metaData['smack_uci_import'] = $data_array[ $daKey ];
			}
		}
		if ( ! empty ( $metaData ) ) {
			foreach ( $metaData as $meta_key => $meta_value ) {
				update_user_meta( $retID, $meta_key, $meta_value );
			}
		}
		$uci_admin->detailed_log[$uci_admin->processing_row_id]['Email'] = $data_array['user_email'];
		$uci_admin->detailed_log[$uci_admin->processing_row_id]['Role'] = $data_array['role'];
		return array('ID' => $retID, 'MODE' => $mode_of_affect);
	}

	public function importDataForUsers_BillingShipping($data_array, $uID){
		foreach( $data_array as $daKey => $daVal ) {
			if(strpos($daKey, 'msi_') === 0) {
				$msi_custom_key = substr($daKey, 4);
				$msi_shipping_array[$msi_custom_key] = $daVal;
			} elseif(strpos($daKey, 'mbi_') === 0) {
				$mbi_custom_key = substr($daKey, 4);
				$mbi_billing_array[$mbi_custom_key] = $daVal;
			} else {
				update_user_meta($uID, $daKey, $daVal);
			}
		}
		//Import MarketPress Shipping Info
		if (!empty ($msi_shipping_array)) {
			$custom_key = 'mp_shipping_info';
			update_user_meta($uID, $custom_key, $msi_shipping_array);
		}
		//Import MarketPress Billing Info
		if (!empty ($mbi_billing_array)) {
			$custom_key = 'mp_billing_info';
			update_user_meta($uID, $custom_key, $mbi_billing_array);
		}
	}

	public function importDataForUsers_WPMembers($data_array, $uID) {
		#$createdFields = array();
		if(!empty($data_array)) {
			foreach ($data_array as $custom_key => $custom_value) {
				update_user_meta($uID, $custom_key, $custom_value);
			}
		}
	}
}
