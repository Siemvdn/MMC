<?php

declare(strict_types=1);

namespace App\Http;

/**
 * Eigenschappen van de verbinding waarover het verzoek binnenkwam.
 *
 * Staat apart omdat zowel de beveiligingsheaders als de sessiecookie moeten
 * weten of de verbinding versleuteld is, en die vraag maar op één plek
 * beantwoord hoort te worden.
 */
final class Connection
{
    /**
     * Herkent ook de situatie waarin een proxy of loadbalancer de TLS
     * afhandelt en het verzoek onversleuteld doorgeeft — op gedeelde hosting
     * een gangbare opzet.
     *
     * Let op het verschil met Request::clientIp(): dáár is het juist gevaarlijk
     * om een X-Forwarded-header te geloven, omdat een aanvaller er zijn eigen
     * blokkade mee zou kunnen omzeilen. Hier is het risico omgekeerd en klein:
     * wie liegt dat de verbinding versleuteld is, benadeelt alleen zichzelf.
     */
    public static function isSecure(): bool
    {
        $https = $_SERVER['HTTPS'] ?? '';

        if (is_string($https) && $https !== '' && strtolower($https) !== 'off') {
            return true;
        }

        $forwarded = $_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '';

        return is_string($forwarded) && strtolower($forwarded) === 'https';
    }
}
