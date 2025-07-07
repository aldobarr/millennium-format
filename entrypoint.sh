#!/usr/bin/env sh
set -e

mkdir -p ./storage/app/public/images
chown -R app:app ./storage/app/public/images
redis-server /etc/redis.conf --daemonize yes

exec su-exec app "$@"