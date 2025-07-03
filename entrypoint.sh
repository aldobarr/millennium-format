#!/usr/bin/env sh
set -e

mkdir -p ./storage/app/public/images
chown -R app:app ./storage/app/public/images

exec su-exec app "$@"