<?php

namespace App\Services\DataService;

use App\Models\Card;
use App\Models\Deck;
use App\Models\User;
use App\Services\DataService;
use Illuminate\Support\Facades\DB;

class PostgresDataService extends DataService {
	public function getDashboardCounts(): array {
		$cards = Card::getTableName();
		$decks = Deck::getTableName();
		$users = User::getTableName();
		$count_query = <<<SQL
			WITH
			c AS (
				SELECT COUNT(*) AS cards
				FROM "{$cards}"
			),
			d AS (
				SELECT COUNT(*) AS decks
				FROM "{$decks}"
			),
			u AS (
				SELECT COUNT(*) AS users
				FROM "{$users}"
			)
			SELECT *
			FROM c, d, u;
		SQL;

		return (array) (DB::select($count_query)[0] ?? [
			'cards' => 0,
			'decks' => 0,
			'users' => 0
		]);
	}
}
