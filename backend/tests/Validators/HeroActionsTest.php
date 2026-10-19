<?php

declare(strict_types=1);

namespace App\Tests\Validators;

use App\Validators\FieldValidator;
use App\Validators\SectionValidator;
use PHPUnit\Framework\TestCase;

/**
 * De knoppen onder een paginakop.
 *
 * Deze knoppen sturen de bezoeker naar de contact- of de over-ons-pagina, en
 * zijn daarmee de enige plek in de content die een link bevat. Een knop met
 * een bestemming die niet bestaat is een doodlopende weg op de belangrijkste
 * plek van de site.
 */
final class HeroActionsTest extends TestCase
{
    private SectionValidator $validator;

    protected function setUp(): void
    {
        $this->validator = new SectionValidator();
    }

    public function testAcceptsNoButtonsAtAll(): void
    {
        $result = $this->validator->validate(self::heroWith([]), 0);

        self::assertTrue($result->isValid(), $result->asText());
    }

    public function testAcceptsTwoButtonsToOtherPages(): void
    {
        $result = $this->validator->validate(self::heroWith([
            ['label' => 'Neem contact op', 'target' => 'contact'],
            ['label' => 'Meer over ons', 'target' => 'over-ons'],
        ]), 0);

        self::assertTrue($result->isValid(), $result->asText());
    }

    /** Meer dan twee maakt geen van beide meer de duidelijke vervolgstap. */
    public function testRejectsMoreThanTwoButtons(): void
    {
        $result = $this->validator->validate(self::heroWith([
            ['label' => 'Een', 'target' => 'contact'],
            ['label' => 'Twee', 'target' => 'over-ons'],
            ['label' => 'Drie', 'target' => 'home'],
        ]), 0);

        self::assertFalse($result->isValid());
    }

    public function testRejectsAnUnknownDestination(): void
    {
        $result = $this->validator->validate(self::heroWith([
            ['label' => 'Ergens heen', 'target' => 'https://elders.example'],
        ]), 0);

        self::assertFalse($result->isValid());
        self::assertStringContainsString('target', $result->asText());
    }

    /** Een knop zonder opschrift is een lege pil waar niemand op klikt. */
    public function testRejectsAnEmptyLabel(): void
    {
        $result = $this->validator->validate(self::heroWith([
            ['label' => '   ', 'target' => 'contact'],
        ]), 0);

        self::assertFalse($result->isValid());
    }

    public function testRejectsSomethingThatIsNotAList(): void
    {
        $result = $this->validator->validate(self::heroWith('Vraag een datum aan'), 0);

        self::assertFalse($result->isValid());
    }

    /**
     * Het beheerscherm vult zijn keuzemenu met deze lijst. Wijkt hij af van
     * wat de validator accepteert, dan biedt het menu een bestemming aan die
     * bij het opslaan geweigerd wordt.
     */
    public function testEveryOfferedDestinationIsAccepted(): void
    {
        $targets = FieldValidator::choices()['target'];

        self::assertSame(['home', 'over-ons', 'contact'], $targets);

        foreach ($targets as $target) {
            $result = $this->validator->validate(self::heroWith([
                ['label' => 'Ga verder', 'target' => $target],
            ]), 0);

            self::assertTrue($result->isValid(), $result->asText());
        }
    }

    /** @return array<string, mixed> */
    private static function heroWith(mixed $actions): array
    {
        return [
            'type' => 'hero',
            'background' => 'light',
            'kicker' => 'Bovenkop',
            'heading' => 'Een kop',
            'text' => '',
            'image' => null,
            'imageAlt' => '',
            'layout' => 'beside',
            'textColor' => 'dark',
            'actions' => $actions,
        ];
    }
}
