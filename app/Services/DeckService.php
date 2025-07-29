<?php

namespace App\Services;

use App\Enums\CardType;
use App\Enums\CategoryType;
use App\Enums\DeckType;
use App\Models\Card;
use App\Models\CardAlternate;
use App\Models\Category;
use App\Models\Deck;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DeckService {
	public const int MAIN_DECK_CARDS = 60;
	public const int MAX_EXTRA_DECK_CARDS = 15;
	public const int MAX_SIDE_DECK_CARDS = 15;
	public const int DECK_MASTER_MINIMUM_LEVEL = 5;

	private Deck $deck;
	private Card|null $deckMaster;
	private array $categories;
	private array $categoryTypes = [];
	private bool $strict = false;
	private bool $isValid = false;

	public function __construct(Deck &$deck, array $categories, bool $strict = false) {
		$this->deck = &$deck;
		$this->categories = $this->standardize($categories);
		$this->strict = $strict;
	}

	public static function isDeckValid(Deck &$deck, bool $strict = true): bool {
		$deck->loadMissing('categories.cards.tags');
		$service = new static($deck, $deck->categories->toArray(), $strict);

		try {
			$service->validateDeck();
		} catch (\Exception) {}

		return $service->isValid;
	}

	public static function syncDeck(Deck &$deck, array $categories, bool $strict = false): void {
		try {
			$service = new static($deck, $categories, $strict);
			$service->validateDeck(true);
			$service->syncDeckFromCategories();
		} catch (\Exception $e) {
			$error = $e instanceof ValidationException ? $e->errors() : ['Invalid deck provided.'];
			throw ValidationException::withMessages($error);
		}
	}

	public static function syncCards(Category $category, array $cards): void {
		$inserts = [];
		$category->cards()->detach();
		foreach ($cards as $order => $card) {
			$inserts[] = [
				'card_id' => $card['id'],
				'category_id' => $category->id,
				'order' => $order,
				'card_alternate_id' => $card['alternate']
			];
		}

		DB::table($category->cards()->getTable())->insert($inserts);
	}

	public static function exportDeckToYGOPro(Deck &$deck): string {
		$deck->load('categories.cards.alternates');
		$service = new DeckService($deck, $deck->categories->toArray(), true);
		return $service->encodeDeckToYGOPro();
	}

	public static function alternatesToCards(array $deck): array {
		$alt_ids = [];
		foreach ($deck as $category) {
			if (empty($category['cards'])) {
				continue;
			}

			foreach ($category['cards'] as $card) {
				$alt_ids[] = $card;
			}
		}

		$alts = CardAlternate::whereIn('id', $alt_ids)->get()->keyBy('id');
		foreach ($deck as $cat => $category) {
			if (empty($category['cards'])) {
				continue;
			}

			foreach ($category['cards'] as $idx => $card) {
				$deck[$cat]['cards'][$idx] = ['id' => $alts->get($card)?->card_id ?? null, 'alternate' => null];
			}
		}

		return $deck;
	}

	public static function cardToPasscode(Card $card): string {
		if ($card->is_errata) {
			return $card->passcode;
		}

		if ($card->pivot && $card->pivot->card_alternate_id) {
			return $card->alternates->firstWhere('id', $card->pivot->card_alternate_id)->passcode ?? $card->passcode;
		}

		return $card->passcode;
	}

	public function encodeDeckToYGOPro(): string {
		$strict = $this->strict;

		try {
			$this->strict = true;
			$this->validateDeck();
		} catch (\Exception) {
			throw ValidationException::withMessages(['Only valid decks are eligible for export.']);
		} finally {
			$this->strict = $strict;
		}

		$main = $extra = $side = '';
		foreach ($this->deck->categories as $category) {
			$cards = $category->cards->reduce(fn(string|null $cards, Card $card) => ($cards ?? '') . pack('V', static::cardToPasscode($card))) ?? '';
			switch ($category->type) {
				case CategoryType::EXTRA:
					$extra = $cards;
					break;

				case CategoryType::SIDE:
					$side = $cards;
					break;

				default:
					$main .= $cards;
					break;
			}
		}

		return 'ydke://' . base64_encode($main) . '!' . base64_encode($extra) . '!' . base64_encode($side) . '!';
	}

	public function syncDeckFromCategories(): void {
		if (!$this->isValid) {
			throw ValidationException::withMessages(['Invalid deck detected.']);
		}

		$category_ids = [];
		foreach ($this->categories as $cat) {
			$category = $this->deck->categories()->updateOrCreate(
				['uuid' => $cat['id']],
				[
					'name' => $cat['name'],
					'type' => CategoryType::from($cat['type']),
					'order' => $cat['order'],
				]
			);

			$category_ids[] = $category->id;
			static::syncCards($category, $cat['cards']);
		}

		$this->deck->categories()->whereNotIn('id', $category_ids)->delete();
	}

	public function validateDeck(bool $needs_load_cards = false): void {
		$errors = [];
		$main_deck_cards = 0;

		$category_ids = [];
		$deck_card_ids = [];
		foreach ($this->categories as $category) {
			if (in_array($category['id'], $category_ids)) {
				// This should be impossible under normal use so a generic error message is okay.
				throw ValidationException::withMessages(['This deck has invalid categories.']);
			}

			$category_ids[] = $category['id'];
			$main_deck_cards += $this->validateCategory($category, $needs_load_cards);
			$deck_card_ids = $this->merge($deck_card_ids, array_map(fn($card) => $card['id'], $category['cards']));
		}

		if (
			empty($this->categoryTypes[CategoryType::DECK_MASTER->value]) ||
			empty($this->categoryTypes[CategoryType::EXTRA->value]) ||
			empty($this->categoryTypes[CategoryType::SIDE->value])
		) {
			throw ValidationException::withMessages(['Your deck must have a Deck Master, Extra Deck, and Side Deck category.']);
		}

		$deck_cards = $this->getDeckCards($needs_load_cards ? $deck_card_ids : null);
		if ($main_deck_cards !== static::MAIN_DECK_CARDS && $this->strict) {
			$errors[] = 'Your Main Deck must contain exactly ' . static::MAIN_DECK_CARDS . ' cards including the Deck Master.';
		}

		$errors = array_merge($errors, $this->validateCategoryCards($deck_cards));
		$errors = array_merge($errors, $this->validateDeckCards($deck_card_ids, $deck_cards));
		if (!empty($errors)) {
			throw ValidationException::withMessages($errors);
		}

		$this->isValid = true;
	}

	private function validateCategory($category, $needs_load_cards = false): int {
		$type = CategoryType::from($category['type']);
		if (!array_key_exists($type->value, $this->categoryTypes)) {
			$this->categoryTypes[$type->value] = 0;
		}

		$this->categoryTypes[$type->value]++;
		if ($type !== CategoryType::MAIN && $this->categoryTypes[$type->value] > 1) {
			$suffix = $type !== CategoryType::DECK_MASTER ? ' Deck' : '';
			throw ValidationException::withMessages(['Only one ' . $type->value . $suffix . ' category is allowed.']);
		}

		if ($type === CategoryType::DECK_MASTER) {
			if (count($category['cards']) > 1 || (count($category['cards']) !== 1 && $this->strict)) {
				throw ValidationException::withMessages(['Your Deck Master category must contain exactly one card.']);
			}

			if ($category['order'] !== 0) {
				throw ValidationException::withMessages(['Your Deck Master category must be the first category.']);
			}

			$this->deckMaster = $needs_load_cards
				? Card::with('tags')->where('id', $category['cards'][0]['id'] ?? 0)->first()
				: $this->deck->categories->firstWhere('type', CategoryType::DECK_MASTER)->cards->first();

			return 1;
		}

		if ($type === CategoryType::EXTRA) {
			if (count($category['cards']) > static::MAX_EXTRA_DECK_CARDS && $this->strict) {
				throw ValidationException::withMessages(['Your Extra Deck may not contain more than ' . static::MAX_EXTRA_DECK_CARDS . ' cards.']);
			}

			if ($category['order'] !== count($this->categories) - 2) {
				throw ValidationException::withMessages(['Your Extra Deck category must be the second to last category.']);
			}

			return 0;
		}

		if ($type === CategoryType::SIDE) {
			if (count($category['cards']) > static::MAX_SIDE_DECK_CARDS && $this->strict) {
				throw ValidationException::withMessages(['Your Side Deck may not contain more than ' . static::MAX_SIDE_DECK_CARDS . ' cards.']);
			}

			if ($category['order'] !== count($this->categories) - 1) {
				throw ValidationException::withMessages(['Your Side Deck category must be the last category.']);
			}

			return 0;
		}

		return count($category['cards']);
	}

	/**
	 * Validate that all cards in the categories can be in their category's type.
	 *
	 * @param Collection<int, Card> $deck_cards
	 * @return array
	 */
	private function validateCategoryCards(Collection $deck_cards): array {
		$errors = [];
		foreach ($this->categories as $category) {
			$category_type = CategoryType::from($category['type']);
			foreach ($category['cards'] as $card) {
				$card = $deck_cards->get($card['id']);
				switch ($card->deck_type) {
					case DeckType::NORMAL:
						if ($category_type === CategoryType::EXTRA) {
							$errors[] = $card->name . ' cannot be in the extra deck.';
						}
						break;
					case DeckType::EXTRA:
						if ($category_type === CategoryType::MAIN) {
							$errors[] = $card->name . ' cannot be in the main deck.';
						}
						break;
				}

				if ($card->type !== CardType::MONSTER) {
					if ($category_type === CategoryType::DECK_MASTER) {
						$errors[] = $card->name . ' (' . $card->type->value . ' Card) cannot be a Deck Master.';
					} else if ($category_type === CategoryType::EXTRA) {
						$errors[] = $card->name . ' (' . $card->type->value . ' Card) cannot be in the Extra Deck.';
					}
				}

				if (
					$category_type === CategoryType::DECK_MASTER &&
					$card->deck_type === DeckType::NORMAL &&
					(
						empty($card->level) || $card->level < static::DECK_MASTER_MINIMUM_LEVEL
					)
				) {
					$errors[] = $card->name . ' cannot be a Deck Master.';
				}
			}
		}

		return $errors;
	}

	/**
	 * Validate the deck's cards against the Deck Master and their limits.
	 *
	 * @param array $deck_card_ids
	 * @param Collection<int, Card> $deck_cards
	 * @return bool
	 */
	private function validateDeckCards(array $deck_card_ids, Collection $deck_cards): array {
		$legendaries = $errors = [];
		$deck_cards->each(function(Card $card) use (&$deck_card_ids, &$legendaries, &$errors) {
			if ($deck_card_ids[$card->id] > $card->limit) {
				$errors[] = 'You cannot have more than ' . $card->limit . ' copies of "' . $card->name . '".';
			}

			if ($this->deckMaster && $this->strict) {
				$dm_tags = $this->deckMaster->tags->pluck('id')->toArray();
				$card_tags = $card->tags->pluck('id')->toArray();
				if (!empty($card_tags) && !empty($dm_tags) && empty(array_intersect($card_tags, $dm_tags))) {
					$errors[] = '"' . $card->name . '" is not compatible with your Deck Master "' . $this->deckMaster->name . '".';
				}
			}

			if ($card->legendary && $this->strict) {
				if (array_key_exists($card->type->value, $legendaries)) {
					$errors[] = 'You cannot have more than one Legendary ' . $card->type->value . ' in your deck.';
				}

				$legendaries[$card->type->value] = true;
			}
		});

		return $errors;
	}

	private function merge(array $deck_card_ids, array $category_card_ids): array {
		foreach ($category_card_ids as $card_id) {
			if (!array_key_exists($card_id, $deck_card_ids)) {
				$deck_card_ids[$card_id] = 0;
			}

			$deck_card_ids[$card_id]++;
		}

		return $deck_card_ids;
	}

	private function standardize(array $categories): array {
		$getAlternate = function($card) {
			if (isset($card['alternate'])) {
				if (is_array($card['alternate'])) {
					return $card['alternate']['id'] ?? null;
				}

				return $card['alternate'];
			}

			if (isset($card['alternates']) && is_array($card['alternates']) && !empty($card['alternates']) && isset($card['pivot']) && !empty($card['pivot']['card_alternate_id'])) {
				return array_find($card['alternates'], fn($alt) => $alt['id'] === $card['pivot']['card_alternate_id'])['id'] ?? null;
			}

			return null;
		};

		foreach ($categories as $key => $category) {
			if (empty($category['cards']) || !is_array($category['cards'][0])) {
				continue;
			}

			$categories[$key]['cards'] = array_map(fn($card) => [
				'id' => $card['id'],
				'alternate' => $getAlternate($card),
			], $category['cards']);
		}

		return $categories;
	}

	private function getDeckCards(array | null $deck_card_ids = null): Collection {
		if ($deck_card_ids !== null) {
			return Card::with('tags')->whereIn('id', array_keys($deck_card_ids))->get()->keyBy('id');
		}

		return $this->deck->categories->flatMap(fn(Category $category) => $category->cards)->keyBy('id');
	}
}
