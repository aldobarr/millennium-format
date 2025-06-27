<?php

namespace App\Enums;

enum DeckType: string {
	case NORMAL = 'Normal';
	case EXTRA = 'Extra';
	case RITUAL = 'Ritual';

	public static function casesRaw(): Array {
		$raw_cases = [];
		$cases = self::cases();
		foreach ($cases as $case) {
			$raw_cases[] = $case->value;
		}

		return $raw_cases;
	}
}
