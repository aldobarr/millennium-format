<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\AdminController;
use App\Http\Requests\Admin\CardRequest;
use App\Http\Requests\Admin\ReplaceCardImage;
use App\Http\Resources\Admin\CardResource;
use App\Http\Resources\Admin\Cards;
use App\Models\Card;
use App\Models\Tag;
use App\Rules\YugiohCardLink;
use App\Services\CardParser;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

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
					$q->whereAny('name', $tags);
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

		$card->storeImage();
		return $this->cards($request);
	}

	public function editCard(CardRequest $request, Card $card) {
		$card->limit = $request->input('limit');
		$card->legendary = $request->input('legendary', false);
		$card->save();

		$card->tags()->sync($request->input('tags', []));

		return new CardResource(Card::with('tags')->where('id', $card->id)->first());
	}

	public function imageRules() {
		return response()->json([
			'success' => true,
			'data' => [
				'allowed_extensions' => Card::ALLOWED_IMAGE_EXTENSIONS,
				'max_size' => Card::MAX_IMAGE_SIZE,
			]
		]);
	}

	public function replaceImageCard(ReplaceCardImage $request, Card $card) {
		$file = $request->file('image');
		$disk_space = disk_free_space(Storage::disk('public')->path('images'));

		if ($disk_space === false || $disk_space < Card::MIN_DISK_SPACE) {
			unlink($file->getRealPath());
			throw ValidationException::withMessages([
				'image' => ['Not enough disk space to store the image.']
			]);
		}

		$buffer = finfo_open(FILEINFO_MIME_TYPE);
		$type = finfo_file($buffer, $file->getRealPath());
		finfo_close($buffer);

		if ($type === false) {
			unlink($file->getRealPath());
			throw ValidationException::withMessages([
				'image' => ['Invalid file type.']
			]);
		}

		$allowed = false;
		$type = strtolower($type);
		foreach (Card::ALLOWED_IMAGE_EXTENSIONS as $ext) {
			if (strcmp($type, 'image/' . $ext) === 0) {
				$allowed = true;
				break;
			}
		}

		if (!$allowed) {
			Validator::make(['image' => 'invalid'], [
				'image' => ['mimes:' . implode(',', Card::ALLOWED_IMAGE_EXTENSIONS)]
			])->validate();
		}

		$ext = explode('/', $type)[1];
		$ext = strcasecmp($type, 'image/jpeg') !== 0 ? $ext : 'jpg';
		$card->deleteImage();

		Storage::disk('public')->putFileAs('images/cards', $file, $card->id . '.' . $ext);
		unlink($file->getRealPath());

		return new CardResource($card);
	}

	public function deleteCard(Card $card) {
		$card->delete();

		return $this->cards($this->getRequest('admin.cards'));
	}
}
