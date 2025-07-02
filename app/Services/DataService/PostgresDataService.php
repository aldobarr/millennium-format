<?php

namespace App\Services\DataService;

use App\Models\Card;
use App\Models\Deck;
use App\Models\Tag;
use App\Models\User;
use App\Services\DataService;
use Illuminate\Support\Facades\DB;

class PostgresDataService extends DataService {
	public function getDashboardCounts(): array {
		$cards = Card::getTableName();
		$decks = Deck::getTableName();
		$tags = Tag::getTableName();
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
			t AS (
				SELECT COUNT(*) AS tags
				FROM "{$tags}"
			),
			u AS (
				SELECT COUNT(*) AS users
				FROM "{$users}"
			)
			SELECT *
			FROM c, d, t, u;
		SQL;

		return (array) (DB::select($count_query)[0] ?? [
			'cards' => 0,
			'decks' => 0,
			'tags' => 0,
			'users' => 0
		]);
	}
}
