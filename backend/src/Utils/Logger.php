<?php

declare(strict_types=1);

namespace App\Utils;

use Throwable;

/**
 * Schrijft fouten naar een logbestand.
 *
 * CLAUDE.md §8 en §11: een fout gaat naar het log, nooit naar de browser.
 * Wat de bezoeker ziet is een neutrale melding; wat hier terechtkomt is het
 * technische verhaal dat nodig is om het op te lossen.
 */
final class Logger
{
    private const DIRECTORY_PERMISSIONS = 0750;

    public function __construct(private readonly string $logFile)
    {
    }

    public function error(string $message, ?Throwable $throwable = null): void
    {
        $line = sprintf('[%s] ERROR %s', gmdate('Y-m-d\TH:i:s\Z'), $message);

        if ($throwable !== null) {
            $line .= sprintf(
                ' | %s: %s (%s:%d)',
                $throwable::class,
                $throwable->getMessage(),
                $throwable->getFile(),
                $throwable->getLine(),
            );
        }

        $this->write($line);
    }

    private function write(string $line): void
    {
        $directory = dirname($this->logFile);

        if (!is_dir($directory) && !mkdir($directory, self::DIRECTORY_PERMISSIONS, true)) {
            return;
        }

        /*
         * De @ is hier bewust: als het loggen zelf faalt (map niet
         * schrijfbaar op de gedeelde hosting), mag dat het verzoek niet
         * alsnog laten klappen. Zonder onderdrukking zou de foutafhandelaar
         * in de front controller deze waarschuwing tot een uitzondering
         * maken en zou de fout die we probeerden te loggen verdwijnen achter
         * een tweede fout.
         *
         * LOCK_EX voorkomt dat twee gelijktijdige verzoeken elkaars regel
         * doorsnijden.
         */
        @file_put_contents($this->logFile, $line . PHP_EOL, FILE_APPEND | LOCK_EX);
    }
}
