<?php

declare(strict_types=1);

namespace App\Validators;

/**
 * De uitkomst van een validatie: geldig of niet, met alle gevonden fouten.
 *
 * Bewust geen exception bij de eerste fout. Wie een content-bestand
 * corrigeert wil in één keer zien wat er allemaal mis is, niet vijf keer
 * opnieuw opslaan om vijf fouten te vinden.
 */
final class ValidationResult
{
    /** @var list<string> */
    private array $errors = [];

    public function add(string $message): void
    {
        $this->errors[] = $message;
    }

    /** Neemt de fouten van een deelvalidatie over. */
    public function absorb(self $other): void
    {
        foreach ($other->errors as $error) {
            $this->errors[] = $error;
        }
    }

    public function isValid(): bool
    {
        return $this->errors === [];
    }

    /** @return list<string> */
    public function errors(): array
    {
        return $this->errors;
    }

    public function asText(): string
    {
        return implode(' ', $this->errors);
    }
}
