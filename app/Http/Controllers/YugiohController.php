<?php

namespace App\Http\Controllers;

use App\Models\Card;
use Illuminate\Http\Request;

class YugiohController extends Controller {
    public function search(Request $request) {
		$results = [];
		$searchTerm = $request->input('term');
		if (empty($searchTerm)) {
			return response()->json([
				'success' => false,
				'error' => 'Search term cannot be empty.'
			]);
		}

		$search = Card::where('name', 'like', '%' . $searchTerm . '%');
		$deckMaster = Card::where('id', $request->input('dm'))->first();
		if ($deckMaster) {
			$search->where('category_id', $deckMaster->category_id);
		}

		$search->get()->each(function($card) use (&$results) {
			$results[] = [
				'id' => $card->id,
				'name' => $card->name,
				'image' => $card->image,
				'limit' => $card->limit
			];
		});

		return response()->json([
			'success' => true,
			'results' => $results
		]);
	}
}
