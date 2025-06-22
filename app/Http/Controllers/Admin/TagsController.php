<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\AdminController;
use App\Http\Requests\TagRequest;
use App\Http\Resources\Tags;
use App\Http\Resources\TagResource;
use App\Models\Tag;

class TagsController extends AdminController {
	public function tags() {
		return new Tags(Tag::withCount('cards')->paginate(perPage: static::RESULTS_PER_PAGE));
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
