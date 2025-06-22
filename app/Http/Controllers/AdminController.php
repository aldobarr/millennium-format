<?php

namespace App\Http\Controllers;

use App\Http\Middleware\EnsureIsAdmin;
use App\Http\Requests\TagRequest;
use App\Http\Resources\TagCollection;
use App\Http\Resources\TagResource;
use App\Models\Tag;
use Illuminate\Routing\Controller;

class AdminController extends Controller {
	public const int RESULTS_PER_PAGE = 20;

	public function __construct() {
		$this->middleware(EnsureIsAdmin::class);
	}

	public function tags() {
		return new TagCollection(Tag::withCount('cards')->paginate(perPage: static::RESULTS_PER_PAGE));
	}

	public function createTag(TagRequest $request) {
		$tag = new Tag;
		$tag->name = $request->input('name');
		$tag->save();

		return $this->tags();
	}

	public function editTag(TagRequest $request, Tag $tag) {
		$tag->name = $request->input('name');
		$tag->save();

		return new TagResource($tag->loadCount('cards'));
	}

	public function deleteTag(Tag $tag) {
		$tag->delete();

		return $this->tags();
	}
}
