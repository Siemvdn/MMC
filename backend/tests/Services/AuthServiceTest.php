<?php

declare(strict_types=1);

namespace App\Tests\Services;

use App\Config\Config;
use App\Http\CsrfToken;
use App\Http\Session;
use App\Repositories\RateLimitRepository;
use App\Services\AuthService;
use App\Services\LoginStatus;
use App\Services\RateLimiter;
use App\Utils\Logger;
use PHPUnit\Framework\TestCase;

/**
 * De inlogcontrole. Dit is de enige poort naar het admin-gedeelte, dus elke
 * regel uit CLAUDE.md §11 die hierover gaat, hoort hier afgedekt te zijn.
 *
 * De Session-class leest en schrijft $_SESSION. In een testproces kan die
 * array gewoon gevuld worden zonder dat er een echte sessie start; wat er niet
 * getest wordt is het versturen van het cookie, want daar zijn headers voor
 * nodig.
 */
final class AuthServiceTest extends TestCase
{
    private const USERNAME = 'beheerder';
    private const PASSWORD = 'een-lang-testwachtwoord';
    private const IP = '198.51.100.7';

    private string $directory;

    private AuthService $auth;

    protected function setUp(): void
    {
        $this->directory = sys_get_temp_dir() . '/app-auth-' . bin2hex(random_bytes(6));

        if (!mkdir($this->directory, 0777, true) && !is_dir($this->directory)) {
            self::fail('De tijdelijke testmap kon niet aangemaakt worden.');
        }

        $_SESSION = [];

        $this->auth = $this->buildAuthService(
            self::USERNAME,
            password_hash(self::PASSWORD, PASSWORD_DEFAULT),
        );
    }

    protected function tearDown(): void
    {
        foreach (glob($this->directory . '/*') ?: [] as $path) {
            if (is_file($path)) {
                unlink($path);
            }
        }

        $_SESSION = [];
    }

    public function testAcceptsTheRightCredentials(): void
    {
        $result = $this->auth->attempt(self::USERNAME, self::PASSWORD, self::IP);

        self::assertTrue($result->isSuccess());
        self::assertTrue($this->auth->isLoggedIn());
        self::assertSame(self::USERNAME, $this->auth->username());
    }

    public function testRejectsAWrongPassword(): void
    {
        $result = $this->auth->attempt(self::USERNAME, 'fout', self::IP);

        self::assertSame(LoginStatus::Failed, $result->status);
        self::assertFalse($this->auth->isLoggedIn());
    }

    /**
     * Een onbekende gebruikersnaam en een fout wachtwoord leveren exact
     * dezelfde uitkomst op. Verschil daartussen zou een aanvaller vertellen
     * dat hij de gebruikersnaam al goed heeft (§11).
     */
    public function testAnUnknownUsernameIsIndistinguishableFromAWrongPassword(): void
    {
        $onbekend = $this->auth->attempt('iemandanders', self::PASSWORD, self::IP);
        $foutWachtwoord = $this->auth->attempt(self::USERNAME, 'fout', self::IP);

        self::assertSame($foutWachtwoord->status, $onbekend->status);
    }

    public function testBlocksAfterFiveFailures(): void
    {
        for ($i = 0; $i < RateLimiter::MAX_ATTEMPTS; $i++) {
            $this->auth->attempt(self::USERNAME, 'fout', self::IP);
        }

        $result = $this->auth->attempt(self::USERNAME, 'fout', self::IP);

        self::assertSame(LoginStatus::Blocked, $result->status);
    }

    /** Ook met het juiste wachtwoord: de blokkade geldt voor het adres. */
    public function testABlockedAddressCannotLogInWithTheRightPassword(): void
    {
        for ($i = 0; $i < RateLimiter::MAX_ATTEMPTS; $i++) {
            $this->auth->attempt(self::USERNAME, 'fout', self::IP);
        }

        $result = $this->auth->attempt(self::USERNAME, self::PASSWORD, self::IP);

        self::assertSame(LoginStatus::Blocked, $result->status);
        self::assertFalse($this->auth->isLoggedIn());
    }

    public function testASuccessfulLoginClearsTheCounter(): void
    {
        $this->auth->attempt(self::USERNAME, 'fout', self::IP);
        $this->auth->attempt(self::USERNAME, 'fout', self::IP);
        $this->auth->attempt(self::USERNAME, self::PASSWORD, self::IP);

        $result = $this->auth->attempt(self::USERNAME, 'fout', self::IP);

        self::assertSame(RateLimiter::MAX_ATTEMPTS - 1, $result->remainingAttempts);
    }

    /**
     * Het token van vóór het inloggen mag daarna niet meer geldig zijn.
     * session_regenerate_id() neemt de sessie-inhoud namelijk mee.
     */
    public function testTheCsrfTokenChangesOnLogin(): void
    {
        $csrfToken = new CsrfToken(new Session($this->directory));
        $auth = $this->buildAuthService(
            self::USERNAME,
            password_hash(self::PASSWORD, PASSWORD_DEFAULT),
            $csrfToken,
        );

        $voor = $csrfToken->issue();
        $auth->attempt(self::USERNAME, self::PASSWORD, self::IP);
        $na = $csrfToken->issue();

        self::assertNotSame($voor, $na);
    }

    public function testLoggingOutEndsTheSession(): void
    {
        $this->auth->attempt(self::USERNAME, self::PASSWORD, self::IP);
        self::assertTrue($this->auth->isLoggedIn());

        $this->auth->logout();

        self::assertFalse($this->auth->isLoggedIn());
        self::assertNull($this->auth->username());
    }

    /** Ontbrekende inloggegevens zijn een installatiefout, geen invoerfout. */
    public function testMissingCredentialsAreRecognisedSeparately(): void
    {
        $auth = $this->buildAuthService('', '');

        $result = $auth->attempt(self::USERNAME, self::PASSWORD, self::IP);

        self::assertSame(LoginStatus::NotConfigured, $result->status);
    }

    private function buildAuthService(
        string $username,
        string $hash,
        ?CsrfToken $csrfToken = null,
    ): AuthService {
        $envFile = $this->directory . '/.env-' . bin2hex(random_bytes(4));
        file_put_contents(
            $envFile,
            sprintf("ADMIN_USERNAME=%s\nADMIN_PASSWORD_HASH=%s\n", $username, $hash),
        );

        $session = new Session($this->directory);

        return new AuthService(
            Config::fromEnvFile($envFile),
            $session,
            $csrfToken ?? new CsrfToken($session),
            new RateLimiter(new RateLimitRepository($this->directory), 'test-geheim'),
            new Logger($this->directory . '/test.log'),
        );
    }
}
