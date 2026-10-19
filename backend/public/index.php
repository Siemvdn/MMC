<?php

declare(strict_types=1);

use App\Autoloader;
use App\Config\Config;
use App\Config\Environment;
use App\Config\Paths;
use App\Controllers\AdminContentController;
use App\Controllers\AuthController;
use App\Controllers\ContactController;
use App\Controllers\UploadController;
use App\Controllers\ContentController;
use App\Http\ErrorCode;
use App\Http\JsonResponse;
use App\Http\Request;
use App\Http\CsrfToken;
use App\Http\Router;
use App\Http\Session;
use App\Http\SignedCsrfToken;
use App\Middleware\AdminPipeline;
use App\Middleware\RequireAdmin;
use App\Middleware\SecurityHeaders;
use App\Middleware\VerifyCsrfToken;
use App\Repositories\ContentRepository;
use App\Repositories\RateLimitRepository;
use App\Services\AuthService;
use App\Services\ContactService;
use App\Services\ContentService;
use App\Services\NativeMailer;
use App\Services\RateLimiter;
use App\Services\UploadService;
use App\Utils\Logger;
use App\Validators\ContactValidator;

/*
 * Front controller: het enige bestand in deze map dat PHP uitvoert. Alle
 * verzoeken komen hier binnen, via de rewrite in .htaccess (Apache) of via
 * de afhandeling hieronder (de ingebouwde server tijdens ontwikkeling).
 */

/*
 * `php -S` kent geen mod_rewrite. Bestaat het gevraagde bestand echt — een
 * geüploade foto in uploads/ bijvoorbeeld — laat de ingebouwde server het
 * dan zelf afhandelen. Al het overige valt door naar de router, precies
 * zoals in productie.
 */
if (PHP_SAPI === 'cli-server') {
    $requestedPath = parse_url((string) ($_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH);

    if (is_string($requestedPath) && $requestedPath !== '/' && is_file(__DIR__ . $requestedPath)) {
        return false;
    }
}

/*
 * PHP zet standaard een X-Powered-By-header met het exacte versienummer.
 * Dat vertelt een aanvaller welke bekende kwetsbaarheden hij kan proberen,
 * en levert de bezoeker niets op (CLAUDE.md §11, minimale data-exposure).
 * Op shared hosting kan expose_php niet altijd uit; dit werkt hoe dan ook.
 */
header_remove('X-Powered-By');

$projectRoot = dirname(__DIR__);

require $projectRoot . '/src/Autoloader.php';

(new Autoloader('App\\', $projectRoot . '/src'))->register();

$paths = Paths::fromProjectRoot($projectRoot, __DIR__);
$config = Config::fromEnvFile($projectRoot . '/.env');
$logger = new Logger($paths->errorLog);

/*
 * Beveiligingsheaders meteen zetten, vóór er iets verstuurd kan worden. Zo
 * dragen ook de foutantwoorden ze (CLAUDE.md §11).
 */
(new SecurityHeaders())->apply();

/*
 * Foutafhandeling, vóór er ook maar iets anders gebeurt (CLAUDE.md §11).
 *
 * In productie gaat display_errors uit: een stack trace vertelt een
 * aanvaller precies welke bestanden waar staan. Fouten gaan altijd naar het
 * logbestand, ongeacht de omgeving.
 */
$isProduction = $config->environment() === Environment::Production;

ini_set('display_errors', $isProduction ? '0' : '1');
ini_set('log_errors', '1');
error_reporting(E_ALL);

/*
 * Waarschuwingen en notices worden uitzonderingen, zodat ze in dezelfde
 * try/catch belanden als echte fouten en niet half verwerkte uitvoer
 * opleveren. De check op error_reporting() respecteert de @-operator; zonder
 * die check zou een bewust onderdrukte waarschuwing (zoals in Logger) alsnog
 * het verzoek laten klappen.
 */
set_error_handler(
    static function (int $severity, string $message, string $file, int $line): bool {
        if ((error_reporting() & $severity) === 0) {
            return false;
        }

        throw new ErrorException($message, 0, $severity, $file, $line);
    },
);

/*
 * De lagen aan elkaar knopen. Dit bestand is de enige plek waar dat gebeurt:
 * geen enkele class zoekt zelf zijn afhankelijkheden op, en er zijn geen
 * globale variabelen of servicelocators in het spel (CLAUDE.md §8).
 */
$contentRepository = new ContentRepository($paths->content);
$contentService = new ContentService($contentRepository);
$contentController = new ContentController($contentService, $logger);

/*
 * Het admin-gedeelte. De sessie wordt hier alleen samengesteld, niet gestart —
 * dat doet AdminPipeline, en alleen voor verzoeken naar /api/admin. Zo krijgt
 * een gewone bezoeker van de site geen cookie die hij niet nodig heeft (§15).
 */
$session = new Session($paths->sessions);
$csrfToken = new CsrfToken($session);

$rateLimiter = new RateLimiter(
    new RateLimitRepository($paths->rateLimit),
    // Het IP-adres wordt met deze sleutel tot een HMAC verwerkt, zodat er geen
    // lijst met adressen van bezoekers op schijf belandt.
    $config->get('APP_SECRET'),
);

$authService = new AuthService($config, $session, $csrfToken, $rateLimiter, $logger);
$authController = new AuthController($authService, $csrfToken);
$adminContentController = new AdminContentController($contentRepository, $logger);
$uploadController = new UploadController(new UploadService($paths->uploads), $logger);

/*
 * Het publieke contactformulier. Bewust géén sessie: een bezoeker die alleen
 * dit formulier gebruikt krijgt zo geen cookie (§15). Het token is in plaats
 * daarvan met APP_SECRET ondertekend; $rateLimiter is dezelfde als voor het
 * inloggen, met een eigen bucketnaam.
 */
$contactService = new ContactService(
    $config,
    new ContactValidator(),
    $rateLimiter,
    new NativeMailer(),
    $logger,
);
$contactController = new ContactController($contactService, new SignedCsrfToken($config->get('APP_SECRET')));

$admin = new AdminPipeline(
    $session,
    new RequireAdmin($authService),
    new VerifyCsrfToken($csrfToken),
);

$router = new Router();

$router->add(
    'GET',
    '/api/content/{page}',
    static fn (Request $request, array $parameters) => $contentController->show($parameters),
);

/*
 * De admin-endpoints. Elk gaat door AdminPipeline heen; er is geen route die
 * rechtstreeks bij een controller uitkomt (§9, §11).
 */
$router->add(
    'GET',
    '/api/admin/session',
    $admin->withSession(static fn (): JsonResponse => $authController->show()),
);

$router->add(
    'POST',
    '/api/admin/login',
    // Nog niet ingelogd, maar wel een tokencontrole: inloggen wijzigt de
    // sessie, en §11 eist een token op elk formulier dat iets wijzigt.
    $admin->withToken(static fn (Request $request): JsonResponse => $authController->login($request)),
);

$router->add(
    'POST',
    '/api/admin/logout',
    $admin->withLogin(static fn (): JsonResponse => $authController->logout()),
);

/*
 * Content beheren. Anders dan de publieke route accepteert deze ook `site`,
 * want daar staan de bedrijfsgegevens die de klant moet kunnen invullen.
 */
$router->add(
    'GET',
    '/api/admin/content/{page}',
    $admin->withLogin(
        static fn (Request $request, array $parameters): JsonResponse
            => $adminContentController->show($parameters),
    ),
);

$router->add(
    'POST',
    '/api/admin/content/{page}',
    $admin->withLogin(
        static fn (Request $request, array $parameters): JsonResponse
            => $adminContentController->save($request, $parameters),
    ),
);

$router->add(
    'POST',
    '/api/admin/content/{page}/vorige-versie',
    $admin->withLogin(
        static fn (Request $request, array $parameters): JsonResponse
            => $adminContentController->restore($parameters),
    ),
);

$router->add(
    'POST',
    '/api/admin/upload',
    $admin->withLogin(
        static fn (Request $request): JsonResponse => $uploadController->store($request),
    ),
);

/*
 * Het contactformulier. Publiek, dus buiten AdminPipeline: rate limiting en
 * tokencontrole gebeuren rechtstreeks in controller en service, net als bij
 * /api/content/{page} (§9).
 */
$router->add(
    'GET',
    '/api/contact/token',
    static fn (): JsonResponse => $contactController->token(),
);

$router->add(
    'POST',
    '/api/contact',
    static fn (Request $request): JsonResponse => $contactController->send($request),
);

try {
    $router->dispatch(Request::fromGlobals())->send();
} catch (Throwable $throwable) {
    $logger->error('Onverwerkte fout tijdens afhandelen van verzoek', $throwable);

    JsonResponse::error(
        ErrorCode::ServerError,
        'Er is iets misgegaan. Probeer het later opnieuw.',
        500,
    )->send();
}
