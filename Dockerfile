FROM dunglas/frankenphp:1-php8.4-alpine AS base

ARG devrun=false
ARG user=app
ARG uid=1000

RUN apk update && apk add --no-cache \
	curl \
	zip \
	unzip \
	su-exec \
	postgresql-client \
	nodejs \
	npm && \
	npm install -g npm@latest

RUN install-php-extensions pdo_pgsql pcntl zip redis

COPY --from=composer:latest /usr/bin/composer /usr/local/bin/composer

RUN addgroup -S "$user" && \
	adduser -S -D -h /home/$user -u "$uid" -G "$user" "$user" && \
	adduser "$user" root && \
	adduser "$user" www-data
RUN mkdir -p /home/$user/.composer /config/caddy /data/caddy && \
	chown -R $user:$user /home/$user /config /data

FROM base AS dev

RUN if [ "$devrun" = "true" ]; then \
		install-php-extensions xdebug && \
		{ \
			echo 'xdebug.mode = debug'; \
			echo 'xdebug.start_with_request = yes'; \
			echo 'xdebug.discover_client_host = 1'; \
			echo 'xdebug.output_dir = /tmp/xdebug'; \
			echo 'xdebug.client_host = host.docker.internal'; \
			echo 'xdebug.client_port = 9003'; \
			echo 'xdebug.log_level = 0'; \
		} > /usr/local/etc/php/conf.d/99-xdebug.ini; \
	fi

WORKDIR /var/www
USER $user
CMD ["frankenphp", "php-server", "--listen=:8000", "--root=/var/www/public"]

FROM base AS production

USER root

RUN apk add --no-cache redis

RUN printf "log_errors = On\nerror_log = /proc/self/fd/2\nerror_reporting = E_ALL\n" \
	> /usr/local/etc/php/conf.d/zzz-stderr.ini

COPY . /var/www/app
RUN chown -R $user:$user /var/www/app && \
	chmod -R 755 /var/www/app && \
	find /var/www/app -type d -exec chmod 755 {} \; && \
	find /var/www/app -type f -exec chmod 644 {} \;

RUN chmod +x /var/www/app/entrypoint.sh && \
	chmod +x /var/www/app/build.sh

WORKDIR /var/www/app
ENTRYPOINT ["./entrypoint.sh", "./build.sh"]
