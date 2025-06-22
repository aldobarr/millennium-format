<?php

namespace App\Http\Controllers;

use App\Http\Resources\Admin\Categories;
use App\Http\Resources\CardCollection;
use App\Models\Card;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class YugiohController extends Controller {
	public function search(Request $request) {
		$searchTerm = $request->input('term');
		if (empty($searchTerm)) {
			throw ValidationException::withMessages([
				'term' => 'Search term cannot be empty.'
			]);
		}

		$search = Card::where('name', 'like', '%' . $searchTerm . '%');
		$deckMaster = Card::where('id', $request->input('dm'))->first();
		if ($deckMaster) {
			$search->where('category_id', $deckMaster->category_id);
		}

		return new CardCollection($search->get());
	}

	public function categories() {
		return new Categories(Category::all());
	}
}
