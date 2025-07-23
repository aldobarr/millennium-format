<?php

namespace App\Enums;

enum MonsterProperty: string {
	case NORMAL = 'Normal';
	case EFFECT = 'Effect';
	case FUSION = 'Fusion';
	case LINK = 'Link';
	case RITUAL = 'Ritual';
	case SYNCHRO = 'Synchro';
	case XYZ = 'Xyz';

	public static function casesRaw(): Array {
		$raw_cases = [];
		$cases = self::cases();
		foreach ($cases as $case) {
			$raw_cases[] = $case->value;
		}

		return $raw_cases;
	}

	public static function has(string $value): bool {
		return in_array(ucfirst(strtolower(trim($value))), self::casesRaw());
	}
}
