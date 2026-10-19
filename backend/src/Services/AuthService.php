<?php

declare(strict_types=1);

namespace App\Services;

use App\Config\Config;
use App\Http\CsrfToken;
use App\Http\Session;
use App\Utils\Logger;

/**
 * Inloggen, uitloggen en de vraag of iemand ingelogd is (CLAUDE.md §11).
 *
 * Er is één beheerder (§1), dus de gegevens staan in .env en niet in een
 * gebruikerstabel. Alleen de hash van het wachtwoord staat daar; het
 * wachtwoord zelf komt nergens voor.
 */
final class AuthService
{
    public const RATE_LIMIT_BUCKET = 'login';

    private const SESSION_KEY = '_ingelogd_als';

    public function __construct(
        private readonly Config $config,
        private readonly Session $session,
        private readonly CsrfToken $csrfToken,
        private readonly RateLimiter $rateLimiter,
        private readonly Logger $logger,
    ) {
    }

    public function attempt(string $username, string $password, string $clientIp): LoginResult
    {
        if ($this->rateLimiter->isBlocked(self::RATE_LIMIT_BUCKET, $clientIp)) {
            return LoginResult::blocked();
        }

        $expectedUsername = $this->config->get('ADMIN_USERNAME');
        $expectedHash = $this->config->get('ADMIN_PASSWORD_HASH');

        if ($expectedUsername === '' || $expectedHash === '') {
            $this->logger->error(
                'Inloggen is niet mogelijk: ADMIN_USERNAME of ADMIN_PASSWORD_HASH ontbreekt in .env.',
            );

            return LoginResult::notConfigured();
        }

        /*
         * Beide controles draaien altijd, ook als de gebruikersnaam al niet
         * klopt. Zou het wachtwoord dan overgeslagen worden, dan is het
         * antwoord meetbaar sneller — en verraadt de duur van het verzoek dat
         * de gebruikersnaam fout was.
         */
        $usernameMatches = hash_equals($expectedUsername, $username);
        $passwordMatches = password_verify($password, $expectedHash);

        if (!$usernameMatches || !$passwordMatches) {
            $this->rateLimiter->registerFailure(self::RATE_LIMIT_BUCKET, $clientIp);

            // Wel loggen, want herhaalde mislukte pogingen zijn het signaal
            // dat iemand aan het proberen is. Zonder de ingevoerde gegevens:
            // die horen niet in een logbestand.
            $this->logger->error('Mislukte inlogpoging.');

            return LoginResult::failed(
                $this->rateLimiter->remainingAttempts(self::RATE_LIMIT_BUCKET, $clientIp),
            );
        }

        /*
         * Nieuw sessie-ID direct na de geslaagde login (§11). Zou het ID
         * hetzelfde blijven, dan kan iemand die de beheerder vooraf een bekend
         * ID heeft aangepraat, na diens login op dezelfde sessie meeliften.
         */
        $this->session->regenerate();
        $this->csrfToken->rotate();
        $this->session->set(self::SESSION_KEY, $expectedUsername);

        $this->rateLimiter->clear(self::RATE_LIMIT_BUCKET, $clientIp);

        return LoginResult::success();
    }

    public function logout(): void
    {
        $this->csrfToken->forget();
        $this->session->remove(self::SESSION_KEY);

        // Niet alleen de sleutel weghalen maar de hele sessie ongeldig maken,
        // server-side (§11).
        $this->session->destroy();
    }

    public function isLoggedIn(): bool
    {
        return $this->username() !== null;
    }

    public function username(): ?string
    {
        $value = $this->session->get(self::SESSION_KEY);

        return is_string($value) && $value !== '' ? $value : null;
    }
}
