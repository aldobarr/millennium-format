<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class ChangePassword extends FormRequest {
	/**
	 * Get the validation rules that apply to the request.
	 *
	 * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
	 */
	public function rules(): array {
		return [
			'current_password' => ['required', 'string', 'current_password:sanctum', 'max:100'],
			'password' => ['required', 'string', Password::min(10)->letters()->numbers(), 'max:100', 'confirmed'],
		];
	}
}
