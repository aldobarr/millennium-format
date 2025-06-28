<?php

namespace App\Http\Controllers;

use App\Http\Requests\SaveDeck;
use App\Http\Resources\CardCollection;
use App\Http\Resources\DeckCollection;
use App\Http\Resources\DeckResource;
use App\Models\Card;
use App\Models\Deck;
use App\Services\DeckService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

class DeckBuilderController extends Controller {
	public function search(Request $request) {
		$searchTerm = $request->input('term');
		if (empty($searchTerm)) {
			throw ValidationException::withMessages([
				'term' => 'Search term cannot be empty.'
			]);
		}

		$search = Card::whereLike('name', '%' . $searchTerm . '%');
		/*if ($request->has('dm')) {
			$deckMaster = Card::where('id', $request->input('dm'))->first();
			if ($deckMaster) {
				$search->where('category_id', $deckMaster->category_id);
			}
		}*/

		return new CardCollection($search->get());
	}

	public function decks(Request $request) {
		return new DeckCollection($request->user()->decks);
	}

	public function getDeck(Deck $deck) {
		return new DeckResource($deck);
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
}
