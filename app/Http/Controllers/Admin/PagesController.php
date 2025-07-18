<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\AdminController;
use App\Http\Requests\Admin\Page as PageRequest;
use App\Http\Resources\PageCollection;
use App\Http\Resources\PageResource;
use App\Models\Page;
use Illuminate\Support\Facades\DB;

class PagesController extends AdminController {
	public function pages() {
		return new PageCollection(Page::with('children')->whereNull('parent_id')->orderBy('order')->paginate(perPage: static::RESULTS_PER_PAGE)->withQueryString());
	}

	public function pageOrders() {
		$pages = Page::select('id', 'name', 'order')->whereNull('parent_id')->orderBy('order')->get()->keyBy('id')->toArray();
		$children = Page::select('id', 'name', 'order', 'parent_id')->whereNotNull('parent_id')->orderBy('order')->get()->toArray();
		foreach ($children as $child) {
			if (!array_key_exists($child['parent_id'], $pages)) {
				continue;
			}

			$pages[$child['parent_id']]['children'][] = [
				'id' => $child['id'],
				'name' => $child['name'],
				'order' => $child['order'],
			];
		}

		return response()->json(['success' => true, 'data' => $pages]);
	}

	public function page(Page $page) {
		return new PageResource($page->load(['tabs', 'parent']));
	}

	public function newPage(PageRequest $request) {
		$page = new Page;
		DB::transaction(function() use (&$page, &$request) {
			$page->name = $request->input('name');
			$page->slug = $request->input('slug');
			$page->order = Page::where('id', $request->input('after'))->value('order') + 1;
			$page->header = $request->input('header');
			$page->footer = $request->input('footer');
			$page->save();

			DB::table(Page::getTableName())->where('order', '>=', $page->order)->where('id', '!=', $page->id)->increment('order');

			$tabs = $request->input('tabs', []);
			foreach ($tabs as $index => $tab) {
				unset($tabs[$index]['id']);
				$tabs[$index]['order'] = $index;
			}

			$page->tabs()->createMany($tabs);
		});

		return response()->json(['success' => true, 'data' => new PageResource($page->load('tabs'))]);
	}

	public function editPage(PageRequest $request, Page $page) {
		return response()->json([]);
	}
}
