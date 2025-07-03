#!/usr/bin/env sh
set -e

mkdir -p ./storage/app/public/images
chown -R app:app ./storage/app/public/images

composer install --optimize-autoloader --no-dev
composer require laravel/octane --update-no-dev --optimize-autoloader
php artisan storage:link
php artisan optimize
php artisan migrate --isolated --force
npm install
npm run build
php artisan octane:frankenphp --workers=1

exec su-exec app "$@"