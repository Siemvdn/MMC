<?php

declare(strict_types=1);

namespace App\Http;

/**
 * Het CSRF-token voor het admin-gedeelte (CLAUDE.md §11).
 *
 * Het token zit in de sessie en moet bij elk verzoek dat iets wijzigt worden
 * meegestuurd in de header `X-CSRF-Token`. Een andere site kan die header niet
 * zetten bij een verzoek namens de bezoeker, en kan het token ook niet
 * uitlezen — dus lukt zo'n verzoek niet.
 *
 * Dit komt bovenop `SameSite=Strict` op het sessiecookie. Die instelling
 * blokkeert de meeste aanvallen al, maar leunt op gedrag van de browser;
 * dit token leunt nergens op.
 */
final class CsrfToken
{
    private const SESSION_KEY = '_csrf_token';

    private const BYTES = 32;

    public function __construct(private readonly Session $session)
    {
    }

    /**
     * Geeft het token van deze sessie, en maakt er één als hij nog niet
     * bestaat.
     */
    public function issue(): string
    {
        $existing = $this->session->get(self::SESSION_KEY);

        if (is_string($existing) && $existing !== '') {
            return $existing;
        }

        $token = bin2hex(random_bytes(self::BYTES));
        $this->session->set(self::SESSION_KEY, $token);

        return $token;
    }

    /**
     * Vergelijkt met `hash_equals`, dat altijd even lang doet over de
     * vergelijking. Een gewone vergelijking stopt bij het eerste verschillende
     * teken, en uit dat tijdsverschil is een token teken voor teken te raden.
     */
    public function matches(?string $candidate): bool
    {
        $expected = $this->session->get(self::SESSION_KEY);

        if (!is_string($expected) || $expected === '' || !is_string($candidate)) {
            return false;
        }

        return hash_equals($expected, $candidate);
    }

    /**
     * Geeft een nieuw token uit en gooit het oude weg.
     *
     * Hoort bij een geslaagde login, samen met het vernieuwen van het
     * sessie-ID. session_regenerate_id() neemt de sessie-inhoud namelijk mee,
     * dus zonder deze stap blijft het token van vóór het inloggen geldig — en
     * wie dat te pakken had gekregen, houdt het.
     */
    public function rotate(): string
    {
        $this->forget();

        return $this->issue();
    }

    /** Bij uitloggen hoort het token te verdwijnen met de sessie. */
    public function forget(): void
    {
        $this->session->remove(self::SESSION_KEY);
    }
}
