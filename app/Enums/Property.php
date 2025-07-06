<?php

namespace App\Enums;

enum Property: string {
	case NORMAL = 'Normal';
	case CONTINUOUS = 'Continuous';
	case RITUAL = 'Ritual';
	case QUICK_PLAY = 'Quick-Play';
	case FIELD = 'Field';
	case EQUIP = 'Equip';
	case COUNTER = 'Counter';

	public static function casesRaw(): Array {
		$raw_cases = [];
		$cases = self::cases();
		foreach ($cases as $case) {
			$raw_cases[] = $case->value;
		}

		return $raw_cases;
	}
}
