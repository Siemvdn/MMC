<?php

declare(strict_types=1);

/**
 * Maakt de wachtwoord-hash voor ADMIN_PASSWORD_HASH in .env.
 *
 * Gebruik:
 *
 *     php tools/hash-password.php
 *
 * Het wachtwoord wordt gevraagd en nergens opgeslagen — niet in een bestand,
 * niet in de shell-geschiedenis. Daarom wordt het níet als argument
 * meegegeven: commando's met argumenten belanden wél in de geschiedenis, en
 * op een gedeelde server zijn ze bovendien in de processenlijst te zien
 * (CLAUDE.md §11).
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(404);

    exit;
}

const MINIMUM_LENGTH = 12;

/**
 * Leest een regel zonder hem op het scherm te tonen, waar dat kan.
 *
 * Op Linux en macOS zet `stty -echo` de weergave uit. Op Windows bestaat dat
 * niet; daar is het wachtwoord tijdens het typen zichtbaar, en dat wordt
 * gemeld in plaats van stilzwijgend geaccepteerd.
 */
function readSecret(string $prompt): string
{
    $isWindows = DIRECTORY_SEPARATOR !== '/';

    echo $prompt;

    if (!$isWindows) {
        shell_exec('stty -echo');
    }

    $value = fgets(STDIN);

    if (!$isWindows) {
        shell_exec('stty echo');
        echo PHP_EOL;
    }

    return $value === false ? '' : trim($value);
}

if (DIRECTORY_SEPARATOR !== '/') {
    echo 'Let op: op Windows is het wachtwoord tijdens het typen zichtbaar.', PHP_EOL, PHP_EOL;
}

$password = readSecret('Wachtwoord: ');
$again = readSecret('Nogmaals:   ');

if ($password === '') {
    fwrite(STDERR, 'Geen wachtwoord ingevoerd.' . PHP_EOL);

    exit(1);
}

if ($password !== $again) {
    fwrite(STDERR, 'De twee invoeren komen niet overeen.' . PHP_EOL);

    exit(1);
}

if (mb_strlen($password) < MINIMUM_LENGTH) {
    fwrite(STDERR, sprintf(
        'Te kort: minimaal %d tekens. Een lange zin is makkelijker te onthouden'
            . ' en sterker dan een korte reeks tekens.' . PHP_EOL,
        MINIMUM_LENGTH,
    ));

    exit(1);
}

/*
 * PASSWORD_DEFAULT laat PHP het algoritme kiezen; dat is op 8.3 bcrypt en
 * schuift mee als er ooit iets beters standaard wordt. Zelf een algoritme
 * vastleggen zou betekenen dat we die keuze over vijf jaar opnieuw moeten
 * maken — en waarschijnlijk vergeten (§11).
 */
$hash = password_hash($password, PASSWORD_DEFAULT);

echo PHP_EOL;
echo 'Zet deze regel in backend/.env:', PHP_EOL, PHP_EOL;
echo 'ADMIN_PASSWORD_HASH=', $hash, PHP_EOL, PHP_EOL;
echo 'Het wachtwoord zelf komt nergens te staan. Raak je het kwijt, draai dan', PHP_EOL;
echo 'dit script opnieuw en vervang de regel.', PHP_EOL;
