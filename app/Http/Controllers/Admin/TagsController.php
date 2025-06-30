<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\AdminController;
use App\Http\Requests\Admin\TagRequest;
use App\Http\Resources\Admin\Tags;
use App\Http\Resources\Admin\TagResource;
use App\Models\Tag;

class TagsController extends AdminController {
	public function tags() {
		$query = Tag::withCount('cards')->orderBy('name');

		return new Tags(request()->has('all') ? $query->get() : $query->paginate(perPage: static::RESULTS_PER_PAGE)->withQueryString());
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

		return $this->tags($this->getRequest('admin.tags'));
	}
}
