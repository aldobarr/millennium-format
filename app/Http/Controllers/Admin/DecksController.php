<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\AdminController;
use App\Http\Resources\DeckCollection;
use App\Models\Deck;
use Illuminate\Http\Request;

class DecksController extends AdminController {
	public const int RESULTS_PER_PAGE = 10;

	public function decks(Request $request) {
		$search = Deck::with('categories.cards.tags')->orderBy('user_id')->orderBy('id');
		if ($request->has('search')) {
			$term = $request->input('search');
			$search->whereHas('user', function ($query) use ($term) {
				$query->where('name', 'like', '%' . $term . '%')
					->orWhere('email', 'like', '%' . $term . '%');
			});
		}

		$decks = $search->paginate(perPage: static::RESULTS_PER_PAGE)->withQueryString();
		return new DeckCollection($decks);
	}
}
