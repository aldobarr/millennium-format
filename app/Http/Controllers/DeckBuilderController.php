<?php

namespace App\Http\Controllers;

use App\Enums\CardType;
use App\Enums\CategoryType;
use App\Enums\DeckType;
use App\Http\Requests\DeckImage;
use App\Http\Requests\SaveDeck;
use App\Http\Requests\ValidateDeck;
use App\Http\Resources\CardCollection;
use App\Http\Resources\DeckCollection;
use App\Http\Resources\DeckDownloadResource;
use App\Http\Resources\DeckResource;
use App\Models\Card;
use App\Models\CardAlternate;
use App\Models\Category;
use App\Models\Deck;
use App\Models\MonsterType;
use App\Models\Tag;
use App\Services\DeckService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

class DeckBuilderController extends Controller {
	public const int RESULTS_PER_PAGE = 15;

	public function search(Request $request) {
		$search_term = $request->input('term', '');
		$search = Card::with('alternates')->where(function(Builder $query) use ($search_term) {
			$tags = array_map('trim', explode(',', $search_term));
			if (!empty($search_term)) {
				$query->whereLike('name', '%' . $search_term . '%')->orWhereHas('tags', function(Builder $q) use ($tags) {
					$q->whereArrayAny('name', $tags);
				})->orWhereLike('description', '%' . $search_term . '%');
			}
		});

		if ($request->has('exclude_monsters')) {
			$search->where('type', '!=', CardType::MONSTER);
		}

		if ($request->has('exclude_spells')) {
			$search->where('type', '!=', CardType::SPELL);
		}

		if ($request->has('exclude_traps')) {
			$search->where('type', '!=', CardType::TRAP);
		}

		if ($request->has('exclude_non_legendaries')) {
			$search->where(function(Builder $query) {
				$query->where('legendary', true);
			});
		}

		if ($request->has('properties')) {
			$properties = $request->input('properties', []);
			if (!empty($properties)) {
				$search->where(function(Builder $query) use ($properties) {
					$query->whereNotNull('property')->whereIn('property', $properties);
				});
			}
		}

		if ($request->has('attributes')) {
			$attributes = $request->input('attributes', []);
			if (!empty($attributes)) {
				$search->where(function(Builder $query) use ($attributes) {
					$query->whereNotNull('attribute')->whereIn('attribute', $attributes);
				});
			}
		}

		if ($request->has('monster_types')) {
			$types = $request->input('monster_types', []);
			$all = boolval($request->input('match_all_monster_types', false));
			$invert = boolval($request->input('invert_monster_types', false));
			if (!empty($types)) {
				$search->where(function(Builder $query) use ($types, $all, $invert) {
					if ($all && !$invert) {
						foreach ($types as $type) {
							$query->whereHas('monsterTypes', function(Builder $q) use ($type) {
								$q->where('id', $type);
							});
						}
					} else {
						if ($invert) {
							$query->whereDoesntHave('monsterTypes', function(Builder $q) use ($types) {
								$q->whereIn('id', $types);
							});
						} else {
							$query->whereHas('monsterTypes', function(Builder $q) use ($types, $invert) {
								$q->whereIn('id', $types);
							});
						}
					}
				});
			}
		}

		if ($request->has('max_level')) {
			$level = $request->input('max_level', 0);
			$search->where(function(Builder $query) use ($level) {
				$query->whereNull('level')->orWhere('level', '<=', $level);
			});
		}

		if ($request->has('limit')) {
			$limit = $request->input('limit', 1);
			$limit_by = match ($request->input('limit_by', '=')) {
				'>' => '>',
				'>=' => '>=',
				'<' => '<',
				'<=' => '<=',
				'!=' => '!=',
				'<>' => '!=',
				default => '=',
			};

			$search->where(function(Builder $query) use ($limit, $limit_by) {
				$query->where('limit', $limit_by, $limit);
			});
		}

		if ($request->has('min_atk')) {
			$atk = $request->input('min_atk', 0);
			$search->where(function(Builder $query) use ($atk) {
				$query->whereNotNull('attack')->where('attack', '>=', $atk);
			});
		}

		if ($request->has('max_atk')) {
			$atk = $request->input('max_atk', 0);
			$search->where(function(Builder $query) use ($atk) {
				$query->whereNotNull('attack')->where('attack', '<=', $atk);
			});
		}

		if ($request->has('min_def')) {
			$def = $request->input('min_def', 0);
			$search->where(function(Builder $query) use ($def) {
				$query->whereNotNull('defense')->where('defense', '>=', $def);
			});
		}

		if ($request->has('max_def')) {
			$def = $request->input('max_def', 0);
			$search->where(function(Builder $query) use ($def) {
				$query->whereNotNull('defense')->where('defense', '<=', $def);
			});
		}

		if ($request->has('dm')) {
			$deck_master_tags = Tag::whereHas('cards', function(Builder $query) use ($request) {
				$query->where('id', $request->input('dm'));
			})->pluck('id')->toArray();

			if (!empty($deck_master_tags)) {
				$search->where(function(Builder $query) use ($deck_master_tags) {
					$query->doesntHave('tags')->orWhereHas('tags', function(Builder $q) use ($deck_master_tags) {
						$q->whereIn('id', $deck_master_tags);
					});
				});
			}
		}

		$per_page = $request->input('per_page', static::RESULTS_PER_PAGE);
		return new CardCollection($search->paginate(perPage: $per_page)->onEachSide(2)->withQueryString());
	}

	public function deckMasters() {
		$cards = Card::select('id', 'name')->where(function(Builder $query) {
			$query->where('type', CardType::MONSTER)->where(function(Builder $q) {
				$q->where('level', '>=', DeckService::DECK_MASTER_MINIMUM_LEVEL)->orWhere('deck_type', '!=', DeckType::NORMAL);
			});
		})->orderBy('name')->get();

		return response()->json(['success' => true, 'data' => $cards->toArray()], Response::HTTP_OK);
	}

	public function monsterTypes() {
		$types = MonsterType::orderBy('type')->get(['id', 'type']);
		return response()->json(['success' => true, 'data' => $types->toArray()], Response::HTTP_OK);
	}

	public function decks(Request $request, int $code = Response::HTTP_OK) {
		$decks = $request->user()->decks()->with('categories.cards.alternates')->orderBy('id')->paginate()->withQueryString();
		return (new DeckCollection($decks))->response()->setStatusCode($code);
	}

	public function getDeck(Deck $deck) {
		$deck->load('categories.cards.alternates');
		return new DeckResource($deck);
	}

	public function downloadDeck(Deck $deck) {
		$deck->load('categories.cards.alternates');
		return new DeckDownloadResource($deck);
	}

	public function exportDeck(Deck $deck) {
		return response()->json([
			'success' => true,
			'data' => DeckService::exportDeckToYGOPro($deck)
		]);
	}

	public function createDeck(SaveDeck $request) {
		$deck = new Deck;
		DB::transaction(function() use (&$deck, &$request) {
			$deck->name = $request->input('name');
			if ($request->has('notes')) {
				$deck->notes = $request->input('notes');
			}

			$deck->user_id = $request->user()->id;
			$deck->save();

			DeckService::syncDeck($deck, $request->input('categories'));
		});

		return response()->json(['success' => true, 'data' => $deck->id], Response::HTTP_CREATED);
	}

	public function importDeck(SaveDeck $request) {
		$deck = new Deck;
		$new_name = $request->input('name') . ' (' . Deck::where('user_id', $request->user()->id)->whereLike('name', $request->input('name') . '%')->count() + 1 . ')';
		DB::transaction(function() use (&$deck, &$request, $new_name) {
			$deck->name = $new_name;
			if ($request->has('notes')) {
				$deck->notes = $request->input('notes');
			}

			$deck->user_id = $request->user()->id;
			$deck->save();

			DeckService::syncDeck($deck, $request->input('categories'), true);
		});

		return $this->decks($request, Response::HTTP_CREATED);
	}

	public function duplicateDeck(Request $request, Deck $deck) {
		if (!DeckService::isDeckValid($deck)) {
			throw ValidationException::withMessages(['Only valid decks are eligible for duplication.']);
		}

		DB::transaction(function() use (&$deck, &$request) {
			$new_deck = new Deck;
			$new_deck->name = $deck->name;
			$new_deck->notes = $deck->notes;
			$new_deck->user_id = $request->user()->id;
			$new_deck->save();

			$deck->load('categories.cards.alternates');
			$deck->categories->map(function($category) use (&$new_deck) {
				$new_category = new Category;
				$new_category->uuid = Str::uuid()->toString();
				$new_category->name = $category->name;
				$new_category->type = $category->type;
				$new_category->deck_id = $new_deck->id;
				$new_category->order = $category->order;
				$new_category->save();

				DeckService::syncCards($new_category, $category->cards->map(fn($card) => ['id' => $card->id, 'alternate' => $card->pivot?->card_alternate_id ?? null])->toArray());
			})->toArray();
		});

		return $this->decks($request, Response::HTTP_CREATED);
	}

	public function editDeck(SaveDeck $request, Deck $deck) {
		DB::transaction(function() use (&$deck, &$request) {
			if ($request->has('name')) {
				$deck->name = $request->input('name');
			}

			if ($request->has('notes')) {
				$deck->notes = $request->input('notes');
			}

			if ($request->input('delete_notes', false)) {
				$deck->notes = null;
			}

			$deck->save();

			if ($request->has('categories')) {
				DeckService::syncDeck($deck, $request->input('categories'));
			}
		});

		return response()->json(['success' => true, 'data' => []], Response::HTTP_OK);
	}

	public function deleteDeck(Deck $deck) {
		DB::transaction(function() use (&$deck) {
			$deck->categories->map(function($category) {
				$category->cards()->detach();
				$category->delete();
			});

			$deck->delete();
		});

		return response()->json(['success' => true, 'data' => []], Response::HTTP_OK);
	}

	public function validateDeck(ValidateDeck $request) {
		$deck = new Deck;
		(new DeckService($deck, $request->input('categories'), true))->validateDeck(true);

		return response()->json(['success' => true, 'data' => []], Response::HTTP_OK);
	}

	public function getYDKECards(DeckImage $request) {
		$dummy = new Deck;
		$deck = $request->input('deck');

		try {
			(new DeckService($dummy, DeckService::alternatesToCards($deck), true))->validateDeck(true);
		} catch (\Exception) {
			throw ValidationException::withMessages(['deck' => 'This deck is illegal.']);
		}

		$cards = [];
		foreach ($deck as $category) {
			$card_data = CardAlternate::with('card')->whereIn('id', $category['cards'])->get()->keyBy('id');
			$cards[$category['type']] = [];
			foreach ($category['cards'] as $card_id) {
				$art = $card_data->get($card_id);
				$cards[$category['type']][] = [
					'name' => $art->card->name,
					'type' => $art->card->full_type,
					'property' => $art->card->property,
					'attribute' => $art->card->attribute,
					'level' => $art->card->level,
					'attack' => $art->card->attack,
					'defense' => $art->card->defense,
					'description' => $art->card->description,
					'image' => $art->image,
				];
			}
		}

		return response()->json(['success' => true, 'data' => $cards], Response::HTTP_OK);
	}

	public function validateYDKEDeck(ValidateDeck $request) {
		$deck = new Deck;
		(new DeckService($deck, DeckService::alternatesToCards($request->input('deck')), true))->validateDeck(true);

		return response()->json(['success' => true, 'data' => []], Response::HTTP_OK);
	}
}
