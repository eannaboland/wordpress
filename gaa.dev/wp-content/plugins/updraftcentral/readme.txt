=== UpdraftCentral Dashboard ===
Contributors: DavidAnderson, DNutbourne, aporter, snightingale
Tags: remote control, management dashboard, multiple site management, remote management, remote dashboard, updates
Requires at least: 4.0
Tested up to: 4.8
Stable tag: 0.6.2
Author: DavidAnderson
Donate link: https://david.dw-perspective.org.uk/donate
License: MIT
License URI: https://opensource.org/licenses/MIT

Remote, single-dashboard management for WordPress/theme/plugin updates and UpdraftPlus backups across all your WP sites

== Description ==

The UpdraftCentral multiple site management dashboard gives you centralized and powerful remote control for all your WordPress sites. Remotely manage UpdraftPlus backups, restoration and migration on all your sites. Update themes, plugins and core simply from one location.

<strong>UpdraftCentral allows you to manage multiple websites from a single place.</strong>

As well as centralized and remote control of all your Updraftplus backups, restorations and migrations, you can also control and update the themes, plugins and cores of every website you manage, or access them with one click.

<strong>This plugin is the central dashboard plugin for installing on the site you want your dashboard (the "mothership"). On the sites you want to control, you instead install UpdraftPlus.</strong>

UpdraftCentral is the latest release from the makers of UpdraftPlus, WordPress'#1 most installed and trusted backup plugin (active on over a million WordPress sites). Please note, as a brand new plugin we're keen to get your feedback. If you discover a problem, please let us know rather than slamming us with a bad review. You can find support <a href="https://wordpress.org/support/plugin/updraftcentral">here</a> and make feature suggestions <a href="https://updraftplus.com/make-a-suggestion/">here</a>.

Quick links: <a href="https://updraftplus.com/faqs/how-do-i-install-updraftcentral/"> how to install </a> | <a href="https://updraftplus.com/updraftcentral-how-to-add-a-site/">how to add a site</a> | <a href="https://updraftplus.com/updraftcentral-frequently-asked-questions/">FAQs</a>

[vimeo https://vimeo.com/173470901]

= Features =

Built with the latest, state-of-the-art technology, UpdraftCentral is crammed full of features that ensure that you enjoy the best possible user experience:

- Management of all your UpdraftPlus backups from a single place (backup, see/edit settings, see/download/delete backups, initiate restore)
- Log in to the WP dashboard of any connected site with one click
- See available updates and update WordPress core, plugins and themes of any connected site.
- Mass updates: see all updates from all sites, and carry them out according to sophisticated filters, from a single screen
- As a single-page/dynamic JavaScript application, it won't annoyingly refresh the page on every action. And because it runs in the front end and on full-screen mode, you won't have the wp-dashboard getting in your way.
- It sends all communications directly from the browser, rather than through a back-end server, making it much faster and more efficient than traditional management applications.
- For maximum security, all communications between sites are RSA encrypted and signed, and every connection has a unique key-pair.
- It can be run by localhost, so as an extra security precaution, you can have the dashboard website (i.e. the one that controls all the others) off the public internet.
- It's mobile-ready and responsive, built to run on any device from day one.
- It's also extensible and developer friendly: it uses WordPress hooks widely, and all it's JavaScript is documented with JSDoc.

== Installation ==

From our <a href="https://www.youtube.com/user/UpdraftPlus/videos">YouTube channel</a>, here's how to install:

https://youtu.be/oNpJEaSlQbI

And here's how to add a new site:

https://www.youtube.com/watch?v=B1ivZKk6D8w

= Requirements =

The website being controlled must have all of these:

- WordPress 3.2 (July 2011) or later. There are no further version PHP/MySQL requirements.
- UpdraftPlus version 1.12.2 (free version) / 2.12.2 (paid versions) or later installed and active (but, for full functionality and fewest bugs, you should have the latest release)
- No active security modules (whether a WordPress plugin, or webserver component) that block traffic based on unusual patterns - encrypted traffic from a remote control plugin is likely to be blocked, as it looks very different to regular website visits from a web browser. We have tested with the most popular WordPress plugins, and these are all not a problem in all the configurations we have tested.

The website that is running the dashboard (i.e. this plugin, UpdraftCentral) must have:

- WordPress 4.0 (Sep 2014) or later
- PHP 5.3 or later

The web browser that you visit the UpdraftCentral dashboard must not have not been end-of-lifed by its maker. Specifically, Internet Explorer 9 (or earlier) is not supported. UpdraftCentral is built using modern JavaScript technologies.

= Acknowledgements =

We recognise and thank all those whose code and/or libraries are used and/or modified under the terms of their open source licences in UpdraftCentral, at: https://updraftplus.com/acknowledgements/

== Changelog ==

= 0.6.2 - 20/Jun/2017 =

* TWEAK: When sending updates requests, only send necessary parameters
* TWEAK: When a consumer attempts to send non-serializable data over the network, the console logging now also includes the data path

= 0.6.1 - 15/Jun/2017 =

* FEATURE: Allow site order to be set (Just drag and drop the sites into the order you want)
* FIX: Adding to queue (not working) when updates failed to pull information from wordpress.org
* FIX: Fix issue whereby cancelling a filesystem credentials dialog left the UI locked until reload
* FIX: Handle apparently-but-not-really available updates (e.g. Affiliates-WP when not licensed)
* FIX: The "select all" button for mass updates
* TWEAK: With mass updates, do not abort the whole queue when one fails
* TWEAK: When a consumer attempts to send non-serializable data over the network, log more in the console
* TWEAK: Prevent Tether message in JS console, via including it
* TWEAK: More feedback in UI on backup progress
* TWEAK: Prevent JS console error messages regarding to the Sanitizer
* TWEAK: Not opening new window or tab when clicking links on mass updates panel
* TWEAK: Adjust timeout on updates request
* TWEAK: Marked as compatible with WordPress 4.8
* TWEAK: Add website description to error dialog
* TWEAK: Stop the TwentySeventeen theme from hiding site's menus
* TWEAK: Removed legacy CSS vendor prefixes

= 0.6.0 - 02/May/2017 =

* FEATURE: Mass updates (show and update from all sites on a single panel)
* TWEAK: Prevent a function being defined twice
* TWEAK: Remove index on 'url' field when creating sites table, to prevent errors on some bespoke MySQL setups
* TWEAK: Update handling of UpdraftPlus WebDAV settings to parse new format
* TWEAK: Show an icon for directly reaching the WP dashboard on every panel, not just the 'Sites' one
* TWEAK: Use jQuery properties, not attributes, where appropriate
* TWEAK: Added a version check when saving settings to prevent errors or lost settings
* FIX: Only use hash_equals() on PHP versions where it is available
* FIX: Fixed JavaScript reference error when running a connection method test

= 0.5.2 - 03/Mar/2017 =

* FEATURE: Quick site filter/search facility
* FEATURE: Added the ability to select which tables you want to backup when using the 'Backup now' modal
* FIX: Fixed the ability for non-admin users to be permitted access to an UpdraftCentral dashboard. Please see this FAQ for setup details if you want to use this facility: https://updraftplus.com/faqs/can-allow-non-admin-users-updraftcentral-dashboard/
* TWEAK: UpdraftPlus 'Test' buttons are now instance-aware
* TWEAK: A re-factoring of the updates module to enable future features
* TWEAK: Update forge library to 0.7 series, now fetched at build-time instead of hard-wired/bundled
* TWEAK: Add progress bar support when running updates
* TWEAK: Site-wide updates now uses the D3 queue library

= 0.5.1 - 26/Jan/2017 =

* FIX: Characters that were UTF-16 but not UTF-8 were being mangled in transmission
* FEATURE: Add the capability to list, download and delete files stored in UpdraftVault
* TWEAK: Removed the triple click and replaced it with standard double click
* TWEAK: JavaScript libraries now fetched and minimised during build process by Gulp
* TWEAK: Enabled wipe settings and export / import settings for the advanced tools

= 0.5.0 - 23/Dec/2016 =

* FEATURE: Advanced tools - manage the same tools and get detailed site information (as in UpdraftPlus's "advanced tools" tab). Requires UpdraftPlus 1.12.30 or later on the controlled site.
* FEATURE: Manage comments on both ordinary installs and multisite installs (Premium - https://updraftplus.com/shop/updraftcentral-premium/). Requires UpdraftPlus 1.12.30 or later on the controlled site.
* TWEAK: Add dashboard notice infrastructure and extend existing notices API
* TWEAK: Improve the styling in a few places
* TWEAK: Slightly improve the pagination class.
* TWEAK: Improve the UI's buttons in various places
* TWEAK: Displays a progress bar during a backup

= 0.4.4 - 10/Nov/2016 =

* FIX: You can now install your dashboard on a WP multisite install
* TWEAK: Update bundled UDRPC library to 1.4.11
* TWEAK: Changed menu to be vertical, and hence now more responsive/future-proof
* TWEAK: Added the D3 queue library for future use
* TWEAK: Plugin build now controlled by Gulp
* TWEAK: Add module giving information about SaaS and Premium versions

= 0.4.3 - 19/Oct/2016 =

* FIX: Add a missing file from the phpseclib install to WordPress SVN

= 0.4.2 - 13/Oct/2016 =

* FIX: Extra databases configured for backup in UpdraftPlus were not showing in UpdraftCentral
* FIX: Various fixes for handling data returned by controlled sites running older (back to 3.2) WP versions
* FIX: The "Backup Now" menu entry did not work on initial dashboard load (but did after switching tabs)
* TWEAK: Display a warning if the user attempts to enter an invalid WebDAV hostname in UpdraftPlus backup settings
* TWEAK: Correct the plugin text domain
* TWEAK: Updated phpseclib, Guzzle and Bootstrap versions

= 0.4.1 - 16/Aug/2016 =

* TWEAK: Fix a few minor layout regressions in 0.4.0
* FIX: Fix a JavaScript error in 0.4.0 when checking updates on sites with none

= 0.4.0 - 04/Aug/2016 =

* FEATURE: Management of updates (for plugins, themes and WordPress core)
* FEATURE: The UpdraftPlus module now includes the Rackspace setup wizard (when the add-on exists on the controlled site)
* COMPATIBILITY: Marked as compatible with WP 4.6
* FIX: Modals were not showing when in fullscreen mode (regression in 0.3.6)
* FIX: Restore the ability to communicate with WP versions older than 3.5 in certain modes (regression in 0.3.8)
* TWEAK: Route communications via admin-ajax.php in the back-end, instead of index.php, to avoid issues from security plugins that intercept on index.php.
* TWEAK: Store the last time that a user loaded their dashboard as usermeta
* TWEAK: Update bundled UDRPC library to 1.4.8
* TWEAK: Integrate new WebDAV configuration mode from UpdraftPlus
* TWEAK: Re-worked template loader, to make it possible/straightforward for external modules to use Handlebars
* TWEAK: Straighten out some incorrect use of error codes
* TWEAK: Update bundled Labelauty version to our patched (added accessibility) version
* TWEAK: All JavaScript and JSDoc now linted
* DOCUMENTATION: Finished adding JSDoc documentation to the UpdraftPlus control module

= 0.3.10 - 15/Jun/2016 =

* FIX: Fix a JavaScript error when attempting to run the connection test since 0.3.8

= 0.3.9 - 07/Jun/2016 =

* PERFORMANCE: Small change to the JS API, such that listeners are now only registered when a tab is active, thus signifiantly reducing the number active
* INTERNALS: The core JS library now has methods for browser-local storing and cacheing
* TWEAK: The network timeout parameter was not being correctly passed through in all situations

= 0.3.8 - 03/Jun/2016 =

* TWEAK: Communications are now posted to a back-end URL, instead of front-end, because some plugins will only initiate relevant code (e.g. update checkers) on the back-end. Theoretically, some sites may need to remove and re-create their key, and/or adjust their advanced settings, if they are deploying different security measures (e.g. different HTTP password) to access the back-end.
* TWEAK: In the connection test dialog, if there is an HTTP error code, then display more info about it
* TWEAK: Strip out extraneous PHP debug output sent by remote sites that broke communications in more situations
* TWEAK: Audit/update all use of wp_remote_ functions to reflect API changes in the upcoming WP 4.6. Amongst other things, this is required for UpdraftVault to work with WP 4.6+ (release expected August 2016).
* TWEAK: When the remote site does not support a particular command, then report this more gracefully
* TWEAK: Move to lazy-loading command on the client side as needed for a particular action
* TWEAK: Update bundled UDRPC library to 1.4.7

= 0.3.6 - 25/Apr/2016 =

* TWEAK: Prevent PHP notice on some connection scenarios
* TWEAK: Move the modal out of the DOM hierarchy, so that it's not covered in themes which set z-indexes

= 0.3.5 - 31/Mar/2016 =

* FIX: A few small fixes/tweaks to various layout/browser issues

= 0.3.4 - 31/Mar/2016 =

* RELEASE: Initial release
* FEATURE: Control backups (backup, restore, download backups, change settings) for any controlled site
* FEATURE: Log in to any controlled site's WordPress dashboard with one click

== Installation ==

You should install using the standard WordPress procedure:

1. Search for 'UpdraftCentral' via the 'Plugins' dashboard page in WordPress.
2. Click the 'Install' button. (Make sure you pick the right one)
3. Activate the plugin through the 'Plugins' menu in WordPress

Then, you must create a front-end page for your site, to contain the dashboard. i.e. Go to the "Pages" screen in your WordPress dashboard, and follow the link for "Add New". You are recommended to use a template that allows UpdraftCentral as much width as possible - but, note that UpdraftCentral has a "full screen" mode; so, even if your theme is narrow, it's not a problem.

Upon this front-end page, place this shortcode: [updraft_central] . This will allow logged-in site administrators, who visit that page, to use UpdraftCentral. If you want users with roles to also be able to use UpdraftCentral (note that every user has their own list of sites - giving users access to UpdraftCentral does not give them access to your sites, only to their own list of sites), then please see this FAQ for information on how it is done: https://updraftplus.com/faqs/can-allow-non-admin-users-updraftcentral-dashboard/

Then, to start using UpdraftCentral, simply visit the page, and <a href="https://updraftplus.com/updraftcentral-how-to-add-a-site/">you can begin adding sites, using this guide</a>.

== Frequently Asked Questions ==

For all our FAQs, and all other support documentation, please go here: https://updraftplus.com/updraftcentral-frequently-asked-questions/

== Screenshots ==

1. Managing controlled sites

2. Managing existing backups on a controlled site

3. Managing backup settings on a controlled site

4. Starting a backup on a controlled site

== Upgrade Notice ==
* 0.6.2 : Tweaks to make updates requests more robust/debuggable
