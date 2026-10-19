<?php

declare(strict_types=1);

namespace App\Tests\Validators;

use App\Validators\ContactValidator;
use PHPUnit\Framework\TestCase;

/**
 * Dezelfde regels als de frontend, maar hier bindend (CLAUDE.md §7, §11): dit
 * is de enige plek die een bezoeker echt tegenhoudt.
 */
final class ContactValidatorTest extends TestCase
{
    private ContactValidator $validator;

    protected function setUp(): void
    {
        $this->validator = new ContactValidator();
    }

    private const VALID_BODY = [
        'name' => 'Jan Jansen',
        'email' => 'jan@example.com',
        'message' => 'Een testbericht via het contactformulier.',
    ];

    public function testAcceptsAFullyFilledSubmission(): void
    {
        $result = $this->validator->validate(self::VALID_BODY);

        self::assertTrue($result->isValid());
    }

    public function testRejectsAnEmptyName(): void
    {
        $body = self::VALID_BODY;
        $body['name'] = '  ';

        $result = $this->validator->validate($body);

        self::assertFalse($result->isValid());
        self::assertContains('Vul uw naam in.', $result->errors());
    }

    public function testRejectsAMissingEmail(): void
    {
        $body = self::VALID_BODY;
        unset($body['email']);

        $result = $this->validator->validate($body);

        self::assertContains('Vul uw e-mailadres in.', $result->errors());
    }

    public function testRejectsAnEmailWithoutAnAtSign(): void
    {
        $body = self::VALID_BODY;
        $body['email'] = 'jan.jansen.nl';

        $result = $this->validator->validate($body);

        self::assertContains('Dit lijkt geen geldig e-mailadres.', $result->errors());
    }

    /**
     * Whitespace in een e-mailadres — inclusief een regeleinde — valt al af
     * op het patroon. Dat is precies wat voorkomt dat dit veld ooit een
     * e-mailheader kan injecteren.
     */
    public function testRejectsAnEmailContainingANewline(): void
    {
        $body = self::VALID_BODY;
        $body['email'] = "jan@example.com\r\nBcc: kwaadwillende@example.com";

        $result = $this->validator->validate($body);

        self::assertFalse($result->isValid());
    }

    public function testRejectsAnEmptyMessage(): void
    {
        $body = self::VALID_BODY;
        $body['message'] = '';

        $result = $this->validator->validate($body);

        self::assertContains('Vul uw bericht in.', $result->errors());
    }

    public function testRejectsAMessageThatIsTooLong(): void
    {
        $body = self::VALID_BODY;
        $body['message'] = str_repeat('a', 2001);

        $result = $this->validator->validate($body);

        self::assertFalse($result->isValid());
    }

    public function testRejectsANameThatIsTooLong(): void
    {
        $body = self::VALID_BODY;
        $body['name'] = str_repeat('a', 201);

        $result = $this->validator->validate($body);

        self::assertFalse($result->isValid());
    }

    public function testReportsEveryProblemAtOnce(): void
    {
        $result = $this->validator->validate([]);

        self::assertCount(3, $result->errors());
    }
}
