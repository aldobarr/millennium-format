<?php

use App\Models\Card;
use App\Models\Deck;
use App\Models\Tag;
use App\Services\DataService\DefaultDataService;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class DefaultTest extends TestCase {
	#[Test]
	public function get_dashboard_counts_returns_counts(): void {
		$card_count = random_int(100, 1000);
		$tag_count = random_int(20, 50);
		$deck_count = random_int(20, 100);

		Deck::factory()->count($deck_count)->create();
		Card::factory()->count($card_count)->create();
		Tag::factory()->count($tag_count)->create();

		$service = new DefaultDataService;
		$results = $service->getDashboardCounts();
		$this->assertEquals([
			'cards' => $card_count,
			'decks' => $deck_count,
			'tags' => $tag_count,
			'users' => $deck_count
		], $results);
	}
}
