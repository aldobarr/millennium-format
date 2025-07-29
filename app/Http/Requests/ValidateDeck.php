<?php

namespace App\Http\Requests;

use App\Enums\CategoryType;
use App\Rules\YgoProDeckString;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ValidateDeck extends FormRequest {
	/**
	 * Get the validation rules that apply to the request.
	 *
	 * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
	 */
	public function rules(): array {
		if ($this->isMethod('get')) {
			return [
				'deck' => ['required', 'string', new YgoProDeckString($this)],
			];
		}

		return [
			'categories' => ['required', 'array', 'min:4'],
			'categories.*' => ['required', 'array'],
			'categories.*.id' => ['required', 'uuid:4'],
			'categories.*.name' => ['required', 'string', 'max:50'],
			'categories.*.type' => ['required', Rule::enum(CategoryType::class)],
			'categories.*.order' => ['present', 'integer', 'min:0'],
			'categories.*.cards' => ['present', 'array'],
			'categories.*.cards.*' => ['present', 'array'],
			'categories.*.cards.*.id' => ['integer', 'exists:App\Models\Card,id'],
		];
	}
}
