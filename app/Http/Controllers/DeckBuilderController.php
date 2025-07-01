<?php

namespace App\Http\Controllers;

use App\Http\Requests\SaveDeck;
use App\Http\Resources\CardCollection;
use App\Http\Resources\DeckCollection;
use App\Http\Resources\DeckDownloadResource;
use App\Http\Resources\DeckResource;
use App\Models\Card;
use App\Models\Deck;
use App\Models\Tag;
use App\Services\DeckService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

class DeckBuilderController extends Controller {
	public const int RESULTS_PER_PAGE = 15;

	public function search(Request $request) {
		$search_term = $request->input('term');
		if (empty($search_term)) {
			throw ValidationException::withMessages([
				'term' => 'Search term cannot be empty.'
			]);
		}

		$search = Card::where(function(Builder $query) use ($search_term) {
			$tags = array_map('trim', explode(',', $search_term));
			$query->whereLike('name', '%' . $search_term . '%')->orWhereHas('tags', function(Builder $q) use ($tags) {
				$q->whereAny('name', $tags);
			});
		});

		if ($request->has('dm')) {
			$deck_master_tags = Tag::whereHas('cards', function(Builder $query) use ($request) {
				$query->where('id', $request->input('dm'));
			})->pluck('id')->toArray();

			if (!empty($deck_master_tags)) {
				$search->whereHas('tags', function(Builder $query) use ($deck_master_tags) {
					$query->whereIn('id', $deck_master_tags);
				});
			}
		}

		return new CardCollection($search->paginate(perPage: static::RESULTS_PER_PAGE)->onEachSide(2)->withQueryString());
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

	public function editDeck(SaveDeck $request, Deck $deck) {
		DB::transaction(function() use (&$deck, &$request) {
			$deck->name = $request->input('name');
			if ($request->has('notes')) {
				$deck->notes = $request->input('notes');
			} else {
				$deck->notes = null;
			}

			$deck->save();

			DeckService::syncDeck($deck, $request->input('categories'));
		});

		return response()->json(['success' => true, 'data' => $deck->id], Response::HTTP_CREATED);
	}
}
