<?php

namespace App\Http\Controllers;

use App\Enums\CardType;
use App\Enums\DeckType;
use App\Http\Requests\SaveDeck;
use App\Http\Resources\CardCollection;
use App\Http\Resources\DeckCollection;
use App\Http\Resources\DeckDownloadResource;
use App\Http\Resources\DeckResource;
use App\Models\Card;
use App\Models\Category;
use App\Models\Deck;
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
		$search_term = $request->input('term');
		$search = Card::where(function(Builder $query) use ($search_term) {
			$tags = array_map('trim', explode(',', $search_term));
			if (!empty($search_term)) {
				$query->whereLike('name', '%' . $search_term . '%')->orWhereHas('tags', function(Builder $q) use ($tags) {
					$q->whereAny('name', $tags);
				});
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

		if ($request->has('properties')) {
			$properties = $request->input('properties', []);
			if (!empty($properties)) {
				$search->where(function(Builder $query) use ($properties) {
					$query->whereNotNull('property')->whereIn('property', $properties);
				});
			}
		}

		if ($request->has('max_level')) {
			$level = $request->input('max_level', 0);
			$search->where(function(Builder $query) use ($level) {
				$query->whereNull('level')->orWhere('level', '<=', $level);
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

	public function decks(Request $request, int $code = Response::HTTP_OK) {
		$decks = $request->user()->decks()->orderBy('id')->paginate()->withQueryString();
		return (new DeckCollection($decks))->response()->setStatusCode($code);
	}

	public function getDeck(Deck $deck) {
		return new DeckResource($deck);
	}

	public function downloadDeck(Deck $deck) {
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

			$deck->categories->map(function($category) use (&$new_deck) {
				$new_category = new Category;
				$new_category->uuid = Str::uuid()->toString();
				$new_category->name = $category->name;
				$new_category->type = $category->type;
				$new_category->deck_id = $new_deck->id;
				$new_category->order = $category->order;
				$new_category->save();

				DeckService::syncCards($new_category, $category->cards()->pluck('id')->toArray());
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
}
