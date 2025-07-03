<?php

namespace App\Http\Requests\Admin;

use App\Rules\YugiohCardLink;
use Illuminate\Foundation\Http\FormRequest;

class ReplaceCardImage extends FormRequest {
	/**
	 * Get the validation rules that apply to the request.
	 *
	 * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
	 */
	public function rules() {
		return [
			'image' => ['required', 'file', 'image', 'mimes:jpeg,jpg,png', 'max:2048'],
		];
	}
}
