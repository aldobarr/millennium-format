#!/usr/bin/env sh
set -e

composer install --optimize-autoloader --no-dev
composer require laravel/octane --update-no-dev --optimize-autoloader
php artisan optimize
php artisan migrate --isolated --force
npm install
npm run build
php artisan octane:frankenphp