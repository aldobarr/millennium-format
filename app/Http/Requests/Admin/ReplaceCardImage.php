<?php

namespace App\Http\Requests\Admin;

use App\Models\Card;
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
			'image' => [
				'required',
				'file',
				'image',
				'mimes:' . implode(',', Card::ALLOWED_IMAGE_EXTENSIONS),
				'max:' . (Card::MAX_IMAGE_SIZE / 1024)
			],
		];
	}
}
