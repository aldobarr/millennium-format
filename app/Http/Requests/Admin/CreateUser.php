<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\Registration;
use Illuminate\Foundation\Http\FormRequest;

class CreateUser extends FormRequest {
	/**
	 * Get the validation rules that apply to the request.
	 *
	 * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
	 */
	public function rules(): array {
		$rules = (new Registration)->rules();
		unset($rules['token'], $rules['remember']);

		return $rules;
	}
}
