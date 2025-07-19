<?php

namespace App\Http\Controllers;

use App\Http\Resources\PageResource;
use App\Models\Page;
use Illuminate\Contracts\Database\Eloquent\Builder;

class PageController extends Controller {
	public function nav() {
		$nav = Page::with(['children' => function(Builder $query) {
			$query->where('is_visible', true);
		}])->where('is_home', false)->where('is_visible', true)->whereNull('parent_id')->orderBy('order')->get()->map(fn($page) => [
			'name' => $page->name,
			'slug' => $page->slug,
			'children' => $page->children->map(fn($child) => [
				'name' => $child->name,
				'slug' => $child->slug,
			]),
		]);

		return response()->json(['success' => true, 'data' => $nav]);
	}

	public function home() {
		return new PageResource(Page::with('tabs')->where('is_home', true)->first());
	}

	public function page(string $page, string|null $child = null) {
		$page = Page::with('tabs')->where('slug', $page)->where('is_visible', true)->first();
		if (empty($page)) {
			abort(404);
		}

		if ($child) {
			$child = Page::with('tabs')->where('slug', $child)->where('parent_id', $page->id)->where('is_visible', true)->first();
			if (empty($child)) {
				abort(404);
			}

			return new PageResource($child);
		}

		return new PageResource($page);
	}
}
