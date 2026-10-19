<?php

declare(strict_types=1);

namespace App\Validators;

/**
 * Dezelfde regels als `ContactForm.tsx` in de frontend, maar hier bindend
 * (CLAUDE.md §7, §11): client-side validatie is voor het gemak van de
 * bezoeker, nooit de enige beveiliging.
 *
 * Alleen naam, e-mailadres en bericht: wat er minimaal nodig is om op een
 * aanvraag te kunnen reageren (dataminimalisatie, §15). Komt er later een
 * veld bij, dan hier, in de frontend en in de tests tegelijk.
 */
final class ContactValidator
{
    /**
     * Zelfde patroon als de frontend. Bewust ruim: preciezer vaststellen wat
     * een geldig e-mailadres is, lukt met een patroon toch niet — dit vangt
     * vergissingen af, en sluit terloops ook elke vorm van whitespace uit
     * (dus ook een regeleinde, dat in een e-mailheader zou kunnen belanden).
     */
    private const EMAIL_PATTERN = '/^[^\s@]+@[^\s@]+\.[^\s@]+$/';

    /**
     * Bovengrenzen per veld, in tekens. Zonder grens kan één verzoek een
     * onbeperkt lange e-mail opleveren.
     *
     * @var array<string, int>
     */
    private const MAX_LENGTHS = [
        'name' => 200,
        'email' => 200,
        'message' => 2000,
    ];

    private const DEFAULT_MAX_LENGTH = 200;

    /** @param array<array-key, mixed> $body */
    public function validate(array $body): ValidationResult
    {
        $result = new ValidationResult();

        $this->requireText($body, 'name', 'Vul uw naam in.', $result);
        $this->requireEmail($body, $result);
        $this->requireText($body, 'message', 'Vul uw bericht in.', $result);

        return $result;
    }

    /** @param array<array-key, mixed> $body */
    private function requireText(
        array $body,
        string $field,
        string $missingMessage,
        ValidationResult $result,
    ): void {
        $value = $body[$field] ?? null;

        if (!is_string($value) || trim($value) === '') {
            $result->add($missingMessage);

            return;
        }

        $this->checkLength($value, $field, $result);
    }

    /** @param array<array-key, mixed> $body */
    private function requireEmail(array $body, ValidationResult $result): void
    {
        $value = $body['email'] ?? null;

        if (!is_string($value) || trim($value) === '') {
            $result->add('Vul uw e-mailadres in.');

            return;
        }

        if (preg_match(self::EMAIL_PATTERN, trim($value)) !== 1) {
            $result->add('Dit lijkt geen geldig e-mailadres.');

            return;
        }

        $this->checkLength($value, 'email', $result);
    }

    private function checkLength(string $value, string $field, ValidationResult $result): void
    {
        $maximum = self::MAX_LENGTHS[$field] ?? self::DEFAULT_MAX_LENGTH;
        $length = mb_strlen($value);

        if ($length > $maximum) {
            $result->add(sprintf(
                'Veld %s is te lang (%d tekens, maximaal %d).',
                $field,
                $length,
                $maximum,
            ));
        }
    }
}
