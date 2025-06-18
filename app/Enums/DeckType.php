<?php

namespace App\Enums;

enum DeckType: string {
	case MAIN = 'Main';
	case SIDE = 'Side';
	case EXTRA = 'Extra';

	public static function casesRaw(): Array {
		$raw_cases = [];
		$cases = self::cases();
		foreach ($cases as $case) {
			$raw_cases[] = $case->value;
		}

		return $raw_cases;
	}
}
