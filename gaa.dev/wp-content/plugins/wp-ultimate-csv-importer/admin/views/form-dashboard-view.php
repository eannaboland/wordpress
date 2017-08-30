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
?>
<div class="list-inline pull-right mb10 wp_ultimate_csv_importer_pro">
            <div class="col-md-6 mt10"><a href="https://goo.gl/jdPMW8" target="_blank"><?php echo esc_html__('Documentation','wp-ultimate-csv-importer');?></a></div>
            <div class="col-md-6 mt10"><a href="https://goo.gl/fKvDxH" target="_blank"><?php echo esc_html__('Sample CSV','wp-ultimate-csv-importer');?></a></div>
         </div>
<div class="box-one">
    <div class="top-right-box">
        <h3><span style="margin: -5px 5px 5px 5px;"><img src="<?php echo esc_url(SM_UCI_PRO_URL . '/assets/images/chart_bar.png');?>" /></span><?php echo __('Importers Activity','wp-ultimate-csv-importer'); ?></h3>
        <div class="top-right-content">
            <div id='dispLabel'></div>
            <canvas id="uci-line-chart"></canvas>
        </div>
    </div>
    <div class="top-right-box">
        <h3><span style="margin: -5px 5px 5px 5px;"><img src="<?php echo esc_url(SM_UCI_PRO_URL . '/assets/images/stat_icon.png');?>"></span><?php echo __('Import Statistics','wp-ultimate-csv-importer'); ?></h3>
        <div class="top-left-content">
            <div id='dispLabel'></div>
            <div id="canvas-holder" style="width:100%;">
                <canvas id="uci-bar-stacked-chart"></canvas>
            </div>
        </div>
    </div>

    <div style="width:75%;">

    </div>
    <script type="text/javascript">

    </script>
</div>
