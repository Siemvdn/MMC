<?php

declare(strict_types=1);

namespace App\Config;

/**
 * De omgeving waarin de applicatie draait.
 *
 * Een enum in plaats van losse stringconstanten (CLAUDE.md §8): een typefout
 * als 'produktie' wordt hiermee een fout bij het opstarten in plaats van een
 * site die stilletjes in debugmodus live staat.
 */
enum Environment: string
{
    case Production = 'production';
    case Development = 'development';
}
