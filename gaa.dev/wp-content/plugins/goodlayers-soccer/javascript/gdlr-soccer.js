(function($){
	"use strict";
	
	// get fixture result using ajax
	function gdlr_result_ajax(result_holder, ajax_info, category, paged){

		var args = new Object();
		args['button-link'] = ajax_info.attr('data-button-link');
		args['button-text'] = ajax_info.attr('data-button-text');
		args['style'] = ajax_info.attr('data-style');
		args['pagination'] = ajax_info.attr('data-pagination');
		args['num-fetch'] = ajax_info.attr('data-num-fetch');
		args['order'] = ajax_info.attr('data-order');
		args['category'] = (category)? category: ajax_info.attr('data-category');
		args['paged'] = (paged)? paged: 1;

		// hide the un-used elements
		var animate_complete = false;
		result_holder.slideUp(500, function(){
			animate_complete = true;
		});
		result_holder.siblings('.gdlr-pagination').slideUp(500, function(){
			$(this).remove();
		});
		
		var now_loading = $('<div class="gdlr-now-loading"></div>');
		now_loading.insertBefore(result_holder);
		now_loading.slideDown();
		
		// call ajax to get player item
		$.ajax({
			type: 'POST',
			url: ajax_info.attr('data-ajax'),
			data: {'action': 'gdlr_get_result_ajax', 'args': args},
			error: function(a, b, c){ console.log(a, b, c); },
			success: function(data){
				now_loading.css('background-image','none').slideUp(function(){ $(this).remove(); });	
			
				var result_item = $(data).hide();
				if( animate_complete ){
					result_holder.replaceWith(result_item);
					result_item.slideDown(function(){ $(window).trigger('resize'); });
				}else{
					setTimeout(function() {
						result_holder.replaceWith(result_item);
						result_item.slideDown(function(){ $(window).trigger('resize'); });
					}, 500);
				}	
			}
		});		
		
	}

	// get player using ajax
	function gdlr_player_ajax(player_holder, ajax_info, category, paged){

		var args = new Object();
		args['pagination'] = ajax_info.attr('data-pagination');
		args['num-fetch'] = ajax_info.attr('data-num-fetch');
		args['num-excerpt'] = ajax_info.attr('data-num-excerpt');
		args['order'] = ajax_info.attr('data-order');
		args['orderby'] = ajax_info.attr('data-orderby');
		args['thumbnail-size'] = ajax_info.attr('data-thumbnail-size');
		args['player-style'] = ajax_info.attr('data-player-style');
		args['player-size'] = ajax_info.attr('data-player-size');
		args['player-layout'] = ajax_info.attr('data-player-layout');
		args['category'] = (category)? category: ajax_info.attr('data-category');
		args['paged'] = (paged)? paged: 1;

		// hide the un-used elements
		var animate_complete = false;
		player_holder.slideUp(500, function(){
			animate_complete = true;
		});
		player_holder.siblings('.gdlr-pagination').slideUp(500, function(){
			$(this).remove();
		});
		
		var now_loading = $('<div class="gdlr-now-loading"></div>');
		now_loading.insertBefore(player_holder);
		now_loading.slideDown();
		
		// call ajax to get player item
		$.ajax({
			type: 'POST',
			url: ajax_info.attr('data-ajax'),
			data: {'action': 'gdlr_get_player_ajax', 'args': args},
			error: function(a, b, c){ console.log(a, b, c); },
			success: function(data){
				now_loading.css('background-image','none').slideUp(function(){ $(this).remove(); });	
			
				var player_item = $(data).hide();
				if( animate_complete ){
					player_holder.replaceWith(player_item);
					player_item.slideDown(function(){ $(window).trigger('resize'); });
				}else{
					setTimeout(function() {
						player_holder.replaceWith(player_item);
						player_item.slideDown(function(){ $(window).trigger('resize'); });
					}, 500);
				}	
			}
		});		
		
	}

	$(document).ready(function(){
		
		// single soccer
		$('body.single-player').find('.gdlr-soccer-tab').click(function(){
			if( !$(this).hasClass('active') ){
				$(this).addClass('active').siblings().removeClass('active');

				$('.gdlr-soccer-tab-content[data-tab="' + $(this).attr('data-tab') + '"]').addClass('active').siblings().removeClass('active');
			}
			return false;
		});
		
		// player item
		function gdlr_resize_modern_player(){
			$('.gdlr-modern-player').each(function(){
				$(this).find('.gdlr-modern-player-item-content-inner').each(function(){
					$(this).css('margin-top', - $(this).height() / 2);
				});
			});
		}
		gdlr_resize_modern_player();
		$(window).resize(function(){ gdlr_resize_modern_player(); });
		
		// player ajax
		$('.player-item-filter a').click(function(){
			if($(this).hasClass('active')) return false;
			$(this).addClass('active').siblings().removeClass('active');
		
			var player_holder = $(this).parent('.player-item-filter').siblings('.player-item-holder');
			var ajax_info = $(this).parent('.player-item-filter').siblings('.gdlr-ajax-info');

			gdlr_player_ajax(player_holder, ajax_info, $(this).attr('data-category'));
			return false;
		});		
		$('.player-item-wrapper').on('click', '.gdlr-pagination.gdlr-ajax a', function(){
			if($(this).hasClass('current')) return;
			
			var player_holder = $(this).parent('.gdlr-pagination').siblings('.player-item-holder');
			var ajax_info = $(this).parent('.gdlr-pagination').siblings('.gdlr-ajax-info');
			var category = $(this).parent('.gdlr-pagination').siblings('.player-item-filter');
			if( category ){
				category = category.children('.active').attr('data-category');
			}
			
			gdlr_player_ajax(player_holder, ajax_info, category, $(this).attr('data-paged'));
			return false;
		});
		
		// result ajax
		$('.fixture-result-item-filter a').click(function(){
			if($(this).hasClass('active')) return false;
			$(this).addClass('active').siblings().removeClass('active');
		
			var result_holder = $(this).parent('.fixture-result-item-filter').siblings('.fixture-result-item-holder');
			var ajax_info = $(this).parent('.fixture-result-item-filter').siblings('.gdlr-ajax-info');

			gdlr_result_ajax(result_holder, ajax_info, $(this).attr('data-category'));
			return false;
		});		
		$('.fixture-result-item-wrapper').on('click', '.gdlr-pagination.gdlr-ajax a', function(){
			if($(this).hasClass('current')) return;
			
			var result_holder = $(this).parent('.gdlr-pagination').siblings('.fixture-result-item-holder');
			var ajax_info = $(this).parent('.gdlr-pagination').siblings('.gdlr-ajax-info');
			var category = $(this).parent('.gdlr-pagination').siblings('.fixture-result-item-filter');
			if( category ){
				category = category.children('.active').attr('data-category');
			}
			
			gdlr_result_ajax(result_holder, ajax_info, category, $(this).attr('data-paged'));
			return false;
		});		
	});

})(jQuery);