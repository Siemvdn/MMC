<?php

declare(strict_types=1);

namespace App\Config;

/**
 * Leest configuratie uit een .env-bestand.
 *
 * Secrets horen nooit in de broncode of in Git (CLAUDE.md §11, §20). Deze
 * class is de enige plek die het .env-bestand kent; de rest van de code
 * vraagt waarden op via een methode.
 */
final class Config
{
    /** @param array<string, string> $values */
    private function __construct(private readonly array $values)
    {
    }

    /**
     * Een ontbrekend .env-bestand is geen fout: op de server kan de
     * configuratie ook uit de omgeving van de webserver komen. De defaults
     * in de methodes hieronder wijzen daarom altijd de veilige kant op.
     */
    public static function fromEnvFile(string $path): self
    {
        if (!is_file($path) || !is_readable($path)) {
            return new self([]);
        }

        $contents = file_get_contents($path);

        return new self($contents === false ? [] : self::parse($contents));
    }

    /** @return array<string, string> */
    private static function parse(string $contents): array
    {
        $values = [];

        foreach (preg_split('/\R/', $contents) ?: [] as $line) {
            $line = trim($line);

            if ($line === '' || str_starts_with($line, '#')) {
                continue;
            }

            $parts = explode('=', $line, 2);

            if (count($parts) !== 2) {
                continue;
            }

            $values[trim($parts[0])] = self::stripQuotes(trim($parts[1]));
        }

        return $values;
    }

    /** Omringende aanhalingstekens horen bij de notatie, niet bij de waarde. */
    private static function stripQuotes(string $value): string
    {
        $length = strlen($value);

        if ($length < 2) {
            return $value;
        }

        $first = $value[0];

        if (($first === '"' || $first === "'") && $value[$length - 1] === $first) {
            return substr($value, 1, -1);
        }

        return $value;
    }

    public function get(string $key, string $default = ''): string
    {
        return $this->values[$key] ?? $default;
    }

    /**
     * Onbekende of ontbrekende waarde betekent productie. Dat is bewust de
     * strengste stand: een verkeerd gespeld APP_ENV mag nooit foutmeldingen
     * naar bezoekers laten lekken (CLAUDE.md §11).
     */
    public function environment(): Environment
    {
        return Environment::tryFrom($this->get('APP_ENV')) ?? Environment::Production;
    }
}
