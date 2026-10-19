<?php

declare(strict_types=1);

namespace App\Services;

use App\Repositories\ContentFile;
use App\Repositories\ContentNotFound;
use App\Repositories\ContentRepository;
use App\Repositories\ContentUnavailable;

/**
 * Maakt paginacontent klaar voor de frontend.
 *
 * Deze laag weet niets van HTTP en niets van hoe content is opgeslagen. Ze
 * beantwoordt één vraag: wat heeft een pagina nodig om getoond te worden?
 */
final class ContentService
{
    /** Sectietypes waarvan een lege inhoud betekent: nog niet aangeleverd. */
    private const LIST_TYPE = 'list';

    public function __construct(private readonly ContentRepository $repository)
    {
    }

    /**
     * Levert de content van één pagina, inclusief de sitebrede gegevens.
     *
     * Die laatste zitten er bewust bij in plaats van achter een eigen
     * endpoint: elke pagina heeft ze nodig voor de footer, en één verzoek in
     * plaats van twee scheelt een netwerkronde vóór de eerste weergave
     * (CLAUDE.md §12, LCP). De endpointlijst uit §9 blijft daarmee precies
     * zoals hij daar staat.
     *
     * @return array<string, mixed>
     *
     * @throws ContentNotFound als het bestand ontbreekt
     * @throws ContentUnavailable als het bestand onleesbaar is
     */
    public function pageContent(ContentFile $page): array
    {
        $content = $this->withoutNotes($this->repository->read($page));

        $content['sections'] = $this->withoutUnfilledSections($content['sections'] ?? null);
        $content['site'] = $this->withoutNotes($this->repository->read(ContentFile::Site));

        return $content;
    }

    /**
     * Haalt elke sleutel weg die met een underscore begint, op elk niveau.
     *
     * Dat is niet alleen opruimen. In die aantekeningen staan interne
     * afwegingen, waaronder nog onbevestigde feiten over de klant die
     * CLAUDE.md §2 niet gepubliceerd wil hebben. Ze zouden zichtbaar zijn
     * voor iedereen die het netwerkverkeer bekijkt
     * (CLAUDE.md §9, minimale data-exposure).
     *
     * @param array<array-key, mixed> $data
     *
     * @return array<array-key, mixed>
     */
    private function withoutNotes(array $data): array
    {
        $clean = [];

        foreach ($data as $key => $value) {
            if (is_string($key) && str_starts_with($key, '_')) {
                continue;
            }

            $clean[$key] = is_array($value) ? $this->withoutNotes($value) : $value;
        }

        return $clean;
    }

    /**
     * Laat secties weg die nog geen inhoud hebben.
     *
     * Nu geldt dat alleen voor een `list` zonder items — een lijst die nog
     * wacht op inhoud van de klant. Zo'n sectie zou anders als kop zonder
     * inhoud op de pagina staan.
     *
     * Bewust smal gehouden: alleen dit ene, gedocumenteerde geval. Wie hier
     * een algemene "gooi lege dingen weg"-regel van maakt, krijgt secties die
     * onverwacht verdwijnen zodra de klant een veld leegmaakt.
     *
     * @return list<mixed>
     */
    private function withoutUnfilledSections(mixed $sections): array
    {
        if (!is_array($sections)) {
            return [];
        }

        $filled = array_filter(
            $sections,
            static function (mixed $section): bool {
                if (!is_array($section) || ($section['type'] ?? null) !== self::LIST_TYPE) {
                    return true;
                }

                return ($section['items'] ?? []) !== [];
            },
        );

        // Opnieuw doornummeren, anders wordt het in JSON een object in plaats
        // van een array zodra er een sectie tussenuit valt.
        return array_values($filled);
    }
}
