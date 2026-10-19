<?php

declare(strict_types=1);

namespace App\Services;

final class ContactResult
{
    /** @param list<string> $errors */
    private function __construct(
        public readonly ContactStatus $status,
        public readonly array $errors = [],
    ) {
    }

    public static function success(): self
    {
        return new self(ContactStatus::Success);
    }

    /** @param list<string> $errors */
    public static function invalid(array $errors): self
    {
        return new self(ContactStatus::ValidationError, $errors);
    }

    public static function blocked(): self
    {
        return new self(ContactStatus::Blocked);
    }

    public static function mailFailed(): self
    {
        return new self(ContactStatus::MailFailed);
    }

    public function isSuccess(): bool
    {
        return $this->status === ContactStatus::Success;
    }
}
