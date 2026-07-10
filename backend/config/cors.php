<?php
return [
    'paths'                    => ['api/*', 'sanctum/csrf-cookie', 'storage/*'],
    'allowed_methods'          => ['*'],
    'allowed_origins' => [
    'http://localhost',           
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:4173',
    'https://hamedtelecom.fasodev.com',
    'https://127.0.0.1:8001',
    'https://localhost:8001',
],
    'allowed_origins_patterns' => [],
    'allowed_headers'          => ['*'],
    'exposed_headers'          => [],
    'max_age'                  => 0,
    'supports_credentials'     => true,
];