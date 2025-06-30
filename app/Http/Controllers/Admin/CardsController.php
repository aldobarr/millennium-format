<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\AdminController;
use App\Http\Requests\Admin\CardRequest;
use App\Http\Resources\Admin\CardResource;
use App\Http\Resources\Admin\Cards;
use App\Models\Card;
use App\Models\Tag;
use App\Rules\YugiohCardLink;
use App\Services\CardParser;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CardsController extends AdminController {
	public function cards(Request $request) {
		$cards = Card::with('tags')->orderBy('id');
		if ($request->has('search') && !empty($request->input('search'))) {
			$search = $request->input('search');
			$tags = array_map('trim', explode(',', $search));
			$cards->where(function(Builder $query) use ($tags) {
				foreach ($tags as $tag) {
					$query->whereLike('name', '%' . $tag . '%');
				}

				$query->orWhereHas('tags', function(Builder $q) use ($tags) {
					$q->whereIn('name', $tags);
				});
			});
		}

		return new Cards($cards->paginate(perPage: static::RESULTS_PER_PAGE)->withQueryString());
	}

	public function createCard(CardRequest $request) {
		$link = $request->input('link');
		$card_data = new CardParser($link);
		if (!$card_data->isValid()) {
			Validator::make(['link' => 'invalid'], [
				'link' => [new YugiohCardLink]
			])->validate();
		}

		Validator::make(['link' => $card_data->getName()], [
			'link' => ['unique:App\Models\Card,name']
		])->validate();

		$card = new Card;
		$card->name = $card_data->getName();
		$card->type = $card_data->getType();
		$card->deck_type = $card_data->getDeckType();
		$card->level = $card_data->getLevel();
		$card->attack = $card_data->getAttack();
		$card->defense = $card_data->getDefense();
		$card->description = $card_data->getDescription();
		$card->image = $card_data->getImage();
		$card->link = $link;
		$card->limit = $request->input('limit');
		$card->legendary = $request->input('legendary', false);
		$card->save();

		if ($request->has('tags')) {
			$tags = Tag::whereIn('id', $request->input('tags'))->get();
			$card->tags()->saveMany($tags);
		}

		return $this->cards($request);
	}

	public function editCard(CardRequest $request, Card $card) {
		$card->limit = $request->input('limit');
		$card->legendary = $request->input('legendary', false);
		$card->save();

		$card->tags()->sync($request->input('tags', []));

		return new CardResource(Card::with('tags')->where('id', $card->id)->first());
	}

	public function deleteCard(Card $card) {
		$card->delete();

		return $this->cards($this->getRequest('admin.cards'));
	}
}
