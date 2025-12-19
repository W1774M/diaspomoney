<?php
/**
 * The base configuration for WordPress
 *
 * The wp-config.php creation script uses this file during the installation.
 * You don't have to use the website, you can copy this file to "wp-config.php"
 * and fill in the values.
 *
 * This file contains the following configurations:
 *
 * * Database settings
 * * Secret keys
 * * Database table prefix
 * * ABSPATH
 *
 * @link https://developer.wordpress.org/advanced-administration/wordpress/wp-config/
 *
 * @package WordPress
 */

// ** Database settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define( 'DB_NAME', 'dbs13886311' );

/** Database username */
define( 'DB_USER', 'dbu2325022' );

/** Database password */
define( 'DB_PASSWORD', 'cce1722e-711a-41b5-bb0a-50088d0422be' );

/** Database hostname */
define( 'DB_HOST', 'db5017313309.hosting-data.io' );

/** Database charset to use in creating database tables. */
define( 'DB_CHARSET', 'utf8' );

/** The database collate type. Don't change this if in doubt. */
define( 'DB_COLLATE', '' );

/**#@+
 * Authentication unique keys and salts.
 *
 * Change these to different unique phrases! You can generate these using
 * the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}.
 *
 * You can change these at any point in time to invalidate all existing cookies.
 * This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define('AUTH_KEY',         'OiQfAzDBvCdE1NhQPSTEml642Nwg21fWwIc3vnveP7DxxKwo9lNNccpVWgDSM4sk');
define('SECURE_AUTH_KEY',  'eF6Z5TKIfzUr9TRCXWKWMmHnFhMuyR5CoBHHE26z2fq9q6HHYjxBeKQFc8J2EVcG');
define('LOGGED_IN_KEY',    'lGzqLVgHZiBRiFXJ4AbX7ccclSAKjuz8GBpxE2SmJdzhSSYT4kdDUBS9W1rbSzNm');
define('NONCE_KEY',        'FnfRAoB7soZi0SyJogsfiTzuDt0LWRJdppL7rrqWyOq7puA6kWcdV2JHoZ4WWnfY');
define('AUTH_SALT',        '23W4FeGYl1hE2Rz4mAS7d9n3isGmyszMTKScnYepESNPjaKX3vmFrkZdJcqidzA8');
define('SECURE_AUTH_SALT', 'NuXklH5La5MgDhEAtsryPzhYjOlQQ5J13aOkLwhBeYhS0cxBerT5bwOQPbmWnbv7');
define('LOGGED_IN_SALT',   'A8znKOcTB8JnVZ6tq6V7LF1Vx6LVT5BROB7zqOhGxCEXZpQd6uWdRtzM10bI3XIL');
define('NONCE_SALT',       'IED49norFLfxc6jJvAsAFgVnXMSIo1h3nqCfOjbKj9bG89QxEx6Dm4cohYzXzwJP');

/**
 * Other customizations.
 */
define('WP_TEMP_DIR',dirname(__FILE__).'/wp-content/uploads');


/**#@-*/

/**
 * WordPress database table prefix.
 *
 * You can have multiple installations in one database if you give each
 * a unique prefix. Only numbers, letters, and underscores please!
 *
 * At the installation time, database tables are created with the specified prefix.
 * Changing this value after WordPress is installed will make your site think
 * it has not been installed.
 *
 * @link https://developer.wordpress.org/advanced-administration/wordpress/wp-config/#table-prefix
 */
$table_prefix = 'm5il_';

/**
 * For developers: WordPress debugging mode.
 *
 * Change this to true to enable the display of notices during development.
 * It is strongly recommended that plugin and theme developers use WP_DEBUG
 * in their development environments.
 *
 * For information on other constants that can be used for debugging,
 * visit the documentation.
 *
 * @link https://developer.wordpress.org/advanced-administration/debug/debug-wordpress/
 */
define( 'WP_DEBUG', false );

/* Add any custom values between this line and the "stop editing" line. */



/* That's all, stop editing! Happy publishing. */

/** Absolute path to the WordPress directory. */
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

/** Sets up WordPress vars and included files. */
require_once ABSPATH . 'wp-settings.php';

// Ajoutez dans wp-config.php
define('DM_GOOGLE_CLIENT_ID', 'votre-client-id-google');
define('DM_GOOGLE_CLIENT_SECRET', 'votre-client-secret-google');

// Ajoutez dans wp-config.php
define('DM_LINKEDIN_CLIENT_ID', 'votre-client-id-linkedin');
define('DM_LINKEDIN_CLIENT_SECRET', 'votre-client-secret-linkedin');