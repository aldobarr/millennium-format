<?php

namespace App\Rules;

use App\Models\Page;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class PageParent implements ValidationRule {
	protected Page|null $currentPage = null;

	public function __construct(Page|int|null $current_page = null) {
		$this->currentPage = is_int($current_page) ? Page::where('id', $current_page)->first() : $current_page;
	}

	/**
	 * Run the validation rule.
	 *
	 * @param  \Closure(string, ?string=): \Illuminate\Translation\PotentiallyTranslatedString  $fail
	 */
	public function validate(string $attribute, mixed $value, Closure $fail): void {
		if ($value === null) {
			return;
		}

		if (!empty($this->currentPage) && $this->currentPage->is_home && $value !== null) {
			$fail('The home page cannot have a parent.');
			return;
		}

		if (!empty($this->currentPage) && $this->currentPage->id === (int)$value) {
			$fail('A page cannot be its own parent.');
			return;
		}

		$parent = Page::where('id', $value)->first();
		if (empty($parent)) {
			$fail('The selected parent page does not exist.');
			return;
		}

		if (!empty($parent->parent_id)) {
			$fail('A page cannot have a parent that is not a top-level page.');
			return;
		}
	}
}
