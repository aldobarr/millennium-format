FROM php:8.4-fpm-alpine AS production

ARG user=app
ARG uid=1000

RUN apk update && apk add \
    curl \
    libpng-dev \
    libxml2-dev \
    zip \
    unzip

RUN apk add --no-cache \
	postgresql-libs \
	postgresql-dev

RUN docker-php-ext-install pdo pdo_pgsql \
    && apk --no-cache add nodejs npm

RUN apk add --no-cache --virtual .build-deps $PHPIZE_DEPS \
	&& pecl install redis \
	&& docker-php-ext-enable redis \
	&& apk del .build-deps

COPY --from=composer:latest /usr/bin/composer /usr/local/bin/composer

RUN adduser -S -D -h /home/$user -G www-data -u "$uid" "$user" && \
	adduser "$user" root
RUN mkdir -p /home/$user/.composer && \
    chown -R $user:$user /home/$user
WORKDIR /var/www
USER $user

FROM production AS dev

USER root

RUN apk add --no-cache linux-headers
RUN apk add --no-cache --virtual .build-deps $PHPIZE_DEPS \
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
	&& apk del .build-deps

USER $user