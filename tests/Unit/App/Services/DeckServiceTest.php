<?php

use App\Enums\CardType;
use App\Enums\CategoryType;
use App\Enums\DeckType;
use App\Models\Card;
use App\Models\Category;
use App\Models\Deck;
use App\Models\Tag;
use App\Services\DeckService;
use Illuminate\Database\Eloquent\Factories\Sequence;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

test('the constructor standardizes the categories array to be an array of card ids', function() {
	$deck = Deck::factory()
		->has(
			Category::factory()->hasAttached(
				Card::factory()->count(random_int(50, 100)),
				new Sequence(fn($sequence) => ['order' => $sequence->index])
			)->count(5))
		->create();

	$deck->load('categories.cards');
	new DeckService($deck, $deck->categories->toArray());
})->throwsNoExceptions();

test('a deck with no categories is invalid', function() {
	$deck = Deck::factory()->create();
	$deck->load('categories.cards');

	// should throw exception even with loose validation.
	$service = new DeckService($deck, $deck->categories->toArray(), false);
	expect(fn() => $service->validateDeck())->toThrow(ValidationException::class, 'Your deck must have a Deck Master, Extra Deck, and Side Deck category.');
});

test('a deck with duplicate categories is invalid', function() {
	$deck = Deck::factory()->create();
	Category::factory(state: ['type' => CategoryType::DECK_MASTER->value, 'order' => 0])->for($deck)->create();

	$deck->load('categories.cards');
	$categories = $deck->categories->toArray();
	$categories[] = $categories[0];

	// should throw exception even with loose validation.
	$service = new DeckService($deck, $categories, false);
	expect(fn() => $service->validateDeck())->toThrow(ValidationException::class, 'This deck has invalid categories.');
});

test('a deck without the correct categories configuration is invalid', function() {
	$deck = Deck::factory()->create();
	Category::factory(state: ['type' => CategoryType::DECK_MASTER->value, 'order' => 0])->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::MAIN->value, 'order' => 1])->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::EXTRA->value, 'order' => 2])->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::MAIN->value, 'order' => 3])->for($deck)->create();

	$deck->load('categories.cards');

	// should throw exception even with loose validation.
	$service = new DeckService($deck, $deck->categories->toArray(), false);
	expect(fn() => $service->validateDeck())->toThrow(ValidationException::class, 'Your deck must have a Deck Master, Extra Deck, and Side Deck category.');

	$deck = Deck::factory()->create();
	Category::factory(state: ['type' => CategoryType::DECK_MASTER->value, 'order' => 0])->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::MAIN->value, 'order' => 1])->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::MAIN->value, 'order' => 2])->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::SIDE->value, 'order' => 3])->for($deck)->create();

	$deck->load('categories.cards');

	// should throw exception even with loose validation.
	$service = new DeckService($deck, $deck->categories->toArray(), false);
	expect(fn() => $service->validateDeck())->toThrow(ValidationException::class, 'Your deck must have a Deck Master, Extra Deck, and Side Deck category.');

	$deck = Deck::factory()->create();
	Category::factory(state: ['type' => CategoryType::MAIN->value, 'order' => 0])->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::MAIN->value, 'order' => 1])->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::EXTRA->value, 'order' => 2])->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::SIDE->value, 'order' => 3])->for($deck)->create();

	$deck->load('categories.cards');

	// should throw exception even with loose validation.
	$service = new DeckService($deck, $deck->categories->toArray(), false);
	expect(fn() => $service->validateDeck())->toThrow(ValidationException::class, 'Your deck must have a Deck Master, Extra Deck, and Side Deck category.');
});

test('a deck with duplicate special categories is invalid', function() {
	$deck = Deck::factory()->create();
	Category::factory(state: ['type' => CategoryType::DECK_MASTER->value, 'order' => 0])->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::DECK_MASTER->value, 'order' => 0])->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::MAIN->value, 'order' => 2])->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::EXTRA->value, 'order' => 3])->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::SIDE->value, 'order' => 4])->for($deck)->create();

	$deck->load('categories.cards');

	// should throw exception even with loose validation.
	$service = new DeckService($deck, $deck->categories->toArray(), false);
	expect(fn() => $service->validateDeck())->toThrow(ValidationException::class, 'Only one DeckMaster category is allowed.');

	$deck = Deck::factory()->create();
	Category::factory(state: ['type' => CategoryType::DECK_MASTER->value, 'order' => 0])->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::MAIN->value, 'order' => 1])->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::EXTRA->value, 'order' => 3])->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::EXTRA->value, 'order' => 3])->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::SIDE->value, 'order' => 4])->for($deck)->create();

	$deck->load('categories.cards');

	// should throw exception even with loose validation.
	$service = new DeckService($deck, $deck->categories->toArray(), false);
	expect(fn() => $service->validateDeck())->toThrow(ValidationException::class, 'Only one Extra Deck category is allowed.');

	$deck = Deck::factory()->create();
	Category::factory(state: ['type' => CategoryType::DECK_MASTER->value, 'order' => 0])->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::MAIN->value, 'order' => 1])->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::EXTRA->value, 'order' => 3])->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::SIDE->value, 'order' => 4])->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::SIDE->value, 'order' => 4])->for($deck)->create();

	$deck->load('categories.cards');

	// should throw exception even with loose validation.
	$service = new DeckService($deck, $deck->categories->toArray(), false);
	expect(fn() => $service->validateDeck())->toThrow(ValidationException::class, 'Only one Side Deck category is allowed.');
});

test('a deck without a deck master is invalid', function() {
	$deck = Deck::factory()->create();
	Category::factory(state: ['type' => CategoryType::DECK_MASTER->value, 'order' => 0])->for($deck)->create();
	Category::factory(2, ['type' => CategoryType::MAIN->value, 'order' => 1])->hasAttached(
		Card::factory()->count(random_int(0, 100)),
		new Sequence(fn($sequence) => ['order' => $sequence->index])
	)->for($deck)->create();
	Category::factory(1, ['type' => CategoryType::EXTRA->value, 'order' => 3])->hasAttached(
		Card::factory()->count(random_int(0, 100)),
		new Sequence(fn($sequence) => ['order' => $sequence->index])
	)->for($deck)->create();
	Category::factory(1, ['type' => CategoryType::SIDE->value, 'order' => 4])->hasAttached(
		Card::factory()->count(random_int(0, 100)),
		new Sequence(fn($sequence) => ['order' => $sequence->index])
	)->for($deck)->create();

	$deck->load('categories.cards');
	expect(DeckService::isDeckValid($deck))->toBe(false);

	$service = new DeckService($deck, $deck->categories->toArray(), true);
	expect(fn() => $service->validateDeck())->toThrow(ValidationException::class, 'Your Deck Master category must contain exactly one card.');
});

test('the deck master category must contain exactly 1 card', function() {
	$deck = Deck::factory()->create();
	Category::factory(state: ['type' => CategoryType::DECK_MASTER->value, 'order' => 0])->hasAttached(
		Card::factory()->count(random_int(2, 100)),
		new Sequence(fn($sequence) => ['order' => $sequence->index])
	)->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::MAIN->value, 'order' => 1])->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::EXTRA->value, 'order' => 2])->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::SIDE->value, 'order' => 3])->for($deck)->create();

	$deck->load('categories.cards');

	// should throw exception even with loose validation.
	$service = new DeckService($deck, $deck->categories->toArray(), false);
	expect(fn() => $service->validateDeck())->toThrow(ValidationException::class, 'Your Deck Master category must contain exactly one card.');

	$deck = Deck::factory()->create();
	Category::factory(state: ['type' => CategoryType::DECK_MASTER->value, 'order' => 0])->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::MAIN->value, 'order' => 1])->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::EXTRA->value, 'order' => 2])->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::SIDE->value, 'order' => 3])->for($deck)->create();

	$deck->load('categories.cards');

	// requires strict to trigger exception
	$service = new DeckService($deck, $deck->categories->toArray(), true);
	expect(fn() => $service->validateDeck())->toThrow(ValidationException::class, 'Your Deck Master category must contain exactly one card.');

	// does not trigger with loose validation when deck master is empty
	expect(DeckService::isDeckValid($deck, false))->toBe(true);
});

test('the deck master category must be first in order', function() {
	$deck = Deck::factory()->create();
	Category::factory(state: ['type' => CategoryType::DECK_MASTER->value, 'order' => 1])->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::MAIN->value, 'order' => 0])->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::EXTRA->value, 'order' => 2])->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::SIDE->value, 'order' => 3])->for($deck)->create();

	$deck->load('categories.cards');

	// should throw exception even with loose validation.
	$service = new DeckService($deck, $deck->categories->toArray(), false);
	expect(fn() => $service->validateDeck())->toThrow(ValidationException::class, 'Your Deck Master category must be the first category.');
});

test('the extra deck category must be second to last in order', function() {
	$deck = Deck::factory()->create();
	Category::factory(state: ['type' => CategoryType::DECK_MASTER->value, 'order' => 0])->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::MAIN->value, 'order' => 2])->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::EXTRA->value, 'order' => 1])->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::SIDE->value, 'order' => 3])->for($deck)->create();

	$deck->load('categories.cards');

	// should throw exception even with loose validation.
	$service = new DeckService($deck, $deck->categories->toArray(), false);
	expect(fn() => $service->validateDeck())->toThrow(ValidationException::class, 'Your Extra Deck category must be the second to last category.');
});

test('the extra deck category must have no more than 15 cards', function() {
	$deck = Deck::factory()->create();
	Category::factory(state: ['type' => CategoryType::DECK_MASTER->value, 'order' => 0])->hasAttached(
		Card::factory(state: ['type' => CardType::MONSTER, 'deck_type' => DeckType::RITUAL])->count(1),
		['order' => 0]
	)->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::MAIN->value, 'order' => 1])->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::EXTRA->value, 'order' => 2])->hasAttached(
		Card::factory(state: ['type' => CardType::MONSTER, 'deck_type' => DeckType::EXTRA])->count(random_int(16, 100)),
		new Sequence(fn($sequence) => ['order' => $sequence->index])
	)->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::SIDE->value, 'order' => 3])->for($deck)->create();

	$deck->load('categories.cards');

	// requires strict validation
	$service = new DeckService($deck, $deck->categories->toArray(), true);
	expect(fn() => $service->validateDeck())->toThrow(ValidationException::class, 'Your Extra Deck may not contain more than ' . DeckService::MAX_EXTRA_DECK_CARDS . ' cards.');

	// does not trigger with loose validation
	expect(DeckService::isDeckValid($deck, false))->toBe(true);
});

test('the side deck category must be last in order', function() {
	$deck = Deck::factory()->create();
	Category::factory(state: ['type' => CategoryType::DECK_MASTER->value, 'order' => 0])->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::MAIN->value, 'order' => 3])->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::EXTRA->value, 'order' => 2])->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::SIDE->value, 'order' => 1])->for($deck)->create();

	$deck->load('categories.cards');

	// should throw exception even with loose validation.
	$service = new DeckService($deck, $deck->categories->toArray(), false);
	expect(fn() => $service->validateDeck())->toThrow(ValidationException::class, 'Your Side Deck category must be the last category.');
});

test('the side deck category must have no more than 15 cards', function() {
	$deck = Deck::factory()->create();
	Category::factory(state: ['type' => CategoryType::DECK_MASTER->value, 'order' => 0])->hasAttached(
		Card::factory(state: ['type' => CardType::MONSTER, 'deck_type' => DeckType::RITUAL])->count(1),
		['order' => 0]
	)->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::MAIN->value, 'order' => 1])->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::EXTRA->value, 'order' => 2])->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::SIDE->value, 'order' => 3])->hasAttached(
		Card::factory()->count(random_int(16, 100)),
		new Sequence(fn($sequence) => ['order' => $sequence->index])
	)->for($deck)->create();

	$deck->load('categories.cards');

	// requires strict validation
	$service = new DeckService($deck, $deck->categories->toArray(), true);
	expect(fn() => $service->validateDeck())->toThrow(ValidationException::class, 'Your Side Deck may not contain more than ' . DeckService::MAX_EXTRA_DECK_CARDS . ' cards.');

	// does not trigger with loose validation
	expect(DeckService::isDeckValid($deck, false))->toBe(true);
});

test('a deck must contain exactly 59 main deck cards and 1 deck master card', function() {
	$deck = Deck::factory()->create();
	Category::factory(state: ['type' => CategoryType::DECK_MASTER->value, 'order' => 0])->hasAttached(
		Card::factory(state: ['type' => CardType::MONSTER, 'deck_type' => DeckType::RITUAL])->count(1),
		['order' => 0]
	)->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::MAIN->value, 'order' => 1])->hasAttached(
		Card::factory(state: ['deck_type' => DeckType::NORMAL])->count(60),
		new Sequence(fn($sequence) => ['order' => $sequence->index])
	)->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::EXTRA->value, 'order' => 2])->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::SIDE->value, 'order' => 3])->for($deck)->create();

	$deck->load('categories.cards');

	// requires strict validation
	$service = new DeckService($deck, $deck->categories->toArray(), true);
	expect(fn() => $service->validateDeck())->toThrow(ValidationException::class, 'Your Main Deck must contain exactly ' . DeckService::MAIN_DECK_CARDS . ' cards including the Deck Master.');

	// does not trigger with loose validation
	expect(DeckService::isDeckValid($deck, false))->toBe(true);

	$deck = Deck::factory()->create();
	Category::factory(state: ['type' => CategoryType::DECK_MASTER->value, 'order' => 0])->hasAttached(
		Card::factory(state: ['type' => CardType::MONSTER, 'deck_type' => DeckType::RITUAL])->count(1),
		['order' => 0]
	)->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::MAIN->value, 'order' => 1])->hasAttached(
		Card::factory(state: ['deck_type' => DeckType::NORMAL])->count(59),
		new Sequence(fn($sequence) => ['order' => $sequence->index])
	)->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::EXTRA->value, 'order' => 2])->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::SIDE->value, 'order' => 3])->for($deck)->create();

	$deck->load('categories.cards');
	expect(DeckService::isDeckValid($deck))->toBe(true);
});

test('a normal card may not be in the extra deck', function() {
	$deck = Deck::factory()->create();
	Category::factory(state: ['type' => CategoryType::DECK_MASTER->value, 'order' => 0])->hasAttached(
		Card::factory(state: ['type' => CardType::MONSTER, 'deck_type' => DeckType::RITUAL])->count(1),
		['order' => 0]
	)->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::MAIN->value, 'order' => 1])->hasAttached(
		Card::factory(state: ['deck_type' => DeckType::NORMAL])->count(59),
		new Sequence(fn($sequence) => ['order' => $sequence->index + 1])
	)->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::EXTRA->value, 'order' => 2])->hasAttached(
		Card::factory(state: ['deck_type' => DeckType::NORMAL])->count(1),
		['order' => 0]
	)->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::SIDE->value, 'order' => 3])->for($deck)->create();

	$deck->load('categories.cards');

	// throws even with loose validation
	$service = new DeckService($deck, $deck->categories->toArray(), false);
	expect(fn() => $service->validateDeck())->toThrow(ValidationException::class, 'cannot be in the extra deck.');
});

test('an extra deck card may not be in the main deck', function() {
	$deck = Deck::factory()->create();
	Category::factory(state: ['type' => CategoryType::DECK_MASTER->value, 'order' => 0])->hasAttached(
		Card::factory(state: ['type' => CardType::MONSTER, 'deck_type' => DeckType::RITUAL])->count(1),
		['order' => 0]
	)->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::MAIN->value, 'order' => 1])->hasAttached(
		Card::factory()->count(59)->sequence(fn($sequence) => [
			'deck_type' => $sequence->index === 0 ? DeckType::EXTRA : DeckType::NORMAL
		]),
		new Sequence(fn($sequence) => ['order' => $sequence->index])
	)->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::EXTRA->value, 'order' => 2])->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::SIDE->value, 'order' => 3])->for($deck)->create();

	$deck->load('categories.cards');

	// throws even with loose validation
	$service = new DeckService($deck, $deck->categories->toArray(), false);
	expect(fn() => $service->validateDeck())->toThrow(ValidationException::class, 'cannot be in the main deck.');
});

test('only monster cards may be in extra deck', function() {
	$deck = Deck::factory()->create();
	Category::factory(state: ['type' => CategoryType::DECK_MASTER->value, 'order' => 0])->hasAttached(
		Card::factory(state: ['type' => CardType::MONSTER, 'deck_type' => DeckType::RITUAL])->count(1),
		['order' => 0]
	)->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::MAIN->value, 'order' => 1])->hasAttached(
		Card::factory(state: ['deck_type' => DeckType::NORMAL->value])->count(59),
		new Sequence(fn($sequence) => ['order' => $sequence->index])
	)->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::EXTRA->value, 'order' => 2])->hasAttached(
		Card::factory(state: ['type' => CardType::SPELL, 'deck_type' => DeckType::EXTRA->value])->count(1),
		['order' => 0]
	)->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::SIDE->value, 'order' => 3])->for($deck)->create();

	$deck->load('categories.cards');

	// throws even with loose validation
	$service = new DeckService($deck, $deck->categories->toArray(), false);
	expect(fn() => $service->validateDeck())->toThrow(ValidationException::class, 'Card) cannot be in the Extra Deck.');

	$deck = Deck::factory()->create();
	Category::factory(state: ['type' => CategoryType::DECK_MASTER->value, 'order' => 0])->hasAttached(
		Card::factory(state: ['type' => CardType::MONSTER, 'deck_type' => DeckType::RITUAL])->count(1),
		['order' => 0]
	)->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::MAIN->value, 'order' => 1])->hasAttached(
		Card::factory(state: ['deck_type' => DeckType::NORMAL->value])->count(59),
		new Sequence(fn($sequence) => ['order' => $sequence->index])
	)->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::EXTRA->value, 'order' => 2])->hasAttached(
		Card::factory(state: ['type' => CardType::TRAP, 'deck_type' => DeckType::EXTRA->value])->count(1),
		['order' => 0]
	)->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::SIDE->value, 'order' => 3])->for($deck)->create();

	$deck->load('categories.cards');

	// throws even with loose validation
	$service = new DeckService($deck, $deck->categories->toArray(), false);
	expect(fn() => $service->validateDeck())->toThrow(ValidationException::class, 'Card) cannot be in the Extra Deck.');

	$deck = Deck::factory()->create();
	Category::factory(state: ['type' => CategoryType::DECK_MASTER->value, 'order' => 0])->hasAttached(
		Card::factory(state: ['type' => CardType::MONSTER, 'deck_type' => DeckType::RITUAL])->count(1),
		['order' => 0]
	)->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::MAIN->value, 'order' => 1])->hasAttached(
		Card::factory(state: ['deck_type' => DeckType::NORMAL->value])->count(59),
		new Sequence(fn($sequence) => ['order' => $sequence->index])
	)->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::EXTRA->value, 'order' => 2])->hasAttached(
		Card::factory(state: ['type' => CardType::MONSTER, 'deck_type' => DeckType::EXTRA->value])->count(1),
		['order' => 0]
	)->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::SIDE->value, 'order' => 3])->for($deck)->create();

	$deck->load('categories.cards');
	expect(DeckService::isDeckValid($deck))->toBe(true);
});

test('only monster cards may be a deck master', function() {
	$deck = Deck::factory()->create();
	Category::factory(state: ['type' => CategoryType::DECK_MASTER->value, 'order' => 0])->hasAttached(
		Card::factory(state: ['type' => CardType::SPELL, 'deck_type' => DeckType::RITUAL])->count(1),
		['order' => 0]
	)->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::MAIN->value, 'order' => 1])->hasAttached(
		Card::factory(state: ['deck_type' => DeckType::NORMAL->value])->count(59),
		new Sequence(fn($sequence) => ['order' => $sequence->index])
	)->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::EXTRA->value, 'order' => 2])->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::SIDE->value, 'order' => 3])->for($deck)->create();

	$deck->load('categories.cards');

	// throws even with loose validation
	$service = new DeckService($deck, $deck->categories->toArray(), false);
	expect(fn() => $service->validateDeck())->toThrow(ValidationException::class, 'Card) cannot be a Deck Master.');

	$deck = Deck::factory()->create();
	Category::factory(state: ['type' => CategoryType::DECK_MASTER->value, 'order' => 0])->hasAttached(
		Card::factory(state: ['type' => CardType::TRAP, 'deck_type' => DeckType::RITUAL])->count(1),
		['order' => 0]
	)->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::MAIN->value, 'order' => 1])->hasAttached(
		Card::factory(state: ['deck_type' => DeckType::NORMAL->value])->count(59),
		new Sequence(fn($sequence) => ['order' => $sequence->index])
	)->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::EXTRA->value, 'order' => 2])->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::SIDE->value, 'order' => 3])->for($deck)->create();

	$deck->load('categories.cards');

	// throws even with loose validation
	$service = new DeckService($deck, $deck->categories->toArray(), false);
	expect(fn() => $service->validateDeck())->toThrow(ValidationException::class, 'Card) cannot be a Deck Master.');

	$deck = Deck::factory()->create();
	Category::factory(state: ['type' => CategoryType::DECK_MASTER->value, 'order' => 0])->hasAttached(
		Card::factory(state: ['type' => CardType::MONSTER, 'deck_type' => DeckType::RITUAL])->count(1),
		['order' => 0]
	)->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::MAIN->value, 'order' => 1])->hasAttached(
		Card::factory(state: ['deck_type' => DeckType::NORMAL->value])->count(59),
		new Sequence(fn($sequence) => ['order' => $sequence->index])
	)->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::EXTRA->value, 'order' => 2])->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::SIDE->value, 'order' => 3])->for($deck)->create();

	$deck->load('categories.cards');
	expect(DeckService::isDeckValid($deck))->toBe(true);
});

test('a normal monster must be at least level 5 to be a deck master', function() {
	$deck = Deck::factory()->create();
	Category::factory(state: ['type' => CategoryType::DECK_MASTER->value, 'order' => 0])->hasAttached(
		Card::factory(state: ['type' => CardType::MONSTER, 'deck_type' => DeckType::NORMAL, 'level' => 4])->count(1),
		['order' => 0]
	)->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::MAIN->value, 'order' => 1])->hasAttached(
		Card::factory(state: ['deck_type' => DeckType::NORMAL->value])->count(59),
		new Sequence(fn($sequence) => ['order' => $sequence->index])
	)->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::EXTRA->value, 'order' => 2])->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::SIDE->value, 'order' => 3])->for($deck)->create();

	$deck->load('categories.cards');

	// throws even with loose validation
	$service = new DeckService($deck, $deck->categories->toArray(), false);
	expect(fn() => $service->validateDeck())->toThrow(ValidationException::class, 'cannot be a Deck Master.');

	$deck = Deck::factory()->create();
	Category::factory(state: ['type' => CategoryType::DECK_MASTER->value, 'order' => 0])->hasAttached(
		Card::factory(state: ['type' => CardType::TRAP, 'deck_type' => DeckType::NORMAL, 'level' => null])->count(1),
		['order' => 0]
	)->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::MAIN->value, 'order' => 1])->hasAttached(
		Card::factory(state: ['deck_type' => DeckType::NORMAL->value])->count(59),
		new Sequence(fn($sequence) => ['order' => $sequence->index])
	)->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::EXTRA->value, 'order' => 2])->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::SIDE->value, 'order' => 3])->for($deck)->create();

	$deck->load('categories.cards');

	// throws even with loose validation
	$service = new DeckService($deck, $deck->categories->toArray(), false);
	expect(fn() => $service->validateDeck())->toThrow(ValidationException::class, 'cannot be a Deck Master.');

	$deck = Deck::factory()->create();
	Category::factory(state: ['type' => CategoryType::DECK_MASTER->value, 'order' => 0])->hasAttached(
		Card::factory(state: ['type' => CardType::MONSTER, 'deck_type' => DeckType::NORMAL, 'level' => 5])->count(1),
		['order' => 0]
	)->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::MAIN->value, 'order' => 1])->hasAttached(
		Card::factory(state: ['deck_type' => DeckType::NORMAL->value])->count(59),
		new Sequence(fn($sequence) => ['order' => $sequence->index])
	)->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::EXTRA->value, 'order' => 2])->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::SIDE->value, 'order' => 3])->for($deck)->create();

	$deck->load('categories.cards');
	expect(DeckService::isDeckValid($deck))->toBe(true);

	$deck = Deck::factory()->create();
	Category::factory(state: ['type' => CategoryType::DECK_MASTER->value, 'order' => 0])->hasAttached(
		Card::factory(state: ['type' => CardType::MONSTER, 'deck_type' => DeckType::RITUAL, 'level' => 1])->count(1),
		['order' => 0]
	)->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::MAIN->value, 'order' => 1])->hasAttached(
		Card::factory(state: ['deck_type' => DeckType::NORMAL->value])->count(59),
		new Sequence(fn($sequence) => ['order' => $sequence->index])
	)->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::EXTRA->value, 'order' => 2])->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::SIDE->value, 'order' => 3])->for($deck)->create();

	$deck->load('categories.cards');
	expect(DeckService::isDeckValid($deck))->toBe(true);

	$deck = Deck::factory()->create();
	Category::factory(state: ['type' => CategoryType::DECK_MASTER->value, 'order' => 0])->hasAttached(
		Card::factory(state: ['type' => CardType::MONSTER, 'deck_type' => DeckType::EXTRA, 'level' => 1])->count(1),
		['order' => 0]
	)->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::MAIN->value, 'order' => 1])->hasAttached(
		Card::factory(state: ['deck_type' => DeckType::NORMAL->value])->count(59),
		new Sequence(fn($sequence) => ['order' => $sequence->index])
	)->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::EXTRA->value, 'order' => 2])->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::SIDE->value, 'order' => 3])->for($deck)->create();

	$deck->load('categories.cards');
	expect(DeckService::isDeckValid($deck))->toBe(true);
});

test('a deck may not contain more copies of a card than the card\'s limit', function() {
	$deck = Deck::factory()->create();
	$card = Card::factory()->create(['limit' => 1, 'deck_type' => DeckType::NORMAL]);
	$main = Category::factory(state: ['type' => CategoryType::MAIN->value, 'order' => 1])->hasAttached(
		Card::factory(state: ['deck_type' => DeckType::NORMAL])->count(57),
		new Sequence(fn($sequence) => ['order' => $sequence->index + 2])
	)->for($deck)->create();

	Category::factory(state: ['type' => CategoryType::DECK_MASTER->value, 'order' => 0])->hasAttached(
		Card::factory(state: ['type' => CardType::MONSTER, 'deck_type' => DeckType::RITUAL])->count(1),
		['order' => 0]
	)->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::EXTRA->value, 'order' => 2])->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::SIDE->value, 'order' => 3])->for($deck)->create();
	DB::table($main->cards()->getTable())->insert([
		['card_id' => $card->id, 'category_id' => $main->id, 'order' => 0],
		['card_id' => $card->id, 'category_id' => $main->id, 'order' => 1]
	]);

	$deck->load('categories.cards');

	// throws even with loose validation
	$service = new DeckService($deck, $deck->categories->toArray(), false);
	expect(fn() => $service->validateDeck())->toThrow(ValidationException::class, 'You cannot have more than ' . $card->limit . ' copies of "' . $card->name . '".');

	$deck = Deck::factory()->create();
	$card = Card::factory()->create(['limit' => 3, 'deck_type' => DeckType::NORMAL]);
	$main = Category::factory(state: ['type' => CategoryType::MAIN->value, 'order' => 1])->hasAttached(
		Card::factory(state: ['deck_type' => DeckType::NORMAL])->count(57),
		new Sequence(fn($sequence) => ['order' => $sequence->index + 2])
	)->for($deck)->create();

	Category::factory(state: ['type' => CategoryType::DECK_MASTER->value, 'order' => 0])->hasAttached(
		Card::factory(state: ['type' => CardType::MONSTER, 'deck_type' => DeckType::RITUAL])->count(1),
		['order' => 0]
	)->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::EXTRA->value, 'order' => 2])->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::SIDE->value, 'order' => 3])->for($deck)->create();
	DB::table($main->cards()->getTable())->insert([
		['card_id' => $card->id, 'category_id' => $main->id, 'order' => 0],
		['card_id' => $card->id, 'category_id' => $main->id, 'order' => 1]
	]);

	// valid with higher limit
	$deck->load('categories.cards');
	expect(DeckService::isDeckValid($deck))->toBe(true);
});

test('a deck\'s cards must have matching tags with the deck master', function() {
	$deck = Deck::factory()->create();
	Category::factory(state: ['type' => CategoryType::DECK_MASTER->value, 'order' => 0])->hasAttached(
		Card::factory(state: ['type' => CardType::MONSTER, 'deck_type' => DeckType::RITUAL])->has(
			Tag::factory()->count(1)
		)->count(1),
		['order' => 0]
	)->for($deck)->create();

	$main = Category::factory(state: ['type' => CategoryType::MAIN->value, 'order' => 1])->hasAttached(
		Card::factory(state: ['deck_type' => DeckType::NORMAL])->count(58),
		new Sequence(fn($sequence) => ['order' => $sequence->index + 1])
	)->for($deck)->create();
	$main->cards()->attach(Card::factory(state: ['deck_type' => DeckType::NORMAL])->has(Tag::factory()->count(1))->create(), ['order' => 0]);

	Category::factory(state: ['type' => CategoryType::EXTRA->value, 'order' => 2])->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::SIDE->value, 'order' => 3])->for($deck)->create();

	$deck->load('categories.cards');

	$service = new DeckService($deck, $deck->categories->toArray(), true);
	expect(fn() => $service->validateDeck())->toThrow(ValidationException::class, 'is not compatible with your Deck Master');
	// does not happen with loose validation.
	expect(DeckService::isDeckValid($deck, false))->toBe(true);

	// deck master with no tags is valid with any card.
	$deck = Deck::factory()->create();
	Category::factory(state: ['type' => CategoryType::DECK_MASTER->value, 'order' => 0])->hasAttached(
		Card::factory(state: ['type' => CardType::MONSTER, 'deck_type' => DeckType::RITUAL])->count(1),
		['order' => 0]
	)->for($deck)->create();

	$main = Category::factory(state: ['type' => CategoryType::MAIN->value, 'order' => 1])->hasAttached(
		Card::factory(state: ['deck_type' => DeckType::NORMAL])->count(58),
		new Sequence(fn($sequence) => ['order' => $sequence->index + 1])
	)->for($deck)->create();
	$main->cards()->attach(Card::factory(state: ['deck_type' => DeckType::NORMAL])->has(Tag::factory()->count(1))->create(), ['order' => 0]);

	Category::factory(state: ['type' => CategoryType::EXTRA->value, 'order' => 2])->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::SIDE->value, 'order' => 3])->for($deck)->create();

	$deck->load('categories.cards');

	expect(DeckService::isDeckValid($deck))->toBe(true);

	// cards with no tags are valid with any deck master.
	$deck = Deck::factory()->create();
	Category::factory(state: ['type' => CategoryType::DECK_MASTER->value, 'order' => 0])->hasAttached(
		Card::factory(state: ['type' => CardType::MONSTER, 'deck_type' => DeckType::RITUAL])->has(
			Tag::factory()->count(1)
		)->count(1),
		['order' => 0]
	)->for($deck)->create();

	Category::factory(state: ['type' => CategoryType::MAIN->value, 'order' => 1])->hasAttached(
		Card::factory(state: ['deck_type' => DeckType::NORMAL])->count(59),
		new Sequence(fn($sequence) => ['order' => $sequence->index])
	)->for($deck)->create();

	Category::factory(state: ['type' => CategoryType::EXTRA->value, 'order' => 2])->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::SIDE->value, 'order' => 3])->for($deck)->create();

	$deck->load('categories.cards');
	expect(DeckService::isDeckValid($deck, true))->toBe(true);

	// if cards have the same at least one of the same tags then they are valid.
	$deck = Deck::factory()->create();
	$tag = Tag::factory()->create();
	$dm = Card::factory(state: ['type' => CardType::MONSTER, 'deck_type' => DeckType::RITUAL])->has(
		Tag::factory()->count(random_int(2, 10))
	)->create();
	$dm->tags()->attach($tag);

	$dm_category = Category::factory(state: ['type' => CategoryType::DECK_MASTER->value, 'order' => 0])->for($deck)->create();
	$dm_category->cards()->attach($dm, ['order' => 0]);

	$main = Category::factory(state: ['type' => CategoryType::MAIN->value, 'order' => 1])->hasAttached(
		Card::factory(state: ['deck_type' => DeckType::NORMAL])->count(58),
		new Sequence(fn($sequence) => ['order' => $sequence->index + 1])
	)->for($deck)->create();

	$test_card = Card::factory(state: ['deck_type' => DeckType::NORMAL])->has(Tag::factory()->count(random_int(2, 10)))->create();
	$test_card->tags()->attach($tag);
	$main->cards()->attach($test_card, ['order' => 0]);

	Category::factory(state: ['type' => CategoryType::EXTRA->value, 'order' => 2])->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::SIDE->value, 'order' => 3])->for($deck)->create();

	$deck->load('categories.cards');
	expect(DeckService::isDeckValid($deck, true))->toBe(true);
});

test('a deck may only have one legendary card per card type', function() {
	// monsters
	$deck = Deck::factory()->create();
	Category::factory(state: ['type' => CategoryType::DECK_MASTER->value, 'order' => 0])->hasAttached(
		Card::factory(state: ['type' => CardType::MONSTER, 'deck_type' => DeckType::RITUAL])->count(1),
		['order' => 0]
	)->for($deck)->create();

	$main = Category::factory(state: ['type' => CategoryType::MAIN->value, 'order' => 1])->hasAttached(
		Card::factory(state: ['deck_type' => DeckType::NORMAL])->count(57),
		new Sequence(fn($sequence) => ['order' => $sequence->index + 2])
	)->for($deck)->create();

	$main->cards()->attach(Card::factory(state: [
		'deck_type' => DeckType::NORMAL,
		'type' => CardType::MONSTER,
		'legendary' => true
	])->create(), ['order' => 0]);
	$main->cards()->attach(Card::factory(state: [
		'deck_type' => DeckType::NORMAL,
		'type' => CardType::MONSTER,
		'legendary' => true
	])->create(), ['order' => 1]);

	Category::factory(state: ['type' => CategoryType::EXTRA->value, 'order' => 2])->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::SIDE->value, 'order' => 3])->for($deck)->create();

	$deck->load('categories.cards');

	$service = new DeckService($deck, $deck->categories->toArray(), true);
	expect(fn() => $service->validateDeck())->toThrow(ValidationException::class, 'You cannot have more than one Legendary ' . CardType::MONSTER->value . ' in your deck.');
	// does not happen with loose validation.
	expect(DeckService::isDeckValid($deck, false))->toBe(true);

	// spells
	$deck = Deck::factory()->create();
	Category::factory(state: ['type' => CategoryType::DECK_MASTER->value, 'order' => 0])->hasAttached(
		Card::factory(state: ['type' => CardType::MONSTER, 'deck_type' => DeckType::RITUAL])->count(1),
		['order' => 0]
	)->for($deck)->create();

	$main = Category::factory(state: ['type' => CategoryType::MAIN->value, 'order' => 1])->hasAttached(
		Card::factory(state: ['deck_type' => DeckType::NORMAL])->count(57),
		new Sequence(fn($sequence) => ['order' => $sequence->index + 2])
	)->for($deck)->create();

	$main->cards()->attach(Card::factory(state: [
		'deck_type' => DeckType::NORMAL,
		'type' => CardType::SPELL,
		'legendary' => true
	])->create(), ['order' => 0]);
	$main->cards()->attach(Card::factory(state: [
		'deck_type' => DeckType::NORMAL,
		'type' => CardType::SPELL,
		'legendary' => true
	])->create(), ['order' => 1]);

	Category::factory(state: ['type' => CategoryType::EXTRA->value, 'order' => 2])->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::SIDE->value, 'order' => 3])->for($deck)->create();

	$deck->load('categories.cards');

	$service = new DeckService($deck, $deck->categories->toArray(), true);
	expect(fn() => $service->validateDeck())->toThrow(ValidationException::class, 'You cannot have more than one Legendary ' . CardType::SPELL->value . ' in your deck.');
	// does not happen with loose validation.
	expect(DeckService::isDeckValid($deck, false))->toBe(true);

	// traps
	$deck = Deck::factory()->create();
	Category::factory(state: ['type' => CategoryType::DECK_MASTER->value, 'order' => 0])->hasAttached(
		Card::factory(state: ['type' => CardType::MONSTER, 'deck_type' => DeckType::RITUAL])->count(1),
		['order' => 0]
	)->for($deck)->create();

	$main = Category::factory(state: ['type' => CategoryType::MAIN->value, 'order' => 1])->hasAttached(
		Card::factory(state: ['deck_type' => DeckType::NORMAL])->count(57),
		new Sequence(fn($sequence) => ['order' => $sequence->index + 2])
	)->for($deck)->create();

	$main->cards()->attach(Card::factory(state: [
		'deck_type' => DeckType::NORMAL,
		'type' => CardType::TRAP,
		'legendary' => true
	])->create(), ['order' => 0]);
	$main->cards()->attach(Card::factory(state: [
		'deck_type' => DeckType::NORMAL,
		'type' => CardType::TRAP,
		'legendary' => true
	])->create(), ['order' => 1]);

	Category::factory(state: ['type' => CategoryType::EXTRA->value, 'order' => 2])->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::SIDE->value, 'order' => 3])->for($deck)->create();

	$deck->load('categories.cards');

	$service = new DeckService($deck, $deck->categories->toArray(), true);
	expect(fn() => $service->validateDeck())->toThrow(ValidationException::class, 'You cannot have more than one Legendary ' . CardType::TRAP->value . ' in your deck.');
	// does not happen with loose validation.
	expect(DeckService::isDeckValid($deck, false))->toBe(true);

	// can have one of each legendary card type
	$deck = Deck::factory()->create();
	Category::factory(state: ['type' => CategoryType::DECK_MASTER->value, 'order' => 0])->hasAttached(
		Card::factory(state: ['type' => CardType::MONSTER, 'deck_type' => DeckType::RITUAL])->count(1),
		['order' => 0]
	)->for($deck)->create();

	$main = Category::factory(state: ['type' => CategoryType::MAIN->value, 'order' => 1])->hasAttached(
		Card::factory(state: ['deck_type' => DeckType::NORMAL])->count(56),
		new Sequence(fn($sequence) => ['order' => $sequence->index + 3])
	)->for($deck)->create();

	$main->cards()->attach(Card::factory(state: [
		'deck_type' => DeckType::NORMAL,
		'type' => CardType::MONSTER,
		'legendary' => true
	])->create(), ['order' => 0]);
	$main->cards()->attach(Card::factory(state: [
		'deck_type' => DeckType::NORMAL,
		'type' => CardType::SPELL,
		'legendary' => true
	])->create(), ['order' => 1]);
	$main->cards()->attach(Card::factory(state: [
		'deck_type' => DeckType::NORMAL,
		'type' => CardType::TRAP,
		'legendary' => true
	])->create(), ['order' => 1]);

	Category::factory(state: ['type' => CategoryType::EXTRA->value, 'order' => 2])->for($deck)->create();
	Category::factory(state: ['type' => CategoryType::SIDE->value, 'order' => 3])->for($deck)->create();

	$deck->load('categories.cards');
	expect(DeckService::isDeckValid($deck))->toBe(true);
});

test('syncDeck creates a valid deck', function () {
	$deck = Deck::factory()->create();
	Category::factory()->state(['type' => CategoryType::DECK_MASTER->value, 'order' => 0])
		->hasAttached(
			Card::factory()->state([
				'type' => CardType::MONSTER,
				'deck_type' => DeckType::RITUAL
			])->count(1),
			['order' => 0]
		)
		->for($deck)
		->create();

	Category::factory()->state(['type' => CategoryType::MAIN->value, 'order' => 1])
		->hasAttached(
			Card::factory()->state(['deck_type' => DeckType::NORMAL])->count(59),
			new Sequence(fn($sequence) => ['order' => $sequence->index])
		)
		->for($deck)
		->create();
	Category::factory()->state(['type' => CategoryType::EXTRA->value, 'order' => 2])
		->for($deck)
		->create();
	Category::factory()->state(['type' => CategoryType::SIDE->value, 'order' => 3])
		->for($deck)
		->create();

	$deck->load('categories.cards');
	expect(DeckService::isDeckValid($deck))->toBe(true);

	$new_deck = Deck::factory()->create();
	expect(fn() => DeckService::syncDeck($new_deck, $deck->categories->toArray()))->not->toThrow(ValidationException::class);

	$new_deck->load('categories.cards');
	expect($new_deck->categories->count())->toBe(4);
	expect(DeckService::isDeckValid($new_deck))->toBe(true);
	$this->assertDatabaseHas('decks', ['id' => $new_deck->id]);
	$this->assertDatabaseHas('categories', ['id' => $new_deck->categories->first()->id, 'name' => $deck->categories->first()->name]);
});

test('syncDeck throws ValidationException when deck is invalid', function () {
	$deck = Deck::factory()->create();
	Category::factory()->state(['type' => CategoryType::DECK_MASTER->value, 'order' => 0])
		->hasAttached(
			Card::factory()->state([
				'type' => CardType::MONSTER,
				'deck_type' => DeckType::RITUAL
			])->count(1),
			['order' => 0]
		)
		->for($deck)
		->create();

	Category::factory()->state(['type' => CategoryType::MAIN->value, 'order' => 1])
		->hasAttached(
			Card::factory()->state(['deck_type' => DeckType::NORMAL])->count(59),
			new Sequence(fn($sequence) => ['order' => $sequence->index])
		)
		->for($deck)
		->create();
	Category::factory()->state(['type' => CategoryType::EXTRA->value, 'order' => 2])
		->for($deck)
		->create();
	Category::factory()->state(['type' => CategoryType::SIDE->value, 'order' => 3])
		->for($deck)
		->create();

	$deck->load('categories.cards');
	expect(DeckService::isDeckValid($deck))->toBe(true);

	$new_categories = $deck->categories->toArray();
	unset($new_categories[0]);
	expect(fn() => DeckService::syncDeck($deck, $new_categories))->toThrow(ValidationException::class);
});

test('syncDeck adds new card when categories contains a new card', function () {
	$deck = Deck::factory()->create();
	Category::factory()->state(['type' => CategoryType::DECK_MASTER->value, 'order' => 0])
		->hasAttached(
			Card::factory()->state([
				'type' => CardType::MONSTER,
				'deck_type' => DeckType::RITUAL
			])->count(1),
			['order' => 0]
		)
		->for($deck)
		->create();

	Category::factory()->state(['type' => CategoryType::MAIN->value, 'order' => 1])
		->hasAttached(
			Card::factory()->state(['deck_type' => DeckType::NORMAL])->count(59),
			new Sequence(fn($sequence) => ['order' => $sequence->index])
		)
		->for($deck)
		->create();
	Category::factory()->state(['type' => CategoryType::EXTRA->value, 'order' => 2])
		->for($deck)
		->create();
	Category::factory()->state(['type' => CategoryType::SIDE->value, 'order' => 3])
		->for($deck)
		->create();

	$deck->load('categories.cards');
	expect(DeckService::isDeckValid($deck))->toBe(true);

	// add a card to the side deck
	$card = Card::factory()->create();
	$new_categories = $deck->categories->toArray();
	$new_categories[count($new_categories) - 1]['cards'][] = $card->id;
	expect(fn() => DeckService::syncDeck($deck, $new_categories))->not->toThrow(ValidationException::class);
	$this->assertDatabaseHas($card->categories()->getTable(), [
		'card_id' => $card->id,
		'category_id' => $deck->categories()->where('type', CategoryType::SIDE->value)->value('id'),
		'order' => 0
	]);
});

test('syncDeck remove card when it\'s no longer in its category', function () {
	$deck = Deck::factory()->create();
	Category::factory()->state(['type' => CategoryType::DECK_MASTER->value, 'order' => 0])
		->hasAttached(
			Card::factory()->state([
				'type' => CardType::MONSTER,
				'deck_type' => DeckType::RITUAL
			])->count(1),
			['order' => 0]
		)
		->for($deck)
		->create();

	Category::factory()->state(['type' => CategoryType::MAIN->value, 'order' => 1])
		->hasAttached(
			Card::factory()->state(['deck_type' => DeckType::NORMAL])->count(59),
			new Sequence(fn($sequence) => ['order' => $sequence->index])
		)
		->for($deck)
		->create();
	Category::factory()->state(['type' => CategoryType::EXTRA->value, 'order' => 2])
		->for($deck)
		->create();
	$side = Category::factory()->state(['type' => CategoryType::SIDE->value, 'order' => 3])
		->for($deck)
		->create();
	$side->cards()->attach(Card::factory()->create(), ['order' => 0]);

	$deck->load('categories.cards');
	expect(DeckService::isDeckValid($deck))->toBe(true);
	$this->assertDatabaseHas($side->cards()->getTable(), [
		'category_id' => $side->id,
		'order' => 0
	]);

	// remove card from the side deck
	$new_categories = $deck->categories->toArray();
	$new_categories[count($new_categories) - 1]['cards'] = [];
	expect(fn() => DeckService::syncDeck($deck, $new_categories))->not->toThrow(ValidationException::class);
	$this->assertDatabaseMissing($side->cards()->getTable(), [
		'category_id' => $deck->categories()->where('type', CategoryType::SIDE->value)->value('id'),
	]);
});

test('syncDeck adds a category to a deck', function () {
	$deck = Deck::factory()->create();
	Category::factory()->state(['type' => CategoryType::DECK_MASTER->value, 'order' => 0])
		->hasAttached(
			Card::factory()->state([
				'type' => CardType::MONSTER,
				'deck_type' => DeckType::RITUAL
			])->count(1),
			['order' => 0]
		)
		->for($deck)
		->create();

	Category::factory()->state(['type' => CategoryType::MAIN->value, 'order' => 1])
		->hasAttached(
			Card::factory()->state(['deck_type' => DeckType::NORMAL])->count(59),
			new Sequence(fn($sequence) => ['order' => $sequence->index])
		)
		->for($deck)
		->create();
	Category::factory()->state(['type' => CategoryType::EXTRA->value, 'order' => 2])
		->for($deck)
		->create();
	Category::factory()->state(['type' => CategoryType::SIDE->value, 'order' => 3])
		->for($deck)
		->create();

	$deck->load('categories.cards');
	expect(DeckService::isDeckValid($deck))->toBe(true);

	// add a new category to the deck
	$new_categories = $deck->categories->toArray();
	$new_categories[count($new_categories) - 2]['order']++;
	$new_categories[count($new_categories) - 1]['order']++;
	$new_categories[] = [
		'id' => fake()->uuid(),
		'name' => fake()->words(asText: true),
		'type' => CategoryType::MAIN->value,
		'order' => 2,
		'cards' => []
	];

	expect(fn() => DeckService::syncDeck($deck, $new_categories))->not->toThrow(ValidationException::class);
	expect($deck->categories()->count())->toBe(5);
});

test('syncDeck removes a category from a deck', function () {
	$deck = Deck::factory()->create();
	Category::factory()->state(['type' => CategoryType::DECK_MASTER->value, 'order' => 0])
		->hasAttached(
			Card::factory()->state([
				'type' => CardType::MONSTER,
				'deck_type' => DeckType::RITUAL
			])->count(1),
			['order' => 0]
		)
		->for($deck)
		->create();

	Category::factory()->state(['type' => CategoryType::MAIN->value, 'order' => 1])
		->hasAttached(
			Card::factory()->state(['deck_type' => DeckType::NORMAL])->count(59),
			new Sequence(fn($sequence) => ['order' => $sequence->index])
		)
		->for($deck)
		->create();
	Category::factory()->state(['type' => CategoryType::MAIN->value, 'order' => 1])
		->for($deck)
		->create();
	Category::factory()->state(['type' => CategoryType::EXTRA->value, 'order' => 3])
		->for($deck)
		->create();
	Category::factory()->state(['type' => CategoryType::SIDE->value, 'order' => 4])
		->for($deck)
		->create();

	$deck->load('categories.cards');
	expect(DeckService::isDeckValid($deck))->toBe(true);

	// add a new category to the deck
	$new_categories = $deck->categories->toArray();
	$new_categories[count($new_categories) - 2]['order']--;
	$new_categories[count($new_categories) - 1]['order']--;
	unset($new_categories[count($new_categories) - 3]);

	expect(fn() => DeckService::syncDeck($deck, $new_categories))->not->toThrow(ValidationException::class);
	expect($deck->categories()->count())->toBe(4);
});
