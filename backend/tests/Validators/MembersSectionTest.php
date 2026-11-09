<?php

declare(strict_types=1);

namespace App\Tests\Validators;

use App\Validators\SectionValidator;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * De leden van het collectief: foto, naam, eventueel een specialisme en een
 * eigen site.
 *
 * Het webadres krijgt de meeste aandacht. Het is het enige vrij in te vullen
 * adres in de content, en het komt als link op de site: alles behalve een
 * gewoon http(s)-adres moet hier blijven hangen (CLAUDE.md §11).
 */
final class MembersSectionTest extends TestCase
{
    private SectionValidator $validator;

    protected function setUp(): void
    {
        $this->validator = new SectionValidator();
    }

    public function testAcceptsACompleteMember(): void
    {
        $result = $this->validator->validate(self::section([self::member()]), 0);

        self::assertTrue($result->isValid(), $result->asText());
    }

    public function testAcceptsAnEmptyListOfMembers(): void
    {
        $result = $this->validator->validate(self::section([]), 0);

        self::assertTrue($result->isValid(), $result->asText());
    }

    /** Geen eigen site en geen specialisme is gewoon toegestaan. */
    public function testAcceptsAMemberWithoutWebsiteOrSpecialty(): void
    {
        $member = self::member(['website' => '', 'specialty' => '']);

        self::assertTrue($this->validator->validate(self::section([$member]), 0)->isValid());
    }

    public function testRejectsAMemberWithoutName(): void
    {
        $result = $this->validator->validate(self::section([self::member(['name' => '  '])]), 0);

        self::assertFalse($result->isValid());
        self::assertStringContainsString('name', $result->asText());
    }

    public function testAcceptsHttpAndHttpsWebsites(): void
    {
        foreach (['https://voorbeeld.nl', 'http://voorbeeld.nl/werk?jaar=2026'] as $website) {
            $result = $this->validator->validate(self::section([self::member(['website' => $website])]), 0);

            self::assertTrue($result->isValid(), $website . ': ' . $result->asText());
        }
    }

    /** @return iterable<string, array{string}> */
    public static function unsafeOrIncompleteWebsites(): iterable
    {
        yield 'javascript-link' => ['javascript:alert(1)'];
        yield 'data-adres' => ['data:text/html,<script>alert(1)</script>'];
        yield 'zonder schema' => ['www.voorbeeld.nl'];
        yield 'ander schema' => ['ftp://voorbeeld.nl'];
        yield 'alleen tekst' => ['mijn website'];
    }

    #[DataProvider('unsafeOrIncompleteWebsites')]
    public function testRejectsWebsitesThatAreNotPlainWebAddresses(string $website): void
    {
        $result = $this->validator->validate(self::section([self::member(['website' => $website])]), 0);

        self::assertFalse($result->isValid());
        self::assertStringContainsString('webadres', $result->asText());
    }

    public function testRequiresAnAltTextOnceThereIsAPhoto(): void
    {
        $member = self::member(['image' => '/uploads/portret.webp', 'imageAlt' => '']);

        $result = $this->validator->validate(self::section([$member]), 0);

        self::assertFalse($result->isValid());
        self::assertStringContainsString('imageAlt', $result->asText());
    }

    public function testRejectsAPhotoOutsideTheUploadFolder(): void
    {
        $member = self::member(['image' => '/uploads/../.env', 'imageAlt' => 'Portret']);

        self::assertFalse($this->validator->validate(self::section([$member]), 0)->isValid());
    }

    public function testRejectsAnUnknownFieldOnAMember(): void
    {
        $member = self::member();
        $member['naam'] = 'Typefout';

        $result = $this->validator->validate(self::section([$member]), 0);

        self::assertFalse($result->isValid());
        self::assertStringContainsString('naam', $result->asText());
    }

    public function testAcceptsABioPhoneAndEmail(): void
    {
        $member = self::member([
            'bio' => 'Maakt meubels van massief eiken.',
            'phone' => '+31 (0)6 12 34 56 78',
            'email' => 'lid@voorbeeld.nl',
        ]);

        $result = $this->validator->validate(self::section([$member]), 0);

        self::assertTrue($result->isValid(), $result->asText());
    }

    /**
     * Omschrijving, telefoon en e-mail kwamen er later bij. Content die al op
     * de server stond zonder die velden, moet geldig blijven.
     */
    public function testAcceptsAMemberSavedBeforeBioPhoneAndEmailExisted(): void
    {
        $member = self::member();

        self::assertArrayNotHasKey('bio', $member);
        self::assertTrue($this->validator->validate(self::section([$member]), 0)->isValid());
    }

    public function testRejectsABioLongerThanTwoShortSentences(): void
    {
        $result = $this->validator->validate(self::section([self::member(['bio' => str_repeat('a', 161)])]), 0);

        self::assertFalse($result->isValid());
        self::assertStringContainsString('bio', $result->asText());
    }

    public function testRejectsABioThatIsNotText(): void
    {
        self::assertFalse($this->validator->validate(self::section([self::member(['bio' => 5])]), 0)->isValid());
    }

    public function testAcceptsCommonPhoneNotations(): void
    {
        foreach (['06-12345678', '030 123 4567', '+31 (0)30 123 45 67'] as $phone) {
            $result = $this->validator->validate(self::section([self::member(['phone' => $phone])]), 0);

            self::assertTrue($result->isValid(), $phone . ': ' . $result->asText());
        }
    }

    /** @return iterable<string, array{string}> */
    public static function invalidPhoneNumbers(): iterable
    {
        yield 'letters' => ['bel me even'];
        yield 'te kort' => ['12345'];
        yield 'te veel cijfers' => ['0612345678901234'];
        yield 'link' => ['tel:0612345678'];
    }

    #[DataProvider('invalidPhoneNumbers')]
    public function testRejectsInvalidPhoneNumbers(string $phone): void
    {
        $result = $this->validator->validate(self::section([self::member(['phone' => $phone])]), 0);

        self::assertFalse($result->isValid());
        self::assertStringContainsString('telefoonnummer', $result->asText());
    }

    public function testRejectsAnInvalidEmail(): void
    {
        foreach (['lid@', 'geen e-mail', 'mailto:lid@voorbeeld.nl'] as $email) {
            $result = $this->validator->validate(self::section([self::member(['email' => $email])]), 0);

            self::assertFalse($result->isValid(), $email);
            self::assertStringContainsString('e-mailadres', $result->asText());
        }
    }

    public function testRejectsMoreThanFortyMembers(): void
    {
        $members = array_fill(0, 41, self::member());

        self::assertFalse($this->validator->validate(self::section($members), 0)->isValid());
    }

    /**
     * @param array<string, mixed> $overrides
     *
     * @return array<string, mixed>
     */
    private static function member(array $overrides = []): array
    {
        return [
            'name' => 'Een lid',
            'specialty' => 'Kasten op maat',
            'website' => 'https://voorbeeld.nl',
            'image' => '/uploads/portret.webp',
            'imageAlt' => 'Portret van een lid in de werkplaats',
            ...$overrides,
        ];
    }

    /**
     * @param list<array<string, mixed>> $members
     *
     * @return array<string, mixed>
     */
    private static function section(array $members): array
    {
        return [
            'type' => 'members',
            'background' => 'tinted',
            'heading' => 'Onze leden',
            'intro' => '',
            'members' => $members,
        ];
    }
}
