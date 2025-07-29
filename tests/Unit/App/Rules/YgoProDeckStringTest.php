<?php

namespace Tests\Unit\App\Rules;

use App\Http\Requests\ValidateDeck;
use App\Models\Card;
use App\Models\CardAlternate;
use App\Rules\YgoProDeckString;
use App\Services\CardService;
use Illuminate\Database\Eloquent\Factories\Sequence;
use Mockery;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\Attributes\TestDox;
use Tests\TestCase;

class YgoProDeckStringTest extends TestCase {
	private static string|null $validCode = null;
	private static string|null $validCode2 = null;

	public function setUp(): void {
		parent::setUp();

		Card::factory(state: ['passcode' => self::$validCode])
			->has(
				CardAlternate::factory()->state(new Sequence(
					fn(Sequence $sequence) => [
						'passcode' => $sequence->index === 0 ? self::$validCode : self::$validCode2
					])
				)->count(2),
				'alternates'
			)
			->create();

		$this->assertDatabaseHas(Card::getTableName(), [
			'passcode' => self::$validCode,
		]);

		$this->assertDatabaseHas(CardAlternate::getTableName(), [
			'passcode' => self::$validCode,
		]);

		$this->assertDatabaseHas(CardAlternate::getTableName(), [
			'passcode' => self::$validCode2,
		]);
	}

	#[Test, TestDox('it rejects invalid deck strings and merges valid deck strings'), DataProvider('deckStrings')]
	public function checkDecksAgainstRules(string $deck, string|false $fail): void {
		$request = Mockery::mock(ValidateDeck::class);
		$failure = function($message) use ($deck, $fail) {
			if ($fail === false) {
				$this->fail('Expected no failure for "' . $deck . '" (), but got: "' . $message . '"');
			}

			$this->assertEquals($fail, $message);
		};

		if ($fail === false) {
			$request->shouldReceive('merge')->with(Mockery::hasKey('deck'))->once();
		} else {
			$request->shouldReceive('merge')->never();
		}

		(new YgoProDeckString($request))->validate('deck', $deck, $failure);
	}

	public static function deckStrings(): array {
		self::$validCode = self::$validCode ?? CardService::normalizePasscode(random_int(1, 99999999));
		self::$validCode2 = self::$validCode2 ?? CardService::normalizePasscode(random_int(1, 99999999));
		$code = base64_encode(pack('V', self::$validCode));
		$code2 = base64_encode(pack('V', self::$validCode2));

		return [
			['', 'The deck string cannot be empty.'],
			['some string', 'The provided deck is not a valid YGOPro deck string.'],
			['ydke://', 'The provided deck is not a valid YGOPro deck string.'],
			['ydke://!', 'The provided deck is not a valid YGOPro deck string.'],
			['ydke://!!', 'The provided deck is not a valid YGOPro deck string.'],
			['ydke://!!!!', 'The provided deck is not a valid YGOPro deck string.'],
			['ydke://!!!', 'The main deck cannot be empty.'],
			['ydke://123!!!', 'The provided deck is not a valid YGOPro deck string.'],
			['ydke://AAAAAAAAAAA=!!!', 'The deck contains invalid cards.'],
			['ydke://' . $code . '!AAAAAAAAAAA=!!', 'The deck contains invalid cards.'],
			['ydke://' . $code . '!!AAAAAAAAAAA=!', 'The deck contains invalid cards.'],
			['ydke://' . $code . '!!!', false],
			['ydke://' . $code2 . '!!!', false],
		];
	}
}
