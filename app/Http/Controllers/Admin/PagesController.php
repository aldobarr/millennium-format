<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\AdminController;
use App\Http\Resources\PageCollection;
use App\Http\Resources\PageResource;
use App\Models\Page;

class PagesController extends AdminController {
	public function pages() {
		return new PageCollection(Page::orderBy('order')->paginate(perPage: static::RESULTS_PER_PAGE)->withQueryString());
	}

	public function pageOrders() {
		return response()->json(['success' => true, 'data' => Page::select('id', 'name', 'order')->orderBy('order')->get()->toArray()]);
	}

	public function page(Page $page) {
		return new PageResource($page->load('tabs'));
	}
}
