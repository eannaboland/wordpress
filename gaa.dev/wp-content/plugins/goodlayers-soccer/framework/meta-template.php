<?php
	/*	
	*	Goodlayers Meta Template File
	*/	
	
	// decide to print different option
	function gdlr_lms_print_meta_box($settings){
		if( $settings['type'] == 'title' ){
			if( !empty($settings['class']) && $settings['class'] == 'with-space' ){
				echo '<div class="clear" style="height:30px;" ></div>';
			}
			echo '<h3>' . $settings['title'] . '</h3>'; return;
		}
	
		$settings['wrapper-class'] = empty($settings['wrapper-class'])? '': $settings['wrapper-class'];
		echo '<div class="gdlr-lms-meta-option ' . $settings['wrapper-class'] . ' type-' . $settings['type'] . '">';
		if( !empty($settings['title']) ){
			echo '<span class="gdlr-lms-meta-title"> ' . $settings['title'] . ' : </span>';
		}
		switch ($settings['type']){
			case 'upload': gdlr_lms_print_upload_box($settings); break;
			case 'text': gdlr_lms_print_text_input($settings); break;
			case 'textarea': gdlr_lms_print_textarea($settings); break;
			case 'combobox': gdlr_lms_print_combobox($settings); break;
			case 'checkbox': gdlr_lms_print_checkbox($settings); break;
			case 'datepicker': gdlr_lms_print_datepicker($settings); break;
			case 'wysiwyg': gdlr_lms_print_wysiwyg($settings); break;
			case 'question': gdlr_lms_print_question($settings); break;
		}
		if( !empty($settings['description']) ){
			echo '<span class="gdlr-lms-meta-description"> ' . $settings['description'] . '</span>';
		}
		echo '</div>';
	}
	
	// print upload box
	function gdlr_lms_print_upload_box($settings){
		$settings['class'] = empty($settings['class'])? '': $settings['class'];

		$value = ''; $file_url = '';
		$settings['data-type'] = empty($settings['data-type'])? 'image': $settings['data-type'];
		$settings['data-type'] = ($settings['data-type']=='upload')? 'image': $settings['data-type'];
		
		if( !empty($settings['value']) ){
			$value = $settings['value'];
		}else if( !empty($settings['default']) ){
			$value = $settings['default'];
		}
		
		if( is_numeric($value) ){ 
			$file_url = wp_get_attachment_url($value);
		}else{
			$file_url = $value;
		}
		
		// example image url
		echo '<img class="gdlr-upload-img-sample ';
		echo (empty($file_url) || $settings['data-type'] != 'image')? 'blank': '';
		echo '" ';
		echo (!empty($file_url) && $settings['data-type'] == 'image')? 'src="' . $file_url . '" ': ''; 
		echo '/>';
		echo '<div class="clear"></div>';
		
		// input link url
		echo '<input type="text" class="gdlr-upload-box-input" value="' . $file_url . '" />';					
		
		// hidden input
		echo '<input type="hidden" class="gdlr-upload-box-hidden" ';
		echo 'data-slug="' . $settings['slug'] . '" ';
		echo 'value="' . $value . '" />';
		
		// upload button
		echo '<input type="button" class="gdlr-upload-box-button gdl-button" ';
		echo 'data-title="' . $settings['title'] . '" ';
		echo 'data-type="' . $settings['data-type'] . '" ';				
		echo 'data-button="';
		echo (empty($settings['button']))? __('Insert Image', 'gdlr_translate'):$settings['button'];
		echo '" ';
		echo 'value="' . __('Upload', 'gdlr_translate') . '"/>';
		
		echo '<div class="clear"></div>';	
	}	
	
	// print text input
	function gdlr_lms_print_text_input($settings){
		$settings['class'] = empty($settings['class'])? '': $settings['class'];
	
		echo '<input type="text" class="gdl-text-input ' . $settings['class'] . '" data-slug="' . $settings['slug'] . '" ';
		if( isset($settings['value']) ){
			echo 'value="' . esc_attr($settings['value']) . '" ';
		}else if( !empty($settings['default']) ){
			echo 'value="' . esc_attr($settings['default']) . '" ';
		}
		echo '/>';	
	}
	
	// print textarea
	function gdlr_lms_print_textarea($settings){
		$settings['class'] = empty($settings['class'])? '': $settings['class'];

		echo '<textarea class="gdl-text-input ' . $settings['class'] . '" data-slug="' . $settings['slug'] . '" >';
		if( isset($settings['value']) ){
			echo esc_attr($settings['value']);
		}else if( !empty($settings['default']) ){
			echo esc_attr($settings['default']);
		}
		echo '</textarea>';	
	}	
	
	// print combobox
	function gdlr_lms_print_combobox($settings = array()){
		$value = '';
		if( !empty($settings['value']) ){
			$value = $settings['value'];
		}else if( !empty($settings['default']) ){
			$value = $settings['default'];
		}
		
		echo '<div class="gdlr-combobox-wrapper">';
		echo '<select data-slug="' . $settings['slug'] . '" >';
		foreach($settings['options'] as $slug => $title ){
			echo '<option value="' . $slug . '" ';
			echo ($value == $slug)? 'selected ': '';
			echo '>' . $title . '</option>';
		
		}
		echo '</select>';
		echo '</div>'; // gdlr-combobox-wrapper
	}	
	
	// print the checkbox ( enable / disable )
	function gdlr_lms_print_checkbox($settings = array()){
		$value = 'enable';
		if( !empty($settings['value']) ){
			$value = $settings['value'];
		}else if( !empty($settings['default']) ){
			$value = $settings['default'];
		}
		
		echo '<label for="' . $settings['slug'] . '-id" class="checkbox-wrapper">';
		echo '<span class="checkbox-appearance ' . $value . '" >enable/disable</span>';
		
		echo '<input type="checkbox" data-slug="' . $settings['slug'] . '" id="' . $settings['slug'] . '-id" ';
		echo ($value == 'enable')? 'checked': '';
		echo ' value="enable" />';			
		echo '</label>';		
	}		

	// print the datepicker
	function gdlr_lms_print_datepicker($settings = array()){
		echo '<input type="text" class="gdl-text-input medium gdlr-date-picker" data-slug="' . $settings['slug'] . '" ';
		if( isset($settings['value']) ){
			echo 'value="' . esc_attr($settings['value']) . '" ';
		}else if( !empty($settings['default']) ){
			echo 'value="' . esc_attr($settings['default']) . '" ';
		}
		echo '/>';
	}	
	
	// print wysiwyg editor
	function gdlr_lms_print_wysiwyg($settings){
		$value = '';
		if( !empty($settings['value']) ){
			$value = $settings['value'];
		}else if( !empty($settings['default']) ){
			$value = $settings['default'];
		}	
	
		wp_editor($value, $settings['slug'], array('tinymce'=>array('height' => 250)));
	}

?>