<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\Validator;

class YugiohCardLink implements ValidationRule {
	public const string MESSAGE = 'The :attribute must be a valid Yugioh Wikipedia page.';

	/**
	 * Run the validation rule.
	 *
	 * @param  \Closure(string, ?string=): \Illuminate\Translation\PotentiallyTranslatedString  $fail
	 */
	public function validate(string $attribute, mixed $value, Closure $fail): void {
		$validator = Validator::make([$attribute => $value], [
			$attribute => 'url'
		]);

		if ($validator->fails()) {
			$fail(static::MESSAGE);
		}

		if (!str_starts_with($value, 'https://yugipedia.com/wiki/')) {
			$fail(static::MESSAGE);
		}
	}
}
