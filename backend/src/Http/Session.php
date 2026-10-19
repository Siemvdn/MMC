<?php

declare(strict_types=1);

namespace App\Http;

/**
 * De enige plek die een PHP-sessie start.
 *
 * Alles wat CLAUDE.md §11 over sessies eist, staat hier bij elkaar. Verspreid
 * over de code zou vroeg of laat één van deze instellingen ergens ontbreken,
 * en dat merk je niet aan het gedrag — alleen aan het feit dat het opeens te
 * misbruiken is.
 */
final class Session
{
    /**
     * Een eigen naam in plaats van PHPSESSID. Die standaardnaam verraadt aan
     * elke scanner dat hier PHP draait; dit scheelt geen aanval, maar wel een
     * gratis aanwijzing (§11, minimale data-exposure).
     */
    private const COOKIE_NAME = 'site_session';

    /** Verval na inactiviteit: dertig minuten (CLAUDE.md §11). */
    public const INACTIVITY_TIMEOUT_SECONDS = 1800;

    private const LAST_ACTIVITY_KEY = '_laatste_activiteit';

    private bool $started = false;

    public function __construct(private readonly string $savePath)
    {
    }

    /**
     * Start de sessie, of hervat hem. Is hij verlopen door inactiviteit, dan
     * wordt hij weggegooid en begint er een verse — de beheerder is dan dus
     * uitgelogd, wat precies de bedoeling is.
     */
    public function start(): void
    {
        if ($this->started || session_status() === PHP_SESSION_ACTIVE) {
            $this->started = true;

            return;
        }

        $this->configure();

        if (!session_start()) {
            return;
        }

        $this->started = true;

        if ($this->hasExpired($this->lastActivity(), time())) {
            $this->destroy();
            $this->configure();
            session_start();
            $this->started = true;
        }

        $this->touch();
    }

    /**
     * Vernieuwt het sessie-ID met behoud van de inhoud.
     *
     * Hoort direct na een geslaagde login (§11). Zou het ID hetzelfde blijven,
     * dan kan iemand die een bezoeker vooraf een bekend ID heeft aangepraat,
     * na diens login meeliften op dezelfde sessie.
     */
    public function regenerate(): void
    {
        if ($this->started) {
            session_regenerate_id(true);
        }
    }

    public function get(string $key): mixed
    {
        return $_SESSION[$key] ?? null;
    }

    public function set(string $key, mixed $value): void
    {
        $_SESSION[$key] = $value;
    }

    public function remove(string $key): void
    {
        unset($_SESSION[$key]);
    }

    /**
     * Ruimt de sessie server-side op én laat de browser het cookie weggooien.
     *
     * Alleen $_SESSION leegmaken is niet genoeg: het sessiebestand blijft dan
     * bestaan en het cookie blijft geldig (§11 vraagt om expliciet server-side
     * ongeldig maken bij uitloggen).
     */
    public function destroy(): void
    {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            return;
        }

        $_SESSION = [];

        if (ini_get('session.use_cookies') && !headers_sent()) {
            // 'expires' in het verleden is het signaal aan de browser om het
            // cookie weg te gooien.
            setcookie(self::COOKIE_NAME, '', ['expires' => time() - 42000] + $this->cookieOptions());
        }

        session_destroy();
        $this->started = false;
    }

    /**
     * Pure controle, los van PHP's sessiefuncties, zodat hij te testen is
     * zonder webserver.
     */
    public function hasExpired(?int $lastActivity, int $now): bool
    {
        if ($lastActivity === null) {
            return false;
        }

        return $now - $lastActivity > self::INACTIVITY_TIMEOUT_SECONDS;
    }

    /**
     * De eigenschappen die het sessiecookie altijd heeft, apart zodat ze te
     * controleren zijn.
     *
     * De vervaltijd staat hier bewust niet bij. PHP kent er namelijk twee
     * namen voor: session_set_cookie_params() wil 'lifetime' (een aantal
     * seconden) en setcookie() wil 'expires' (een tijdstip). Ze in één lijst
     * proppen levert een sessie op die niet start.
     *
     * @return array<string, mixed>
     */
    public function cookieOptions(): array
    {
        return [
            'path' => '/',
            // Niet leesbaar voor JavaScript, dus onbruikbaar voor een
            // XSS-aanval die het cookie zou willen doorsturen.
            'httponly' => true,
            // Alleen over een versleutelde verbinding. Lokaal draait er geen
            // HTTPS, dus daar zou dit het inloggen onmogelijk maken.
            'secure' => Connection::isSecure(),
            // Het cookie gaat niet mee bij een verzoek dat van een andere site
            // vertrekt. Dat blokkeert de meeste CSRF-aanvallen al, nog vóór de
            // tokencontrole eraan te pas komt.
            'samesite' => 'Strict',
        ];
    }

    private function configure(): void
    {
        // Sessiebestanden in een eigen map buiten de webroot, in plaats van in
        // de tijdelijke map die op gedeelde hosting met anderen gedeeld wordt.
        if (!is_dir($this->savePath)) {
            mkdir($this->savePath, 0700, true);
        }

        if (is_dir($this->savePath)) {
            session_save_path($this->savePath);
        }

        // Accepteer nooit een sessie-ID dat de server niet zelf heeft
        // uitgegeven. Zonder dit maakt PHP een sessie aan met het ID dat de
        // bezoeker aanlevert, en dat is precies wat session fixation nodig
        // heeft. Deze instelling staat standaard uit.
        ini_set('session.use_strict_mode', '1');
        ini_set('session.use_only_cookies', '1');

        session_name(self::COOKIE_NAME);
        // 'lifetime' => 0 betekent: het cookie verdwijnt als de browser sluit.
        // Het echte verval regelen we zelf op inactiviteit, want een browser
        // die weken openstaat zou anders ingelogd blijven.
        session_set_cookie_params(['lifetime' => 0] + $this->cookieOptions());
    }

    private function lastActivity(): ?int
    {
        $value = $_SESSION[self::LAST_ACTIVITY_KEY] ?? null;

        return is_int($value) ? $value : null;
    }

    private function touch(): void
    {
        $_SESSION[self::LAST_ACTIVITY_KEY] = time();
    }
}
