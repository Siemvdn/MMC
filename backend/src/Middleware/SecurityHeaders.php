<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Http\Connection;

/**
 * Zet de beveiligingsheaders op elk API-antwoord (CLAUDE.md §11).
 *
 * Dit staat bewust in PHP en niet alleen in .htaccess. Of `mod_headers` op
 * het hostingpakket aanstaat weten we niet, en headers die stilletjes
 * ontbreken merk je pas als iemand ernaar zoekt. Zo staan ze er hoe dan ook.
 */
final class SecurityHeaders
{
    /**
     * Een JSON-antwoord hoort helemaal niets te laden — geen scripts, geen
     * afbeeldingen, geen stylesheets. `default-src 'none'` zegt precies dat.
     * Zou een aanvaller er ooit in slagen HTML in een antwoord te krijgen,
     * dan voert de browser daar nog steeds niets van uit.
     */
    private const CONTENT_SECURITY_POLICY = "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'";

    /**
     * Eén jaar, zonder `includeSubDomains` en zonder `preload`.
     *
     * `includeSubDomains` zou ook subdomeinen dwingen tot HTTPS; staat daar
     * iets op dat dat niet heeft, dan is het onbereikbaar. `preload` is
     * bovendien nauwelijks terug te draaien. Beide kunnen er later bij als
     * duidelijk is dat het domein volledig op HTTPS draait.
     */
    private const STRICT_TRANSPORT_SECURITY = 'max-age=31536000';

    public function apply(): void
    {
        if (headers_sent()) {
            return;
        }

        // Geen MIME-sniffing: de browser moet het Content-Type geloven dat wij
        // sturen, en niet zelf gaan raden dat JSON eigenlijk HTML is.
        header('X-Content-Type-Options: nosniff');

        // Deze API hoort nooit in een frame te staan. X-Frame-Options is de
        // oude vorm; frame-ancestors in de CSP hierboven is de nieuwe. Beide,
        // want oudere browsers kennen alleen de eerste.
        header('X-Frame-Options: DENY');

        // Stuurt bij een klik naar buiten alleen het domein mee, niet het
        // volledige pad — en over onversleutelde verbindingen helemaal niets.
        header('Referrer-Policy: strict-origin-when-cross-origin');

        header('Content-Security-Policy: ' . self::CONTENT_SECURITY_POLICY);

        // Alleen over HTTPS. Browsers negeren deze header over HTTP toch, en
        // hem pas sturen als de verbinding versleuteld is voorkomt dat we een
        // bezoeker vastzetten op een domein waar HTTPS nog niet werkt.
        if (Connection::isSecure()) {
            header('Strict-Transport-Security: ' . self::STRICT_TRANSPORT_SECURITY);
        }
    }
}
