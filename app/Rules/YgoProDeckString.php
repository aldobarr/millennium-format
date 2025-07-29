<?php

namespace App\Rules;

use App\Enums\CategoryType;
use App\Models\Card;
use App\Models\CardAlternate;
use App\Services\CardService;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class YgoProDeckString implements ValidationRule {
	public function __construct(private FormRequest $request) {}

	/**
	 * Run the validation rule.
	 *
	 * @param  \Closure(string, ?string=): \Illuminate\Translation\PotentiallyTranslatedString  $fail
	 */
	public function validate(string $attribute, mixed $value, Closure $fail): void {
		if (empty($value)) {
			$fail('The deck string cannot be empty.');
			return;
		}

		if (!str_starts_with($value, 'ydke://')) {
			$fail('The provided deck is not a valid YGOPro deck string.');
			return;
		}

		$payload = substr($value, 7, -1);
		$parts = explode('!', $payload);
		if (count($parts) !== 3) {
			$fail('The provided deck is not a valid YGOPro deck string.');
			return;
		}

		$categories = [
			0 => [
				'id' => 1,
				'name' => 'Deck Master',
				'type' => CategoryType::DECK_MASTER->value,
				'order' => 0,
				'cards' => [],
			],
			1 => [
				'id' => 2,
				'name' => 'Main Deck',
				'type' => CategoryType::MAIN->value,
				'order' => 1,
				'cards' => [],
			],
			2 => [
				'id' => 3,
				'name' => 'Extra Deck',
				'type' => CategoryType::EXTRA->value,
				'order' => 2,
				'cards' => [],
			],
			3 => [
				'id' => 4,
				'name' => 'Side Deck',
				'type' => CategoryType::SIDE->value,
				'order' => 3,
				'cards' => [],
			]
		];

		foreach ($parts as $key => $part) {
			if (!empty($part) && base64_encode(base64_decode($part, true)) !== $part) {
				$fail('The provided deck is not a valid YGOPro deck string.');
				return;
			}

			if (empty($part) && $key === 0) {
				$fail('The main deck cannot be empty.');
				return;
			} else if (empty($part)) {
				continue;
			}

			$cards = array_values(array_map(fn($card) => CardService::normalizePasscode($card), unpack('V*', base64_decode($part))));

			if ($key === 0) {
				$dm = CardAlternate::where('passcode', array_shift($cards))->value('id');
				if (empty($dm)) {
					$fail('The deck contains invalid cards.');
					return;
				}

				$categories[$key]['cards'] = [$dm];
			}

			$cards_db = CardAlternate::whereIn('passcode', $cards)->pluck('id', 'passcode')->toArray();
			if (!empty(array_diff($cards, array_keys($cards_db)))) {
				$fail('The deck contains invalid cards.');
				return;
			}

			$categories[$key + 1]['cards'] = array_map(fn($card) => $cards_db[$card] ?? null, $cards);
		}

		$this->request->merge(['deck' => $categories]);
	}
}
