<?php

namespace App\Http\Requests\Admin;

use App\Models\Page as PageModel;
use App\Models\Tab;
use Illuminate\Contracts\Database\Query\Builder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class Page extends FormRequest {
	/**
	 * Get the validation rules that apply to the request.
	 *
	 * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
	 */
	public function rules(): array {
		$rules = [
			'after' => ['required', 'integer'],
			'name' => ['required', 'string', 'max:255'],
			'slug' => ['required', 'string', 'max:255'],
			'header' => ['present', 'nullable', 'string'],
			'footer' => ['present', 'nullable', 'string'],
			'tabs' => ['present', 'array'],
			'tabs.*.id' => ['present', 'nullable', Rule::exists(Tab::getTableName(), 'id')],
			'tabs.*.name' => ['required', 'string', 'max:255'],
			'tabs.*.content' => ['present', 'nullable', 'string'],
		];

		if ($this->isMethod('PUT')) {
			$page = $this->route('page');
			$rules['slug'][] = Rule::unique(PageModel::getTableName(), 'slug')->ignore($page->id);
			$rules['after'][] = $page->is_home ? 'between:0,0' : Rule::exists(PageModel::getTableName(), 'id')->where(function (Builder $query) use ($page) {
				$query->where('id', '!=', $page->id);
			});
		} else {
			$rules['slug'][] = Rule::unique(PageModel::getTableName(), 'slug');
			$rules['after'][] = Rule::exists(PageModel::getTableName(), 'id');
		}

		return $rules;
	}
}
