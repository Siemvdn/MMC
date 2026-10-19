<?php

declare(strict_types=1);

use App\Autoloader;

/**
 * Startpunt voor PHPUnit.
 *
 * Registreert twee autoloaders: één voor de applicatie en één voor de tests
 * zelf. Zonder de tweede zou `App\Tests\...` in src/Tests/ gezocht
 * worden, want daar wijst de eerste prefix naartoe.
 */

$root = dirname(__DIR__);

require $root . '/src/Autoloader.php';

(new Autoloader('App\\', $root . '/src'))->register();
(new Autoloader('App\\Tests\\', $root . '/tests'))->register();
