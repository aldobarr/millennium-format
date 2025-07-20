<?php

namespace App\Http\Requests\Admin;

use App\Models\Page as PageModel;
use App\Models\Tab;
use App\Rules\PageOrder;
use App\Rules\PageParent;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class Page extends FormRequest {
	/**
	 * Get the validation rules that apply to the request.
	 *
	 * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
	 */
	public function rules(): array {
		$page = $this->route('page');

		$rules = [
			'after' => ['required', 'integer', new PageOrder($this->isMethod('POST'), $page)],
			'parent' => ['present', 'nullable', 'integer', new PageParent($page)],
			'name' => ['required', 'string', 'max:255'],
			'slug' => ['required', 'string', 'alpha_dash:ascii', 'max:50'],
			'header' => ['present', 'nullable', 'string'],
			'footer' => ['present', 'nullable', 'string'],
			'placeholder' => ['sometimes', 'boolean:strict', $this->placeholderCheck(...)],
			'visible' => ['required', 'boolean:strict'],
			'tabs' => ['present', 'array'],
			'tabs.*.id' => ['present', 'nullable', Rule::exists(Tab::getTableName(), 'id')],
			'tabs.*.name' => ['required', 'string', 'max:255'],
			'tabs.*.content' => ['present', 'nullable', 'string'],
		];

		if ($this->isMethod('PUT')) {
			$rules['slug'][] = Rule::unique(PageModel::getTableName(), 'slug')->ignore($page->id);
		} else {
			$rules['slug'][] = Rule::unique(PageModel::getTableName(), 'slug');
		}

		return $rules;
	}

	public function placeholderCheck(string $attribute, mixed $value, \Closure $fail) {
		if ($this->has('parent') && $this->input('parent') !== null && !!$value) {
			$fail('A child page cannot act as a placeholder.');
		}
	}

	protected function prepareForValidation() {
		if ($this->has('parent')) {
			if (empty($this->input('parent'))) {
				$this->merge(['parent' => null]);
			}
		}
	}
}
