<?php

namespace App\Enums;

enum Attribute: string {
	case LIGHT = 'LIGHT';
	case DARK = 'DARK';
	case WATER = 'WATER';
	case FIRE = 'FIRE';
	case EARTH = 'EARTH';
	case WIND = 'WIND';
	case DIVINE = 'DIVINE';

	public static function casesRaw(): Array {
		$raw_cases = [];
		$cases = self::cases();
		foreach ($cases as $case) {
			$raw_cases[] = $case->value;
		}

		return $raw_cases;
	}
}
