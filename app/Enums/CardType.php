<?php

namespace App\Enums;

enum CardType: string {
	case MONSTER = 'Monster';
	case SPELL = 'Spell';
	case TRAP = 'Trap';

	public static function casesRaw(): Array {
		$raw_cases = [];
		$cases = self::cases();
		foreach ($cases as $case) {
			$raw_cases[] = $case->value;
		}

		return $raw_cases;
	}
}
