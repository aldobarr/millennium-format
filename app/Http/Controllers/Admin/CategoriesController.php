<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\AdminController;
use App\Http\Requests\Admin\CategoryRequest;
use App\Http\Resources\Admin\Categories;
use App\Http\Resources\Admin\CategoryResource;
use App\Models\Category;
use Illuminate\Http\Request;

class CategoriesController extends AdminController {
	public function categories() {
		return new Categories(Category::paginate(perPage: static::RESULTS_PER_PAGE));
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

		return $this->categories($this->getRequest('admin.categories'));
	}
}
