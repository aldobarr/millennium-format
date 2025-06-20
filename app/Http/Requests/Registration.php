<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class Registration extends FormRequest {
	/**
	 * Determine if the user is authorized to make this request.
	 */
	public function authorize(): bool {
		return empty($this->user());
	}

	/**
	 * Get the validation rules that apply to the request.
	 *
	 * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
	 */
	public function rules(): array {
		return [
			'name' => ['required', 'string', 'max:50'],
			'email' => ['required', 'string', 'email', 'unique:App\Models\User', 'max:255'],
			'password' => ['required', 'string', Password::min(10)->letters()->numbers(), 'max:100', 'confirmed'],
			'token' => ['required', 'string', 'max:255'],
			'remember' => ['sometimes', 'required', 'boolean'],
		];
	}
}
