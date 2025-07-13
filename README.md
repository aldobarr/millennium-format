<p align="center"><img src="https://github.com/aldobarr/project-lost/raw/refs/heads/master/resources/art/logo.svg" width="400" alt="Project Lost"></p>

## About Project Lost

Project Lost is a format aimed at creating a Yugioh ruleset that makes for more fun and well paced duels somewhat similar to the popular MTG Commands format.
This project aims to aid players by helping them build decks that are compliant with the Project Lost format in an easy to use and visually appealing way.

## Running Locally

Ensure your environment has the following core dependencies:
- Docker
- php
- composer
- NodeJS & NPM

After cloning the project locally run the following commands:
- Run `cd ./project-lost`
- Run `composer install`
- Run `npm install`
- Verify `.env` exists or copy `.env.example` to `.env` and configure it
  - If creating new `.env` or `.env` does not have `APP_KEY` set, run `php artisan key:generate`
- Set your default db username password and db name in your .env as this will configure your DB defaults
  - DB_DATABASE
  - DB_USERNAME
  - DB_PASSWORD
- Run `docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build -d`
- Run `docker compose exec app php artisan migrate`
- Run `npm run dev`

## License

Project Lost is open-sourced software licensed under the [GNU GPL v3 License](https://opensource.org/license/gpl-3-0).
