<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Validators\ValidationResult;
use RuntimeException;

/**
 * De aangeboden content voldoet niet aan de verwachte structuur en is
 * daarom niet weggeschreven.
 *
 * Draagt het volledige validatieresultaat mee, zodat de beheerder in één
 * keer alle fouten te zien krijgt in plaats van er één per opslagpoging.
 */
final class InvalidContent extends RuntimeException
{
    public function __construct(private readonly ValidationResult $result)
    {
        parent::__construct('De content voldoet niet aan de verwachte structuur.');
    }

    public function result(): ValidationResult
    {
        return $this->result;
    }

    /** @return list<string> */
    public function errors(): array
    {
        return $this->result->errors();
    }
}
