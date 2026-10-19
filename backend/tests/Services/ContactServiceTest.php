<?php

declare(strict_types=1);

namespace App\Tests\Services;

use App\Config\Config;
use App\Repositories\RateLimitRepository;
use App\Services\ContactService;
use App\Services\ContactStatus;
use App\Services\RateLimiter;
use App\Utils\Logger;
use App\Validators\ContactValidator;
use PHPUnit\Framework\TestCase;

/**
 * Het contactformulier stuurt een mail en bewaart niets (CLAUDE.md §10, §15).
 * Deze test controleert precies dat: geen mail bij ongeldige invoer, wel een
 * mail bij geldige invoer, en een grens aan het aantal pogingen per IP.
 */
final class ContactServiceTest extends TestCase
{
    private const IP = '198.51.100.7';

    private const VALID_BODY = [
        'name' => 'Jan Jansen',
        'email' => 'jan@example.com',
        'message' => 'Een testbericht via het contactformulier.',
    ];

    private string $directory;

    private FakeMailer $mailer;

    protected function tearDown(): void
    {
        // Ook verborgen bestanden meenemen: het .env-bestand hierbeneden mist
        // een gewone glob('/*'), en zonder opruiming blijft de tijdelijke map
        // achter en klapt rmdir().
        $paths = [...(glob($this->directory . '/*') ?: []), ...(glob($this->directory . '/.*') ?: [])];

        foreach ($paths as $path) {
            if (is_file($path)) {
                unlink($path);
            }
        }

        rmdir($this->directory);
    }

    public function testSendsAMailForAValidSubmission(): void
    {
        $service = $this->buildService();

        $result = $service->send(self::VALID_BODY, self::IP);

        self::assertTrue($result->isSuccess());
        self::assertCount(1, $this->mailer->sent);
        self::assertStringContainsString('Jan Jansen', $this->mailer->sent[0]['body']);
        self::assertStringContainsString('jan@example.com', $this->mailer->sent[0]['body']);
        self::assertStringContainsString('Een testbericht', $this->mailer->sent[0]['body']);
    }

    /** Beantwoorden moet bij de bezoeker uitkomen, niet bij het eigen afzendadres. */
    public function testRepliesGoToTheVisitorAndNotToTheSender(): void
    {
        $service = $this->buildService();

        $service->send(self::VALID_BODY, self::IP);

        self::assertSame('jan@example.com', $this->mailer->sent[0]['replyTo']);
        self::assertNotSame($this->mailer->sent[0]['from'], $this->mailer->sent[0]['replyTo']);
    }

    public function testSendsNoMailForAnInvalidSubmission(): void
    {
        $service = $this->buildService();

        $result = $service->send(['name' => '', 'email' => '', 'message' => ''], self::IP);

        self::assertSame(ContactStatus::ValidationError, $result->status);
        self::assertNotEmpty($result->errors);
        self::assertCount(0, $this->mailer->sent);
    }

    public function testBlocksAfterTooManyAttemptsFromOneAddress(): void
    {
        $service = $this->buildService();

        for ($i = 0; $i < RateLimiter::MAX_ATTEMPTS; $i++) {
            $service->send(self::VALID_BODY, self::IP);
        }

        $result = $service->send(self::VALID_BODY, self::IP);

        self::assertSame(ContactStatus::Blocked, $result->status);
        self::assertCount(RateLimiter::MAX_ATTEMPTS, $this->mailer->sent);
    }

    /**
     * Anders dan bij inloggen telt hier ook een geldige aanvraag mee — het
     * doel is spam beperken, niet raden tegenhouden (zie ContactService).
     */
    public function testAValidSubmissionStillCountsTowardsTheLimit(): void
    {
        $service = $this->buildService();

        $service->send(self::VALID_BODY, self::IP);
        $service->send(['name' => '', 'email' => '', 'message' => ''], self::IP);

        for ($i = 0; $i < RateLimiter::MAX_ATTEMPTS - 2; $i++) {
            $service->send(self::VALID_BODY, self::IP);
        }

        $result = $service->send(self::VALID_BODY, self::IP);

        self::assertSame(ContactStatus::Blocked, $result->status);
    }

    public function testReportsAFailedSendWithoutRevealingWhy(): void
    {
        $service = $this->buildService();
        $this->mailer->shouldSucceed = false;

        $result = $service->send(self::VALID_BODY, self::IP);

        self::assertSame(ContactStatus::MailFailed, $result->status);
    }

    public function testReportsAMisconfiguredMailAddressAsAFailedSend(): void
    {
        $service = $this->buildService(mailTo: '');

        $result = $service->send(self::VALID_BODY, self::IP);

        self::assertSame(ContactStatus::MailFailed, $result->status);
        self::assertCount(0, $this->mailer->sent);
    }

    private function buildService(string $mailTo = 'ontvanger@example.com'): ContactService
    {
        $this->directory = sys_get_temp_dir() . '/app-contact-' . bin2hex(random_bytes(6));

        if (!mkdir($this->directory, 0777, true) && !is_dir($this->directory)) {
            self::fail('De tijdelijke testmap kon niet aangemaakt worden.');
        }

        $envFile = $this->directory . '/.env';
        file_put_contents($envFile, sprintf("MAIL_TO=%s\nMAIL_FROM=noreply@example.com\n", $mailTo));

        $this->mailer = new FakeMailer();

        return new ContactService(
            Config::fromEnvFile($envFile),
            new ContactValidator(),
            new RateLimiter(new RateLimitRepository($this->directory), 'test-geheim'),
            $this->mailer,
            new Logger($this->directory . '/test.log'),
        );
    }
}
