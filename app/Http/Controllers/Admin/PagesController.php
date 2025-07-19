<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\AdminController;
use App\Http\Requests\Admin\Page as PageRequest;
use App\Http\Resources\PageCollection;
use App\Http\Resources\PageResource;
use App\Models\Page;
use App\Models\Tab;
use Illuminate\Support\Facades\DB;

class PagesController extends AdminController {
	public function pages() {
		return new PageCollection(Page::with('children')->whereNull('parent_id')->orderBy('order')->paginate(perPage: static::RESULTS_PER_PAGE)->withQueryString());
	}

	public function pageOrders() {
		return response()->json(['success' => true, 'data' => $this->getPageOrders()]);
	}

	public function page(Page $page) {
		return new PageResource($page->load(['tabs', 'parent']));
	}

	public function newPage(PageRequest $request) {
		$page = new Page;
		DB::transaction(function() use (&$page, &$request) {
			$page->name = $request->input('name');
			$page->slug = $request->input('slug');
			$page->parent_id = $request->input('parent');
			$page->order = -1; // This value doesn't matter, setOrder will handle it.
			$page->header = $request->input('header');
			$page->footer = $request->input('footer');
			$page->save();

			// Must be called after page exists.
			$page->setOrder($request->input('after'));

			$tabs = $request->input('tabs', []);
			foreach ($tabs as $index => $tab) {
				$tabs[$index]['order'] = $index;
				unset($tabs[$index]['id']);
				unset($tabs[$index]['createdAt']);
				unset($tabs[$index]['updatedAt']);
			}

			$page->tabs()->createMany($tabs);
		});

		return new PageResource($page->load(['tabs', 'parent']));
	}

	public function editPage(PageRequest $request, Page $page) {
		DB::transaction(function() use (&$page, &$request) {
			$page->name = $request->input('name');
			$page->slug = $request->input('slug');
			$page->parent_id = $request->input('parent');
			$page->header = $request->input('header');
			$page->footer = $request->input('footer');
			$page->save();

			$page->setOrder($request->input('after'));

			$existing_tabs = $page->tabs->keyBy('id');

			$inserts = [];
			$tabs = $request->input('tabs', []);
			foreach ($tabs as $index => $tab) {
				unset($tabs[$index]['createdAt']);
				unset($tabs[$index]['updatedAt']);
				$tabs[$index]['order'] = $index;

				if (empty($tab['id'])) {
					unset($tabs[$index]['id']);
					$inserts[] = $tabs[$index];
					continue;
				}

				$existing_tabs->forget($tab['id']);
				$page->tabs()->where('id', $tab['id'])->update([
					'name' => $tab['name'],
					'content' => $tab['content'],
					'order' => $index,
				]);
			}

			if (!empty($inserts)) {
				$page->tabs()->createMany($inserts);
			}

			if (!$existing_tabs->isEmpty()) {
				Tab::whereIn('id', $existing_tabs->keys()->all())->delete();
			}
		});

		return response()->json([
			'success' => true,
			'data' => [
				'orders' => $this->getPageOrders(),
				'page' => new PageResource($page->load(['tabs', 'parent']))
			]
		]);
	}

	protected function getPageOrders(): array {
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

		return $pages;
	}
}
