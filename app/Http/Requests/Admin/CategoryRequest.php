<?php

namespace App\Http\Requests\Admin;

use App\Models\Category;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CategoryRequest extends FormRequest {
	/**
	 * Get the validation rules that apply to the request.
	 *
	 * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
	 */
	public function rules() {
		$rules = ['required', 'string', 'min:1', 'max:50'];
		if ($this->isMethod('put')) {
			$rules[] = Rule::unique(Category::class)->ignore($this->route('category'));
		} else {
			$rules[] = Rule::unique(Category::class);
		}

		return ['name' => $rules];
	}
}
