<?php
   /*
   Plugin Name: gaa_api
   Plugin URI: http://...
   Description: a plugin to create custom api calls for GAA data
   Version: 1.2
   Author: Ryark Ltd.
   Author URI: http://...
   License: GPL2
   */


function get_coordinates($data) {
	global $wpdb;

	$hometeam = urldecode($data->get_param('hometeam'));
	$location = urldecode($data->get_param('location'));

	$maptable = $wpdb->prefix.'map_locations';

	//count the number of pitches per club
	$pitchcount = $wpdb->get_results( "SELECT * FROM $maptable WHERE location_address LIKE '%$hometeam%'; ", OBJECT );
	$numpitches = count($pitchcount);
	//return $pitchcount;


	//count the number of pitches per club
	if ($numpitches == 1) {
		$pitchdata = $wpdb->get_results( "SELECT location_title,location_longitude,location_latitude FROM $maptable WHERE location_address LIKE '%$hometeam%'", OBJECT );

		return $pitchdata;
		//location_latitude,
	}


	//count the number of pitches per club
	elseif($numpitches> 1) {  $pitchdata = $wpdb->get_results( "SELECT location_title,location_longitude,location_latitude
 FROM $maptable
  WHERE location_address LIKE '%$hometeam%' 
 AND   location_title LIKE '%$location%'", OBJECT );

		return $pitchdata;
		//location_latitude,
	}
	else{
		return $hometeam;
	}

}


function post_saved($id) {

	$fixture_result_val = gdlr_lms_decode_preventslashes(get_post_meta($id, 'gdlr-soccer-fixture-result-settings', true));
	$fixture_result_settings_val = json_decode($fixture_result_val, true);

	$location = get_post_meta($id, 'location', true);
	$hometeam = get_post_meta($id, 'hometeam', true);

	$result = get_coordinates($hometeam,$location);
	//$result = get_coordinates($hometeam);
	if (!$result.is_null()) {
		$fixture_result_settings_val['longitude'] = $result['location_longitude'];
		$fixture_result_settings_val['latitude'] = $result['location_latitude'];
		update_post_meta($id, 'longitude', $result['location_longitude']);
		update_post_meta($id, 'latitude', $result['location_latitude']);
		//$fixture_result_settings_val['longitude'] = "test2";
		//$fixture_result_settings_val['latitude'] = "test2";
		//update_post_meta($id, 'longitude', "test2");
		//update_post_meta($id, 'latitude', "test2");
	}
	else {
		$fixture_result_settings_val['longitude'] = "test1";
		$fixture_result_settings_val['latitude'] = "test1";
		update_post_meta($id, 'longitude', "test1");
		update_post_meta($id, 'latitude', "test1");
	}





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


/**
 * Grab latest post title by an author!
 *
 * @param array $data Options for the function.
 * @return string|null Post title for the latest,  * or null if none.
 */
function fixture_details( $data ) {

	$category = urldecode($data->get_param('category'));

	$args = array(
		'post_type' => 'fixture_and_result',
		'posts_per_page' => 50,
		'meta_query' => array(
			array(
				'key' => 'category',
				'value' => $category
			)
		)
	);

	$q = new WP_Query();
	$query = $q->query( $args );

	$match_options = parse_map_options($query);

	return $match_options;

}

function current_fixture_details( $data ) {

	$category = urldecode($data->get_param('category'));

	$args = array(
		'post_type' => 'fixture_and_result',
		'posts_per_page' => 50,

		'meta_query' => array(
			array(
				'key' => 'category',
				'value' => $category
			),
			array(
				'key' => 'dateofmatch',
				'value' => date("d/m/Y"),
				'compare' => '=='
			)
		)
	);

	$q = new WP_Query();
	$query = $q->query( $args );

	$match_options = parse_map_options($query);

	return $match_options;

}

function parse_map_options($query) {

	$posts_arr = array();

	foreach ($query as $p) {

			$match_val = gdlr_lms_decode_preventslashes(get_post_meta($p->ID, 'gdlr-soccer-fixture-result-settings', true));
			$match_options = empty($match_val)? array(): json_decode($match_val, true);	

			$matchtime = get_post_meta($p->ID, 'matchtime', true);
			$match_options['matchtime'] = $matchtime;

			$dateofmatch = get_post_meta($p->ID, 'dateofmatch', true);
			$match_options['dateofmatch'] = $dateofmatch;

			$match_options['home-flag-url'] = wp_get_attachment_image_src($match_options['home-flag'])[0];
			$match_options['away-flag-url'] = wp_get_attachment_image_src($match_options['away-flag'])[0];

		$posts_arr[] = $match_options;
	}

	return $posts_arr;


}


add_action( 'rest_api_init', function () {
	register_rest_route( 'gaa_api/v1', '/fixtures/(?P<category>([a-zA-Z0-9-]|%20)+)', array(
		'methods' => 'GET',
		'callback' => 'fixture_details',
		)
	);

	register_rest_route( 'gaa_api/v1', '/fixtures/current/(?P<category>([a-zA-Z0-9-]|%20)+)', array(
		'methods' => 'GET',
		'callback' => 'current_fixture_details',
		)
	);

	register_rest_route( 'gaa_api/v1', '/test/(?P<hometeam>([a-zA-Z0-9-]|%20)+)/(?P<location>([a-zA-Z0-9-]|%20)+)', array(
			'methods' => 'GET',
			'callback' => 'get_coordinates',
		)
	);
} );

?>