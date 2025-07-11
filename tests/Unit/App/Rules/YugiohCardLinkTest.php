<?php

use App\Rules\YugiohCardLink;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\Attributes\TestDox;
use Tests\TestCase;

class YugiohCardLinkTest extends TestCase {
	#[Test, TestDox('it rejects invalid urls and succeeds on yugipedia links'), DataProvider('urls')]
	public function checkUrlsAgainstRules(string $url, bool $fail): void {
		$this->expectNotToPerformAssertions();

		$failure = function($message) use ($url, $fail) {
			if (!$fail) {
				$this->fail('Expected no failure for "' . $url . '", but got: "' . $message . '"');
			}
		};

		(new YugiohCardLink)->validate('link', $url, $failure);
	}

	public static function urls(): array {
		return [
			['', true],
			['some string', true],
			['https://www.google.com', true],
			['https://yugipedia.com/wiki/Some_Card', false],
		];
	}
}
