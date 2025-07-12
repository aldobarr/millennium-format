#!/usr/bin/env sh
set -e

redis-server /etc/redis.conf --daemonize yes

exec su-exec app "$@"