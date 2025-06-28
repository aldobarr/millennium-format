<?php

namespace App\Enums;

enum CategoryType: string {
	case DECK_MASTER = 'DeckMaster';
	case MAIN = 'Main';
	case EXTRA = 'Extra';
	case SIDE = 'Side';

	public static function casesRaw(): Array {
		$raw_cases = [];
		$cases = self::cases();
		foreach ($cases as $case) {
			$raw_cases[] = $case->value;
		}

		return $raw_cases;
	}
}
