<?php

namespace App\Rules;

use App\Models\Page;
use Closure;
use Illuminate\Contracts\Validation\DataAwareRule;
use Illuminate\Contracts\Validation\ValidationRule;

class PageOrder implements DataAwareRule, ValidationRule {
	protected Page|null $currentPage = null;
	protected bool $isNewPage;

	/**
	 * All of the data under validation.
	 *
	 * @var array<string, mixed>
	 */
	protected $data = [];

	public function __construct(bool $is_new_page, Page|int|null $current_page = null) {
		$this->isNewPage = $is_new_page;
		if (!$this->isNewPage) {
			$this->currentPage = is_int($current_page) ? Page::where('id', $current_page)->first() : $current_page;
		}
	}

	/**
	 * Run the validation rule.
	 *
	 * @param  \Closure(string, ?string=): \Illuminate\Translation\PotentiallyTranslatedString  $fail
	 */
	public function validate(string $attribute, mixed $value, Closure $fail): void {
		if (!is_int($value)) {
			$fail('The selected page order value is invalid.');
			return;
		}

		if ($this->isNewPage) {
			$this->validatePageCreate($attribute, intval($value), $fail);
		} else {
			$this->validatePageEdit($attribute, intval($value), $fail);
		}
	}

	protected function validatePageCreate(string $attribute, int $value, Closure $fail): void {
		// This is valid, parent validation will handle the rest.
		if ($value === 0 && !empty($this->data['parent'])) {
			return;
		}

		$after = Page::where('id', $value)->first();
		if (empty($after)) {
			$fail('The selected page order is invalid.');
			return;
		}

		if ($this->data['parent'] !== $after->parent_id) {
			$fail('A page cannot be ordered after a page that does not share the same parent.');
			return;
		}
	}

	public function validatePageEdit(string $attribute, int $value, Closure $fail): void {
		if ($this->currentPage->is_home) {
			if ($value !== 0) {
				$fail('The home page must always be first.');
			}

			return;
		}

		// This is valid, parent validation will handle the rest.
		if ($value === 0 && !empty($this->data['parent'])) {
			return;
		}

		if ($value === $this->currentPage->id) {
			$fail('A page cannot be ordered after itself.');
			return;
		}

		$after = Page::where('id', $value)->where('id', '!=', $this->currentPage->id)->first();
		if (empty($after)) {
			$fail('The selected page order is invalid.');
			return;
		}

		if ($this->data['parent'] !== $after->parent_id) {
			$fail('A page cannot be ordered after a page that does not share the same parent.');
			return;
		}
	}

	/**
	 * Set the data under validation.
	 *
	 * @param  array<string, mixed>  $data
	 */
	public function setData(array $data): static {
		$this->data = $data;

		return $this;
	}
}
