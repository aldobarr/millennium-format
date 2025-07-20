<?php

namespace App\Http\Requests\Admin;

use App\Rules\YugiohCardLink;
use Illuminate\Foundation\Http\FormRequest;

class CardRequest extends FormRequest {
	/**
	 * Get the validation rules that apply to the request.
	 *
	 * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
	 */
	public function rules() {
		$rules = [
			'tags' => ['nullable', 'list'],
			'tags.*' => ['required', 'integer', 'exists:App\Models\Tag,id'],
			'limit' => ['required', 'integer', 'min:1', 'max:3'],
			'legendary' => ['required', 'boolean:strict'],
		];

		if ($this->isMethod('post')) {
			$rules['link'] = ['required', new YugiohCardLink];
		}

		return $rules;
	}
}
