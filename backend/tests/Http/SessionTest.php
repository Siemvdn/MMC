<?php

declare(strict_types=1);

namespace App\Tests\Http;

use App\Http\Session;
use PHPUnit\Framework\TestCase;

/**
 * Getest wordt wat te testen valt zonder webserver: de vervalregel en de
 * cookie-instellingen. Het daadwerkelijk starten van een sessie hangt aan
 * headers die in een testproces niet te versturen zijn; dat komt in fase 2 aan
 * bod via het login-endpoint.
 */
final class SessionTest extends TestCase
{
    private const NOW = 1_700_000_000;

    private Session $session;

    protected function setUp(): void
    {
        $this->session = new Session(sys_get_temp_dir() . '/app-sessies');
        unset($_SERVER['HTTPS'], $_SERVER['HTTP_X_FORWARDED_PROTO']);
    }

    protected function tearDown(): void
    {
        unset($_SERVER['HTTPS'], $_SERVER['HTTP_X_FORWARDED_PROTO']);
    }

    public function testAFreshSessionHasNotExpired(): void
    {
        self::assertFalse($this->session->hasExpired(null, self::NOW));
    }

    public function testRecentActivityKeepsTheSessionAlive(): void
    {
        $eenMinuutGeleden = self::NOW - 60;

        self::assertFalse($this->session->hasExpired($eenMinuutGeleden, self::NOW));
    }

    public function testExactlyAtTheLimitIsStillValid(): void
    {
        $precies = self::NOW - Session::INACTIVITY_TIMEOUT_SECONDS;

        self::assertFalse($this->session->hasExpired($precies, self::NOW));
    }

    public function testOneSecondPastTheLimitExpires(): void
    {
        $netTeLaat = self::NOW - Session::INACTIVITY_TIMEOUT_SECONDS - 1;

        self::assertTrue($this->session->hasExpired($netTeLaat, self::NOW));
    }

    /** CLAUDE.md §11 noemt deze drie met zoveel woorden. */
    public function testCookieIsNotReadableByScriptsAndDoesNotTravelCrossSite(): void
    {
        $options = $this->session->cookieOptions();

        self::assertTrue($options['httponly']);
        self::assertSame('Strict', $options['samesite']);
        self::assertSame('/', $options['path']);
    }

    /**
     * Zonder versleutelde verbinding mag `secure` niet aanstaan: lokaal draait
     * er geen HTTPS, en dan zou het cookie nooit verstuurd worden en inloggen
     * onmogelijk zijn.
     */
    public function testSecureFlagFollowsTheConnection(): void
    {
        self::assertFalse($this->session->cookieOptions()['secure']);

        $_SERVER['HTTPS'] = 'on';
        self::assertTrue($this->session->cookieOptions()['secure']);

        unset($_SERVER['HTTPS']);
        $_SERVER['HTTP_X_FORWARDED_PROTO'] = 'https';
        self::assertTrue($this->session->cookieOptions()['secure']);
    }
}
