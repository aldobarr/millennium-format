<?php

namespace App\Http\Requests\Admin;

use App\Models\Tag;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TagRequest extends FormRequest {
	/**
	 * Get the validation rules that apply to the request.
	 *
	 * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
	 */
	public function rules() {
		$rules = ['required', 'string', 'min:1', 'max:50'];
		if ($this->isMethod('put')) {
			$rules[] = Rule::unique(Tag::class)->ignore($this->route('tag'));
		} else {
			$rules[] = Rule::unique(Tag::class);
		}

		return ['name' => $rules];
	}
}
