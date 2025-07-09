<?php

namespace App\Http\Requests;

use App\Rules\YgoProDeckString;
use Illuminate\Foundation\Http\FormRequest;

class ValidateDeck extends FormRequest {
	/**
	 * Get the validation rules that apply to the request.
	 *
	 * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
	 */
	public function rules(): array {
		return [
			'deck' => ['required', 'string', new YgoProDeckString($this)],
		];
	}
}
