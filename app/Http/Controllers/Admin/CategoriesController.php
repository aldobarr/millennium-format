<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\AdminController;
use App\Http\Requests\CategoryRequest;
use App\Http\Resources\Categories;
use App\Http\Resources\CategoryResource;
use App\Models\Category;

class CategoriesController extends AdminController {
	public function categories() {
		return new Categories(Category::withCount('cards')->paginate(perPage: static::RESULTS_PER_PAGE));
	}

	public function createCategory(CategoryRequest $request) {
		$category = new Category;
		$category->name = $request->input('name');
		$category->save();

		return $this->categories();
	}

	public function editCategory(CategoryRequest $request, Category $category) {
		$category->name = $request->input('name');
		$category->save();

		return new CategoryResource($category->loadCount('cards'));
	}

	public function deleteCategory(Category $category) {
		$category->delete();

		return $this->categories();
	}
}
