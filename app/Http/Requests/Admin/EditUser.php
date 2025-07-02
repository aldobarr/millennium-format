<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\Registration;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EditUser extends FormRequest {
	/**
	 * Get the validation rules that apply to the request.
	 *
	 * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
	 */
	public function rules(): array {
		$rules = (new Registration)->rules();
		unset($rules['token'], $rules['remember']);
		$rules['password'] = array_merge(['sometimes'], $rules['password']);
		$rules['email'] = $this->unique($rules['email']);

		return $rules;
	}

	private function unique(array $rules): array {
		foreach ($rules as $key => $rule) {
			if (is_string($rule) && str_contains($rule, 'unique:')) {
				$rules[$key] = Rule::unique('users')->ignore($this->route('user'));
				break;
			}
		}

		return $rules;
	}
}
