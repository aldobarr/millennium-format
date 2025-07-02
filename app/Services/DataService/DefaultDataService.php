<?php

namespace App\Services\DataService;

use App\Models\Card;
use App\Models\Deck;
use App\Models\User;
use App\Services\DataService;

class DefaultDataService extends DataService {
	public function getDashboardCounts(): array {
		return [
			'cards' => Card::count(),
			'decks' => Deck::count(),
			'users' => User::count()
		];
	}
}
