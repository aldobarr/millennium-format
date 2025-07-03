#!/usr/bin/env sh
set -e

composer install --optimize-autoloader --no-dev
composer require laravel/octane --update-no-dev --optimize-autoloader
php artisan storage:link
php artisan optimize
php artisan migrate --isolated --force
npm install
npm run build
php artisan octane:frankenphp --workers=1