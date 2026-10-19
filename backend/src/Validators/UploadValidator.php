<?php

declare(strict_types=1);

namespace App\Validators;

use App\Http\UploadedFile;

/**
 * Beoordeelt of een geüpload bestand een afbeelding is die we willen bewaren
 * (CLAUDE.md §11).
 *
 * De kern van de aanpak: **niets geloven wat de aanvrager meestuurt.** De
 * bestandsnaam, de extensie en het opgegeven MIME-type komen alle drie van de
 * browser en zijn vrij in te vullen. Een aanvaller die een PHP-bestand
 * "foto.jpg" noemt en er `image/jpeg` bij zet, komt daar niets mee verder.
 *
 * Wat we wél geloven is wat er in het bestand zelf staat: getimagesize() leest
 * de eerste bytes en herkent daaraan het formaat. Staat daar geen afbeelding,
 * dan geeft die functie false — hoe het bestand ook heet.
 */
final class UploadValidator
{
    /**
     * De formaten die we accepteren, met de extensie die we eraan geven.
     *
     * De extensie komt hier vandaan en niet uit de aangeleverde bestandsnaam.
     * Dat is het verschil tussen "het heet .jpg" en "het ís een JPEG".
     *
     * @var array<int, string>
     */
    private const ALLOWED_TYPES = [
        IMAGETYPE_JPEG => 'jpg',
        IMAGETYPE_PNG => 'png',
        IMAGETYPE_WEBP => 'webp',
    ];

    /**
     * Twintig megabyte — een vangnet, geen werkgrens.
     *
     * Normaal komt hier nooit iets van die omvang binnen: het beheerscherm
     * verkleint een foto in de browser vóór het uploaden
     * (`frontend/src/utils/prepareImage.ts`), waardoor er een bestand van een
     * paar honderd kilobyte overblijft. Deze grens vangt het geval af waarin
     * dat niet lukt — een formaat dat de browser niet kan uitpakken — zodat de
     * klant ook dan zijn foto kwijt kan.
     *
     * Waarom er überhaupt een grens is: de server kan zelf niets verkleinen
     * (geen GD, geen Imagick), dus alles wat hier binnenkomt gaat ongewijzigd
     * naar elke bezoeker. Zonder bovengrens zou één upload de laadtijd van de
     * site om zeep helpen (§12, Core Web Vitals).
     *
     * Blijft onder de grens die PHP zelf hanteert, zodat een te groot bestand
     * een nette melding oplevert in plaats van een afgebroken verzoek.
     */
    public const MAX_BYTES = 20_971_520;

    /**
     * Een afbeelding groter dan dit is geen websitefoto meer. De grens dient
     * ook een tweede doel: een klein bestand kan enorme afmetingen opgeven, en
     * zoiets legt elk programma plat dat het later probeert te verwerken.
     */
    private const MAX_DIMENSION = 6000;

    public function validate(?UploadedFile $file): ValidationResult
    {
        $result = new ValidationResult();

        if ($file === null) {
            $result->add('Er is geen bestand meegestuurd.');

            return $result;
        }

        if ($file->hasUploadError()) {
            $result->add($this->describeUploadError($file->errorCode));

            return $result;
        }

        if ($file->size <= 0) {
            $result->add('Het bestand is leeg.');

            return $result;
        }

        if ($file->size > self::MAX_BYTES) {
            $result->add(sprintf(
                'Het bestand is te groot (%s). Maximaal %s.',
                $this->formatBytes($file->size),
                $this->formatBytes(self::MAX_BYTES),
            ));

            return $result;
        }

        $this->checkContents($file, $result);

        return $result;
    }

    /**
     * De extensie die bij het bestand hoort, afgeleid uit de inhoud.
     *
     * Geeft null als het bestand geen toegestane afbeelding is. Roep dit pas
     * aan nadat validate() akkoord gaf.
     */
    public function extensionFor(UploadedFile $file): ?string
    {
        $type = $this->detectType($file);

        return $type === null ? null : self::ALLOWED_TYPES[$type];
    }

    private function checkContents(UploadedFile $file, ValidationResult $result): void
    {
        if (!is_file($file->temporaryPath) || !is_readable($file->temporaryPath)) {
            $result->add('Het bestand kon niet gelezen worden.');

            return;
        }

        /*
         * @ is hier op zijn plaats: getimagesize() waarschuwt luid als het
         * bestand geen afbeelding is, en dat is precies het geval dat we
         * verwachten af te vangen. De uitkomst controleren we zelf.
         */
        $information = @getimagesize($file->temporaryPath);

        if ($information === false) {
            $result->add('Dit is geen afbeelding. Kies een JPG-, PNG- of WEBP-bestand.');

            return;
        }

        $type = $information[2] ?? null;

        if (!is_int($type) || !array_key_exists($type, self::ALLOWED_TYPES)) {
            $result->add('Dit soort afbeelding wordt niet ondersteund. Kies JPG, PNG of WEBP.');

            return;
        }

        $width = $information[0] ?? 0;
        $height = $information[1] ?? 0;

        if (!is_int($width) || !is_int($height) || $width < 1 || $height < 1) {
            $result->add('De afmetingen van de afbeelding kloppen niet.');

            return;
        }

        if ($width > self::MAX_DIMENSION || $height > self::MAX_DIMENSION) {
            $result->add(sprintf(
                'De afbeelding is te groot: %d bij %d pixels, maximaal %d.',
                $width,
                $height,
                self::MAX_DIMENSION,
            ));
        }
    }

    private function detectType(UploadedFile $file): ?int
    {
        if (!is_file($file->temporaryPath)) {
            return null;
        }

        $information = @getimagesize($file->temporaryPath);

        if ($information === false) {
            return null;
        }

        $type = $information[2] ?? null;

        return is_int($type) && array_key_exists($type, self::ALLOWED_TYPES) ? $type : null;
    }

    /**
     * PHP's foutcodes vertaald naar iets waar de beheerder wat aan heeft.
     *
     * De technische oorzaken (geen tijdelijke map, niet kunnen schrijven) zijn
     * serverproblemen waar de gebruiker niets aan kan doen; die krijgen één
     * neutrale tekst.
     */
    private function describeUploadError(int $code): string
    {
        return match ($code) {
            UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => sprintf(
                'Het bestand is te groot. Maximaal %s.',
                $this->formatBytes(self::MAX_BYTES),
            ),
            UPLOAD_ERR_PARTIAL => 'Het uploaden is halverwege afgebroken. Probeer het opnieuw.',
            UPLOAD_ERR_NO_FILE => 'Er is geen bestand gekozen.',
            default => 'Het uploaden is niet gelukt. Probeer het opnieuw.',
        };
    }

    private function formatBytes(int $bytes): string
    {
        return sprintf('%.1f MB', $bytes / 1_048_576);
    }
}
