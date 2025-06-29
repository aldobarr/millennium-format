<?php

namespace App\Http\Requests;

use App\Enums\CategoryType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveDeck extends FormRequest {
	/**
	 * Get the validation rules that apply to the request.
	 *
	 * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
	 */
	public function rules(): array {
		$rules = [
			'name' => ['required', 'string', 'max:150'],
			'notes' => ['sometimes', 'required', 'string', 'max:500'],
			'categories' => ['required', 'array', 'min:4'],
			'categories.*' => ['required', 'array'],
			'categories.*.id' => ['required', 'uuid:4'],
			'categories.*.name' => ['required', 'string', 'max:50'],
			'categories.*.type' => ['required', Rule::enum(CategoryType::class)],
			'categories.*.order' => ['present', 'integer', 'min:0'],
			'categories.*.cards' => ['present', 'array'],
			'categories.*.cards.*' => ['integer', 'exists:App\Models\Card,id'],
		];

		return $rules;
	}
}
