<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class Login extends FormRequest {
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
			'email' => ['required', 'string', 'email', 'max:255'],
			'password' => ['required', 'string'],
			'remember' => ['sometimes', 'required', 'boolean:strict'],
		];
	}
}
