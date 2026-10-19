<?php

declare(strict_types=1);

namespace App;

/**
 * Minimale PSR-4 autoloader.
 *
 * Composer is niet gegarandeerd beschikbaar op shared hosting
 * (CLAUDE.md §3), en een vendor/-map meesturen via SFTP is fragiel: vergeet
 * je hem één keer, dan is de site stuk. Deze loader heeft geen vendor/ nodig
 * en doet precies één ding — een klassenaam onder één namespace-prefix
 * omzetten naar een bestandspad.
 *
 * Composer blijft wél in beeld voor ontwikkelgereedschap (PHPUnit, stap 9);
 * dat draait alleen lokaal en hoeft nooit naar de server.
 */
final class Autoloader
{
    /** Scheidingsteken tussen namespace-onderdelen in een klassenaam. */
    private const NAMESPACE_SEPARATOR = '\\';

    public function __construct(
        private readonly string $namespacePrefix,
        private readonly string $baseDirectory,
    ) {
    }

    public function register(): void
    {
        spl_autoload_register($this->loadClass(...));
    }

    /**
     * De klassenaam komt van de PHP-engine zelf, nooit rechtstreeks uit een
     * request. Padmanipulatie via gebruikersinvoer is hier dus niet mogelijk.
     */
    private function loadClass(string $className): void
    {
        if (!str_starts_with($className, $this->namespacePrefix)) {
            return;
        }

        $relativeClass = substr($className, strlen($this->namespacePrefix));
        $file = $this->baseDirectory
            . DIRECTORY_SEPARATOR
            . str_replace(self::NAMESPACE_SEPARATOR, DIRECTORY_SEPARATOR, $relativeClass)
            . '.php';

        if (is_file($file)) {
            require $file;
        }
    }
}
