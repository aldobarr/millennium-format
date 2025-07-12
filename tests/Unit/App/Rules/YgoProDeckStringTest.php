<?php

use App\Http\Requests\ValidateDeck;
use App\Models\Card;
use App\Rules\YgoProDeckString;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\Attributes\TestDox;
use Tests\TestCase;

class YgoProDeckStringTest extends TestCase {
	private string $validCode = '05080146';

	public function setUp(): void {
		parent::setUp();

		Card::factory(state: ['passcode' => self::$validCode])->create();
		$this->assertDatabaseHas(Card::getTableName(), [
			'passcode' => self::$validCode,
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
		self::$validCode = self::$validCode ?? str_pad(random_int(1, 99999999) . '', 8, '0', STR_PAD_LEFT);
		$code = base64_encode(pack('V', self::$validCode));

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
		];
	}
}
