<?php

namespace App\Services\DataService;

use App\Models\Card;
use App\Models\Deck;
use App\Models\Tag;
use App\Models\User;
use App\Services\DataService;
use Illuminate\Support\Facades\DB;

class MySQLDataService extends DataService {
	public function getDashboardCounts(): array {
		$cards = Card::getTableName();
		$decks = Deck::getTableName();
		$tags = Tag::getTableName();
		$users = User::getTableName();
		$count_query = <<<SQL
			SELECT
				(SELECT COUNT(*) FROM `{$cards}`) AS cards,
				(SELECT COUNT(*) FROM `{$decks}`) AS decks,
				(SELECT COUNT(*) FROM `{$tags}`) AS tags,
				(SELECT COUNT(*) FROM `{$users}`) AS users;
		SQL;

		return (array) (DB::select($count_query)[0] ?? [
			'cards' => 0,
			'decks' => 0,
			'tags' => 0,
			'users' => 0
		]);
	}
}
