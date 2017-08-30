<?php

add_action('pmxi_saved_post', 'post_saved', 10, 1);

function get_id_by_title($title) {
    global $wpdb;

    $attachments = $wpdb->get_results( "SELECT * FROM $wpdb->posts WHERE post_title LIKE '%$title%' AND post_type = 'attachment' ", OBJECT );
    if ($attachments){
        $attachment_url = $attachments[0]->ID;
    } else {
        return NULL;
    }

    return $attachment_url;
}

function post_saved($id) {
	
	$fixture_result_val = gdlr_lms_decode_preventslashes(get_post_meta($id, 'gdlr-soccer-fixture-result-settings', true));
	$fixture_result_settings_val = json_decode($fixture_result_val, true);
	
	$home = $fixture_result_settings_val['home'];
	$home_id = get_id_by_title($home);
	$fixture_result_settings_val['home-flag'] = $home_id;

	$away = $fixture_result_settings_val['away'];
	$away_id = get_id_by_title($away);
	$fixture_result_settings_val['away-flag'] = $away_id;
		
	$json_value = json_encode($fixture_result_settings_val, JSON_FORCE_OBJECT);
	//Nasty hack but Real Soccer expects a JSON string
	$json_value = str_replace("{","\{",$json_value);
	$json_value = str_replace("}","\}",$json_value);
	
    update_post_meta($id, 'gdlr-soccer-fixture-result-settings', $json_value);
}

?>