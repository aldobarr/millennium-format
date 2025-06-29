#!/usr/bin/env sh
set -e

composer install --optimize-autoloader --no-dev
php artisan optimize
php artisan migrate --isolated --force
npm install
npm run build

exec "$@"