jQuery(document).ready(function() {
	UpdraftCentral_Site_Search = UpdraftCentral_Site_Search();
});

/**
 * * An object for managing site search by site name or url
 * * @constructor
 **/
var UpdraftCentral_Site_Search = function () {
	var self = this;
	var $ = jQuery;

	$('#updraftcentral_dashboard_existingsites').on('updraftcentral_dashboard_mode_set', function(event, data) {
		var filter_text = $('#udc_search_tag').val();
		if (filter_text != '') {
			self.searching_sites(filter_text);
		} else {
			self.clear_filters();
		}
	})
	
	// Adding the behavior to the key up event to the searching input
	$('.udc_search_tag').on('keyup',function(e) {
		var filter_text = $(this).val();
		if (filter_text != '') {
			self.searching_sites(filter_text);
		} else {
			self.clear_filters();
		}
	});
	
	/**
	 ** Clearing the sites filters by showing all the sites
	 ** @returns {void}
	 **/
	this.clear_filters = function () {
			var sites_row = $('.updraftcentral_site_row');
		var sites_border = $('.updraftcentral_row_divider');
		$('#updraftcentral-search-info').html('');
		sites_row.show();
		sites_border.show();
	}
	
	/**
	 ** Filtering the sites by description or title
	 ** @param {string} filter_text - the text to search in the site data
	 ** @returns {bool} If the search matches any sites
	 **/
	this.searching_sites = function(filter_text) {
		var filter_text_upper_case = filter_text.toUpperCase();
		var sites_row = $('.updraftcentral_site_row');
		var sites_border = $('.updraftcentral_row_divider');
		sites_row.hide();
		sites_border.hide();
		var exist = false;
		sites_row.each(function(index) {
			var site_description = $(this).find('.updraft_site_title span').html().toUpperCase();
			
			if (site_description.indexOf(filter_text_upper_case) != -1) {
				$(this).show();
				$(this).next('.updraftcentral_row_divider').show();
				exist = true;
			} else {
				var site_url = $(this).find('.updraftcentral_site_url_after_description').html().toUpperCase();
				if (site_url.indexOf(filter_text_upper_case) != -1) {
					$(this).show();
					$(this).next('.updraftcentral_row_divider').show();
					exist = true;
				}
			}
		});

		if (!exist) {
			$('#updraftcentral-search-info').html(udclion.site_search.no_sites_found);
		} else {
			$('#updraftcentral-search-info').html('');
		}
		
	}
	
	return this;
};
