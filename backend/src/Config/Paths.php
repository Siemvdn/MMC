<?php

declare(strict_types=1);

namespace App\Config;

/**
 * Alle paden op één plek.
 *
 * Zo staat nergens anders in de code een samengesteld pad naar storage/ of
 * uploads/, en verhuist de mapindeling in één keer als dat ooit moet.
 */
final class Paths
{
    /**
     * Beide scheidingstekens: op Windows levert dirname() backslashes op, op
     * de Linux-server van de hosting slashes. De rest van deze class stelt paden
     * met slashes samen, wat PHP op beide platformen accepteert.
     */
    private const DIRECTORY_TRIM_CHARACTERS = '/\\';

    private function __construct(
        public readonly string $root,
        public readonly string $content,
        public readonly string $uploads,
        public readonly string $logs,
        public readonly string $errorLog,
        public readonly string $sessions,
        public readonly string $rateLimit,
    ) {
    }

    /**
     * @param string $root Bevat src/ en storage/ als siblings (§18).
     * @param string $publicDir De map met index.php zelf — heet lokaal
     *        `public`, op de server `api` (§18, hernoemd bij deploy).
     *        Uploads staan hier fysiek onder, zodat zowel de PHP-ingebouwde
     *        server (die bestanden relatief aan `__DIR__` serveert) als
     *        Apache in productie (via de rewrite in de webroot-.htaccess)
     *        hetzelfde bestand vinden onder `/uploads/...`.
     */
    public static function fromProjectRoot(string $root, string $publicDir): self
    {
        $root = rtrim($root, self::DIRECTORY_TRIM_CHARACTERS);
        $publicDir = rtrim($publicDir, self::DIRECTORY_TRIM_CHARACTERS);
        $storage = $root . '/storage';
        $logs = $storage . '/logs';

        return new self(
            root: $root,
            content: $storage . '/content',
            uploads: $publicDir . '/uploads',
            logs: $logs,
            errorLog: $logs . '/error.log',
            // Sessiebestanden en inlogpogingen staan onder storage/, dat door
            // een .htaccess volledig afgeschermd is (§11).
            sessions: $storage . '/sessions',
            rateLimit: $storage . '/rate-limit',
        );
    }
}
