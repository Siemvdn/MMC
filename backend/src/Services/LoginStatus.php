<?php

declare(strict_types=1);

namespace App\Services;

/**
 * De mogelijke uitkomsten van een inlogpoging.
 *
 * Let op: `Failed` maakt geen onderscheid tussen een onbekende gebruikersnaam
 * en een fout wachtwoord. Dat is opzet (CLAUDE.md §11) — dat verschil
 * prijsgeven vertelt een aanvaller dat hij de helft al goed heeft.
 */
enum LoginStatus
{
    case Success;
    case Failed;
    case Blocked;

    /**
     * De inloggegevens ontbreken in .env. Dat is een installatiefout, geen
     * verkeerde invoer, en hoort dus wél apart herkend en gelogd te worden.
     */
    case NotConfigured;
}
