(function($){

	// create the alert message
	function gdlr_lms_confirm(options){
        var settings = $.extend({
			text: 'Are you sure you want to do this ?',
			success:  function(){}
        }, options);

		var confirm_button = $('<a class="gdlr-lms-button blue">Yes</a>');
		var decline_button = $('<a class="gdlr-lms-button red">No</a>');
		var confirm_box = $('<div class="gdlr-lms-confirm-wrapper"></div>');
		
		confirm_box.append('<span class="head">' + settings.text + '</span>');			
		confirm_box.append(confirm_button);
		confirm_box.append(decline_button);

		$('body').append(confirm_box);
		
		// center the alert box position
		confirm_box.css({ 'margin-left': -(confirm_box.outerWidth() / 2), 'margin-top': -(confirm_box.outerHeight() / 2)});
				
		// animate the alert box
		confirm_box.animate({opacity:1},{duration: 200});
		
		confirm_button.click(function(){
			if(typeof(settings.success) == 'function'){ settings.success(); }
			confirm_box.fadeOut(200, function(){ $(this).remove(); });
		});
		decline_button.click(function(){
			confirm_box.fadeOut(200, function(){ $(this).remove(); });
		});
	}

	// update the current tab then set the new tab
	$.fn.gdlr_update_tab = function(){
		var options = new Object();
		
		$(this).children('.soccer-tab-content-wrapper').children().each(function(){
			var option = new Object();
			
			$(this).find('[data-slug], textarea.wp-editor-area').each(function(){
				option[$(this).attr('data-slug')] = $(this).gdlr_get_option_value();
			});
			
			options[$(this).attr('data-tab')] = option;
		});

		$(this).children('textarea').val(JSON.stringify(options));
	}
	
	// initiate tab item
	$.fn.gdlr_init_tab = function(){
		var current_tab = $(this);

		// tab changing event
		$(this).children('.soccer-tab-title').children().click(function(){
			if($(this).hasClass('active')) return;
			
			var new_tab = $(this).attr('data-tab');

			$(this).addClass('active').siblings().removeClass('active');
			current_tab.children('.soccer-tab-content-wrapper').children('[data-tab="' + new_tab + '"]').each(function(){
				$(this).addClass('active').siblings().removeClass('active');
			});
		});		
		
		// save page event
		$('#post-preview, #publish').click(function(){
			current_tab.gdlr_update_tab();
		});
	}
	
	// get and set option value depends on each option type
	$.fn.gdlr_get_option_value = function(){
		if( $(this).is('input[type="checkbox"]') ){
			return ($(this).attr('checked'))? 'enable': 'disable';
		}else if( $(this).is('textarea.wp-editor-area') ){
			if( $(this).parents('.wp-editor-wrap').hasClass('tmce-active') ){
				var editor = tinyMCE.get($(this).attr('id'));
				return editor.getContent();
			}else{
				return window.switchEditors.wpautop($(this).val());
			}
		}else{
			return $(this).val();
		}
	}
	
	// update normal meta box to textarea
	function gdlr_update_meta_box(){
		$('.gdlr-lms-meta-wrapper').each(function(){
			if( ! $(this).hasClass('gdlr-tabs') ){
				// save option
				var options = new Object();
				
				$(this).find('[data-slug]').each(function(){
					options[$(this).attr('data-slug')] = $(this).gdlr_get_option_value();
				});
				$(this).children('textarea').val(JSON.stringify(options));
			}
		});
	}
	
	$(document).ready(function(){
	
		// animate upload button
		$('.gdlr-lms-meta-option .gdlr-upload-box-input').change(function(){		
			$(this).siblings('.gdlr-upload-box-hidden').val($(this).val());
			if( $(this).val() == '' ){ 
				$(this).siblings('.gdlr-upload-img-sample').addClass('blank'); 
			}else{
				$(this).siblings('.gdlr-upload-img-sample').attr('src', $(this).val()).removeClass('blank');
			}
		});
		$('.gdlr-lms-meta-option .gdlr-upload-box-button').click(function(){
			var upload_button = $(this);
			var data_type = upload_button.attr('data-type');
			if( data_type == 'all' ){ data_type = ''; }
			
			var custom_uploader = wp.media({
				title: upload_button.attr('data-title'),
				button: { text: upload_button.attr('data-button') },
				library : { type : data_type },
				multiple: false
			}).on('select', function() {
				var attachment = custom_uploader.state().get('selection').first().toJSON();
				
				if( data_type == 'image' ){
					upload_button.siblings('.gdlr-upload-img-sample').attr('src', attachment.url).removeClass('blank');
				}
				upload_button.siblings('.gdlr-upload-img-sample').attr('src', attachment.url).removeClass('blank');
				upload_button.siblings('.gdlr-upload-box-input').val(attachment.url);
				upload_button.siblings('.gdlr-upload-box-hidden').val(attachment.id);
			}).open();			
		});
	
		// init wysiwyg
		$('.gdlr-lms-meta-option textarea.wp-editor-area').each(function(){
			$(this).attr('data-slug', $(this).attr('id'));
			if( $(this).parents('.wp-editor-wrap').hasClass('html-active') ){
				$(this).val( window.switchEditors.pre_wpautop($(this).val()) );
			}
		});
		
		// date picker
		$('.gdlr-lms-meta-option input.gdlr-date-picker').datepicker({ 
			dateFormat : 'yy-mm-dd',
			changeMonth: true,
			changeYear: true 
		});
		
		// checkbox
		$('.gdlr-lms-meta-option input[type="checkbox"]').each(function(){
			var show = '.' + $(this).attr('data-slug'); var hide = show;
			
			if( $(this).siblings('.checkbox-appearance').hasClass('enable') ){
				show += '-enable'; hide += '-disable';
			}else{
				show += '-disable'; hide += '-enable';
			}
			
			$(this).parents('.gdlr-lms-meta-option').siblings(hide).hide();
			$(this).parents('.gdlr-lms-meta-option').siblings(show).show();			
		});
		$('.gdlr-lms-meta-option input[type="checkbox"]').click(function(){
			var show = '.' + $(this).attr('data-slug'); var hide = show;
		
			if( $(this).siblings('.checkbox-appearance').hasClass('enable') ){
				show += '-disable'; hide += '-enable';
				$(this).siblings('.checkbox-appearance').removeClass('enable');
			}else{
				show += '-enable'; hide += '-disable';
				$(this).siblings('.checkbox-appearance').addClass('enable');
			}
			
			$(this).parents('.gdlr-lms-meta-option').siblings(hide).slideUp();
			$(this).parents('.gdlr-lms-meta-option').siblings(show).slideDown();
		});
		
		// course tab content 
		$('.gdlr-lms-meta-wrapper.gdlr-tabs').gdlr_init_tab();
		
		// save changes
		$('#post-preview, #publish').click(function(){
			gdlr_update_meta_box();
		});
	});
	
})(jQuery);