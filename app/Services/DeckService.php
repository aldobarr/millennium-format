<?php

namespace App\Services;

use App\Enums\CardType;
use App\Enums\CategoryType;
use App\Enums\DeckType;
use App\Models\Card;
use App\Models\Category;
use App\Models\Deck;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DeckService {
	public const int MAIN_DECK_CARDS = 60;
	public const int MAX_EXTRA_DECK_CARDS = 15;
	public const int MAX_SIDE_DECK_CARDS = 15;
	public const int DECK_MASTER_MINIMUM_LEVEL = 5;

	private Deck $deck;
	private Card $deckMaster;
	private array $categories;
	private array $categoryTypes = [];
	private bool $strict = false;
	private bool $isValid = false;

	public function __construct(Deck &$deck, array $categories, bool $strict = false) {
		$this->deck = &$deck;
		$this->categories = &$categories;
		$this->strict = $strict;
	}

	public static function syncDeck(Deck &$deck, array $categories, bool $strict = false): void {
		try {
			$service = new static($deck, $categories, $strict);
			$service->validateDeck();
			$service->syncDeckFromCategories();
		} catch (\Exception $e) {
			$error = $e instanceof ValidationException
				? $e->errors()
				: ['Invalid deck provided.'];

			throw ValidationException::withMessages($error);
		}
	}

	public static function syncCards(Category $category, array $cards): void {
		$inserts = [];
		$category->cards()->detach();
		foreach ($cards as $order => $card_id) {
			$inserts[] = ['card_id' => $card_id, 'category_id' => $category->id, 'order' => $order];
		}

		DB::table($category->cards()->getTable())->insert($inserts);
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

	public function validateDeck(): void {
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
			$main_deck_cards += $this->validateCategory($category);
			$deck_card_ids = $this->merge($deck_card_ids, $category['cards']);
		}

		$deck_cards = Card::with('tags')->whereIn('id', array_keys($deck_card_ids))->get()->keyBy('id');
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

	private function validateCategory($category) {
		$type = CategoryType::from($category['type']);
		if (!array_key_exists($type->value, $this->categoryTypes)) {
			$this->categoryTypes[$type->value] = 0;
		}

		$this->categoryTypes[$type->value]++;
		if ($type !== CategoryType::MAIN && $this->categoryTypes[$type->value] > 1) {
			throw ValidationException::withMessages(['Only one ' . $type->value . ' category is allowed.']);
		}

		if ($type === CategoryType::DECK_MASTER) {
			if (count($category['cards']) > 1 || (count($category['cards']) !== 1 && $this->strict)) {
				throw ValidationException::withMessages(['Your Deck Master category must contain exactly one card.']);
			}

			$this->deckMaster = Card::with('tags')->where('id', $category['cards'][0])->first();
			return 1;
		}

		if ($type === CategoryType::EXTRA) {
			if (count($category['cards']) > static::MAX_EXTRA_DECK_CARDS && $this->strict) {
				throw ValidationException::withMessages(['Your Extra Deck may not contain more than ' . static::MAX_EXTRA_DECK_CARDS . ' cards.']);
			}

			return 0;
		}

		if ($type === CategoryType::SIDE) {
			if (count($category['cards']) > static::MAX_SIDE_DECK_CARDS && $this->strict) {
				throw ValidationException::withMessages(['Your Side Deck may not contain more than ' . static::MAX_SIDE_DECK_CARDS . ' cards.']);
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
			foreach ($category['cards'] as $card_id) {
				$card = $deck_cards->get($card_id);
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
		if (!$this->deckMaster && $this->strict) {
			// It should be impossible for deck master to be empty while strict checking at this point anyway
			throw ValidationException::withMessages(['Your deck must have a Deck Master.']);
		}

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

			if ($card->legendary) {
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
}
