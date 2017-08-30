<?php
	/*
	*	Goodlayers League Table File
	*/

	// add action to check for league table item
	add_action('gdlr_print_item_selector', 'gdlr_league_table_item', 10, 2);
	function gdlr_league_table_item($type, $settings = array()){
		if($type == 'league-table'){
			gdlr_print_league_table_item($settings);
		}
	}

	// sort table
	function gdlr_sort_league_table($league_table){
		$sorted_league_table = array();
		while( !empty($league_table) ){
			$team = ''; $point = -1;
			foreach($league_table as $team_name => $team_score){
				if( $team_score['pts'] > $point ){
					$point = $team_score['pts'];
					$team = $team_name;
				}else if( $team_score['pts'] == $point ){
					if($team_score['gd'] > $league_table[$team]['gd']){
						$team = $team_name;
					}else if($team_score['gd'] == $league_table[$team]['gd']){
						if($team_score['overall-win'] > $league_table[$team]['overall-win']){
							$team = $team_name;
						}
					}
				}
			}
			$sorted_league_table[$team] = $league_table[$team];
			unset($league_table[$team]);
		}
		return $sorted_league_table;
	}

	// league table item
	function gdlr_print_league_table_item($settings){
		$item_id = empty($settings['page-item-id'])? '': ' id="' . $settings['page-item-id'] . '" ';

		global $gdlr_spaces;
		$margin = (!empty($settings['margin-bottom']) &&
			$settings['margin-bottom'] != $gdlr_spaces['bottom-item'])? 'margin-bottom: ' . $settings['margin-bottom'] . ';': '';
		$margin_style = (!empty($margin))? ' style="' . $margin . '" ': '';

		// query league table
		$args = array('post_type' => 'league_table', 'suppress_filters' => false);
		$args['posts_per_page'] = 999;
		$args['paged'] = 1;
		$args['orderby'] = 'title';
		$args['order'] = 'asc';
		if( !empty($settings['category']) ){
			$args['tax_query'] = array();
			if( !empty($settings['category']) ){
				array_push($args['tax_query'], array('terms'=>explode(',', $settings['category']), 'taxonomy'=>'league_category', 'field'=>'slug'));
			}
		}
		$query = new WP_Query( $args );

		// getting table array
		$league_table = array();
		while($query->have_posts()){ $query->the_post();
			$league_val = gdlr_lms_decode_preventslashes(get_post_meta(get_the_ID(), 'gdlr-soccer-league-table-settings', true));
			$league_options = empty($league_val)? array(): json_decode($league_val, true);

			$lists = array('win', 'draw', 'lose');
			$league_table[get_the_title()] = $league_options;
			foreach( $lists as $list ){
				$league_table[get_the_title()]['overall-' . $list] = $league_table[get_the_title()]['home-' . $list] + $league_table[get_the_title()]['away-' . $list];
			}
			$league_table[get_the_title()]['p'] = ($league_table[get_the_title()]['overall-win'] + $league_table[get_the_title()]['overall-draw'] + $league_table[get_the_title()]['overall-lose']);
			$league_table[get_the_title()]['gd'] = ($league_table[get_the_title()]['home-goal-score'] + $league_table[get_the_title()]['away-goal-score']) -
				($league_table[get_the_title()]['home-goal-concede'] + $league_table[get_the_title()]['away-goal-concede']);
			$league_table[get_the_title()]['pts'] = ($league_table[get_the_title()]['overall-win'] * 3) + $league_table[get_the_title()]['overall-draw'];
		}
		$league_table = gdlr_sort_league_table($league_table);

		echo gdlr_get_item_title($settings);
		echo '<div class="gdlr-item gdlr-league-table-item" ' . $item_id . $margin_style . ' >';
		if(empty($settings['style']) || $settings['style'] == 'full'){
			gdlr_print_league_table_table($league_table);
		}else{
			gdlr_print_league_small_table($league_table, $settings['num-display']);

			if( !empty($settings['button-link']) ){
				echo '<a class="gdlr-full-table-link gdlr-button with-border" href="' . $settings['button-link'] . '">' . $settings['button-text'] . '</a>';
			}
		}
		echo '</div>';
	}

	// league table
	function gdlr_print_league_table_table($team_list){
		echo '<table class="gdlr-league-table" >';
?>
<tr class="gdlr-table-first-head gdlr-title-font" >
	<th class="gdlr-table-pos"></th><th class="gdlr-table-team"></th><th class="gdlr-table-p"></th>
	<th class="gdlr-table-home" colspan="5"><?php echo __('Home', 'gdlr-soccer'); ?></th>
	<th class="gdlr-table-away" colspan="5"><?php echo __('Away', 'gdlr-soccer'); ?></th>
	<th class="gdlr-table-overall" colspan="5"><?php echo __('Overall', 'gdlr-soccer'); ?></th>
</tr>
<tr class="gdlr-table-second-head gdlr-title-font">
	<th class="gdlr-table-pos"><?php echo __('Pos', 'gdlr-soccer'); ?></th><th class="gdlr-table-team"><?php echo __('Team', 'gdlr-soccer'); ?></th><th class="gdlr-table-p">P</th>
	<th class="gdlr-table-score">W</th><th class="gdlr-table-score">D</th><th class="gdlr-table-score">L</th><th class="gdlr-table-score">F</th><th class="gdlr-table-score gdlr-table-end">A</th>
	<th class="gdlr-table-score">W</th><th class="gdlr-table-score">D</th><th class="gdlr-table-score">L</th><th class="gdlr-table-score">F</th><th class="gdlr-table-score gdlr-table-end">A</th>
	<th class="gdlr-table-score">W</th><th class="gdlr-table-score">D</th><th class="gdlr-table-score">L</th><th class="gdlr-table-score">GD</th><th class="gdlr-table-score">PTS</th>
</tr>
<?php
		$count = 1;
		foreach($team_list as $team_name => $team_score ){
?>
<tr>
	<td class="gdlr-table-pos"><?php echo $count; ?></td><td class="gdlr-table-team"><?php 
		// flag
		if( !empty($team_score['flag']) ){ echo '<span class="gdlr-team-flag">' . gdlr_get_image($team_score['flag']) . '</span>'; }
		
		echo $team_name 
	?></td><td class="gdlr-table-p"><?php echo $team_score['p']; ?></td>
	<td class="gdlr-table-score"><?php echo $team_score['home-win']; ?></td><td class="gdlr-table-score"><?php echo $team_score['home-draw']; ?></td><td class="gdlr-table-score"><?php echo $team_score['home-lose']; ?></td><td class="gdlr-table-score"><?php echo $team_score['home-goal-score']; ?></td><td class="gdlr-table-score gdlr-table-end"><?php echo $team_score['home-goal-concede']; ?></td>
	<td class="gdlr-table-score"><?php echo $team_score['away-win']; ?></td><td class="gdlr-table-score"><?php echo $team_score['away-draw']; ?></td><td class="gdlr-table-score"><?php echo $team_score['away-lose']; ?></td><td class="gdlr-table-score"><?php echo $team_score['away-goal-score']; ?></td><td class="gdlr-table-score gdlr-table-end"><?php echo $team_score['away-goal-concede']; ?></td>
	<td class="gdlr-table-score"><?php echo $team_score['overall-win']; ?></td><td class="gdlr-table-score"><?php echo $team_score['overall-draw']; ?></td><td class="gdlr-table-score"><?php echo $team_score['overall-lose']; ?></td><td class="gdlr-table-score"><?php echo $team_score['gd']; ?></td><td class="gdlr-table-score"><?php echo $team_score['pts']; ?></td>
</tr>
<?php
			$count++;
		}
		echo '</table>';
	}

	// small league table
	function gdlr_print_league_small_table($team_list, $num_display){
		echo '<table class="gdlr-small-league-table" >';
?>
<tr class="gdlr-table-second-head">
	<th class="gdlr-table-team"><?php echo __('Team', 'gdlr-soccer'); ?></th>
	<th class="gdlr-table-score">W</th><th class="gdlr-table-score">D</th>
	<th class="gdlr-table-score">L</th><th class="gdlr-table-score">PTS</th>
</tr>
<?php
		$count = 0;
		foreach($team_list as $team_name => $team_score ){ $count++;
			if($count > $num_display && (empty($team_score['sticky']) || $team_score['sticky'] == 'disable')) continue;
?>
<tr <?php echo (!empty($team_score['sticky']) && $team_score['sticky'] == 'enable')? 'class="gdlr-current-team"': ''; ?> >
	<td class="gdlr-table-team"><?php 
	
		echo '<span class="team-count">'  . $count . '</span> ';
		
		//flag
		if( !empty($team_score['flag']) ){ echo '<span class="gdlr-team-flag">' . gdlr_get_image($team_score['flag']) . '</span>'; }
		
		echo $team_name;
		
	?></td>
	<td class="gdlr-table-score"><?php echo $team_score['overall-win']; ?></td>
	<td class="gdlr-table-score"><?php echo $team_score['overall-draw']; ?></td>
	<td class="gdlr-table-score"><?php echo $team_score['overall-lose']; ?></td>
	<td class="gdlr-table-score gdlr-table-pts"><?php echo $team_score['pts']; ?></td>
</tr>
<?php
		}
		echo '</table>';
	}
?>
