FROM php:8.4-fpm-alpine as base

ARG devrun=false
ARG user=app
ARG uid=1000

RUN apk update && apk add \
    curl \
    libpng-dev \
    libxml2-dev \
    zip \
    unzip \
	su-exec

RUN apk add --no-cache \
	postgresql-libs \
	postgresql-dev

RUN apk add --no-cache --virtual .build-deps $PHPIZE_DEPS && \
	docker-php-ext-install pdo pdo_pgsql && \
	pecl install redis && \
	docker-php-ext-enable redis && \
	apk del .build-deps

RUN echo "https://dl-cdn.alpinelinux.org/alpine/edge/community" >> /etc/apk/repositories && \
	apk update && \
	apk add --no-cache nodejs npm && \
	npm install -g npm@latest && \
	npm config delete globalignorefile && \
	npm config delete python

COPY --from=composer:latest /usr/bin/composer /usr/local/bin/composer

RUN addgroup -S "$user" && \
	adduser -S -D -h /home/$user -u "$uid" -G "$user" "$user" && \
	adduser "$user" root && \
	adduser "$user" www-data
RUN mkdir -p /home/$user/.composer && \
    chown -R $user:$user /home/$user

RUN pwd

FROM base as dev

RUN if [ "$devrun" = "true" ]; then \
		apk add --no-cache linux-headers && \
		apk add --no-cache --virtual .build-deps $PHPIZE_DEPS \
		&& pecl install xdebug \
		&& docker-php-ext-enable xdebug \
		&& { \
			echo 'zend_extension = xdebug'; \
			echo 'xdebug.mode = debug'; \
			echo 'xdebug.start_with_request = yes'; \
			echo 'xdebug.discover_client_host = 1'; \
			echo 'xdebug.output_dir = /tmp/xdebug'; \
			echo 'xdebug.client_host = host.docker.internal'; \
			echo 'xdebug.client_port = 9003'; \
			echo 'xdebug.log_level = 0'; \
		} > /usr/local/etc/php/conf.d/99-xdebug.ini \
		&& apk del .build-deps; \
	fi

WORKDIR /var/www
USER $user

FROM base as production

USER root

RUN apk add --no-cache --virtual .build-deps $PHPIZE_DEPS && \
	docker-php-ext-install pcntl &&\
	apk del .build-deps

RUN curl https://frankenphp.dev/install.sh | sh && \
	mv frankenphp /usr/local/bin/

RUN printf "log_errors = On\nerror_log = /proc/self/fd/2\nerror_reporting = E_ALL\n" \
	> /usr/local/etc/php/conf.d/zzz-stderr.ini

COPY . /var/www/app
RUN chown -R $user:$user /var/www/app && \
	chmod -R 755 /var/www/app && \
	find /var/www/app -type d -exec chmod 755 {} \; && \
	find /var/www/app -type f -exec chmod 644 {} \;

RUN chmod +x /var/www/app/entrypoint.sh
WORKDIR /var/www/app
ENTRYPOINT ["./entrypoint.sh"]