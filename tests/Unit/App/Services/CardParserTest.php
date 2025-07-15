<?php

namespace Tests\Unit\App\Services;

use App\Enums\Attribute;
use App\Enums\CardType;
use App\Enums\DeckType;
use App\Enums\Property;
use App\Services\CardParser;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use PHPUnit\Framework\Attributes\Test;
use ReflectionClass;
use Symfony\Component\HttpFoundation\Response;
use Tests\TestCase;

class CardParserTest extends TestCase {
	public const string CARD_LINK = 'https://yugipedia.com/wiki/Card_name';

	protected function setUp(): void {
		parent::setUp();
		Http::preventStrayRequests();
	}

	#[Test]
	public function ensure_card_parser_is_deprecated(): void {
		$reflection = new ReflectionClass(CardParser::class);
		$comment = $reflection->getDocComment();
		$this->assertIsString($comment, 'CardParser class does not have a doc comment.');
		$this->assertStringContainsString('@deprecated', $comment);
	}

	#[Test]
	public function card_parser_does_not_allow_empty_links(): void {
		$parser = new CardParser('');
		$this->assertFalse($parser->isValid());
		Http::assertNothingSent();
	}

	#[Test]
	public function connection_errors_are_handled(): void {
		Http::fake([
			'https://yugipedia.com/*' => Http::failedConnection()
		]);

		try {
			new CardParser(static::CARD_LINK);
		} catch (ConnectionException) {}

		Http::assertSentCount(3);
	}

	#[Test]
	public function bad_responses_are_handled(): void {
		Http::fake([
			'https://yugipedia.com/*' => Http::sequence()
				->push(null, Response::HTTP_INTERNAL_SERVER_ERROR)
				->push(null, Response::HTTP_INTERNAL_SERVER_ERROR)
				->push(null, Response::HTTP_INTERNAL_SERVER_ERROR)
				->push(null, Response::HTTP_BAD_REQUEST)
				->push(null, Response::HTTP_BAD_REQUEST)
				->push(null, Response::HTTP_BAD_REQUEST)
				->push($this->getResponse('not_a_card_page'))
		]);

		$server = new CardParser(static::CARD_LINK);
		$client = new CardParser(static::CARD_LINK);
		$not_card = new CardParser(static::CARD_LINK);
		$this->assertFalse($server->isValid());
		$this->assertFalse($client->isValid());
		$this->assertFalse($not_card->isValid());
		Http::assertSentCount(7);
	}

	#[Test]
	public function card_must_have_an_image(): void {
		Http::fake([
			'https://yugipedia.com/*' => Http::sequence()
				->push($this->getResponse('no_image'))
				->push($this->getResponse('no_image_src'))
				->push($this->getResponse('valid_but_no_image_srcset'))
				->push($this->getResponse('valid_but_empty_image_srcset'))
				->push($this->getResponse('valid_but_bad_image_srcset'))
				->push($this->getResponse('valid_monster_multiple_image_srces'))
				->push($this->getResponse('valid_monster_only_one_image'))
				->push($this->getResponse('valid_monster'))
		]);

		$card = new CardParser(static::CARD_LINK);
		$this->assertFalse($card->isValid());

		$card = new CardParser(static::CARD_LINK);
		$this->assertFalse($card->isValid());

		$card = new CardParser(static::CARD_LINK);
		$this->assertTrue($card->isValid());

		$card = new CardParser(static::CARD_LINK);
		$this->assertTrue($card->isValid());

		$card = new CardParser(static::CARD_LINK);
		$this->assertTrue($card->isValid());

		$card = new CardParser(static::CARD_LINK);
		$this->assertTrue($card->isValid());

		$card = new CardParser(static::CARD_LINK);
		$this->assertTrue($card->isValid());

		$card = new CardParser(static::CARD_LINK);
		$this->assertTrue($card->isValid());

		Http::assertSentCount(8);
	}

	#[Test]
	public function card_must_have_a_heading(): void {
		Http::fake([
			'https://yugipedia.com/*' => Http::response($this->getResponse('card_missing_heading'))
		]);

		$card = new CardParser(static::CARD_LINK);
		$this->assertFalse($card->isValid());

		Http::assertSentCount(1);
	}

	#[Test]
	public function card_must_have_a_name(): void {
		Http::fake([
			'https://yugipedia.com/*' => Http::response($this->getResponse('card_missing_name'))
		]);

		$card = new CardParser(static::CARD_LINK);
		$this->assertFalse($card->isValid());

		Http::assertSentCount(1);
	}

	#[Test]
	public function card_must_have_a_valid_card_table(): void {
		Http::fake([
			'https://yugipedia.com/*' => Http::sequence()
				->push($this->getResponse('card_missing_card_table_element'))
				->push($this->getResponse('card_missing_card_table'))
				->push($this->getResponse('card_empty_card_table'))
				->push($this->getResponse('card_card_table_no_rows'))
				->push($this->getResponse('card_card_table_empty_rows'))
				->push($this->getResponse('card_card_table_empty_rows2'))
				->push($this->getResponse('card_missing_passcode'))
				->push($this->getResponse('card_missing_lore_area'))
				->push($this->getResponse('card_missing_description')),
			'https://db.ygoprodeck.com/api/v7/cardinfo.php?name=*' => Http::response(null, Response::HTTP_BAD_REQUEST)
		]);

		$card = new CardParser(static::CARD_LINK);
		$this->assertFalse($card->isValid());

		$card = new CardParser(static::CARD_LINK);
		$this->assertFalse($card->isValid());

		$card = new CardParser(static::CARD_LINK);
		$this->assertFalse($card->isValid());

		$card = new CardParser(static::CARD_LINK);
		$this->assertFalse($card->isValid());

		$card = new CardParser(static::CARD_LINK);
		$this->assertFalse($card->isValid());

		$card = new CardParser(static::CARD_LINK);
		$this->assertFalse($card->isValid());

		$card = new CardParser(static::CARD_LINK);
		$this->assertFalse($card->isValid());

		$card = new CardParser(static::CARD_LINK);
		$this->assertFalse($card->isValid());

		$card = new CardParser(static::CARD_LINK);
		$this->assertFalse($card->isValid());

		// The missing passcode test will try to backup with card service. We're forcing a failure that will result in 3 requests on top of the 9 above.
		Http::assertSentCount(12);
	}

	#[Test]
	public function uses_card_service_backup_for_passcode(): void {
		$passcode = 12345;

		Http::fake([
			'https://yugipedia.com/*' => Http::response($this->getResponse('card_empty_passcode')),
			'https://db.ygoprodeck.com/api/v7/cardinfo.php?name=*' => Http::sequence()->push([])->whenEmpty(Http::response(['data' => [['id' => $passcode]]]))
		]);

		$card = new CardParser(static::CARD_LINK);
		$this->assertFalse($card->isValid());

		$card = new CardParser(static::CARD_LINK);
		$this->assertTrue($card->isValid());
		$this->assertEquals($passcode, $card->getPasscode());

		// Each card parse will send 2 requests. One to yugipedia, and one to ygoprodeck api.
		Http::assertSentCount(4);
	}

	#[Test]
	public function validate_monster_cards(): void {
		Http::fake([
			'https://yugipedia.com/*' => Http::sequence()
				->push($this->getResponse('card_card_table_missing_card_type'))
				->push($this->getResponse('card_card_table_monster_missing_attribute'))
				->push($this->getResponse('card_card_table_monster_missing_types'))
				->push($this->getResponse('card_card_table_monster_missing_level'))
				->push($this->getResponse('card_card_table_monster_missing_atk_def'))
				->push($this->getResponse('card_card_table_monster_missing_def_only'))
				->push($this->getResponse('valid_monster_unknown_strength'))
				->push($this->getResponse('valid_monster'))
				->push($this->getResponse('valid_fusion'))
				->push($this->getResponse('valid_ritual'))
		]);

		$card = new CardParser(static::CARD_LINK);
		$this->assertFalse($card->isValid());

		$card = new CardParser(static::CARD_LINK);
		$this->assertFalse($card->isValid());

		$card = new CardParser(static::CARD_LINK);
		$this->assertFalse($card->isValid());

		$card = new CardParser(static::CARD_LINK);
		$this->assertFalse($card->isValid());

		$card = new CardParser(static::CARD_LINK);
		$this->assertFalse($card->isValid());

		$card = new CardParser(static::CARD_LINK);
		$this->assertFalse($card->isValid());

		// unknown strength
		$card = new CardParser(static::CARD_LINK);
		$this->assertTrue($card->isValid());
		$this->assertNotEmpty($card->getPasscode());
		$this->assertNotEmpty($card->getName());
		$this->assertNotEmpty($card->getDescription());
		$this->assertNull($card->getAttack());
		$this->assertNull($card->getDefense());
		$this->assertNotEmpty($card->getLevel());
		$this->assertIsList($card->getMonsterTypes());
		$this->assertNotEmpty($card->getMonsterTypes());
		$this->assertEquals(CardType::MONSTER, $card->getType());
		$this->assertNull($card->getProperty());
		$this->assertInstanceOf(Attribute::class, $card->getAttribute());
		$this->assertEquals(DeckType::NORMAL, $card->getDeckType());
		$this->assertNotEmpty($card->getImage());

		// main deck monster
		$card = new CardParser(static::CARD_LINK);
		$this->assertTrue($card->isValid());
		$this->assertNotEmpty($card->getPasscode());
		$this->assertNotEmpty($card->getName());
		$this->assertNotEmpty($card->getDescription());
		$this->assertNotEmpty($card->getAttack());
		$this->assertNotEmpty($card->getDefense());
		$this->assertNotEmpty($card->getLevel());
		$this->assertIsList($card->getMonsterTypes());
		$this->assertNotEmpty($card->getMonsterTypes());
		$this->assertEquals(CardType::MONSTER, $card->getType());
		$this->assertNull($card->getProperty());
		$this->assertInstanceOf(Attribute::class, $card->getAttribute());
		$this->assertEquals(DeckType::NORMAL, $card->getDeckType());
		$this->assertNotEmpty($card->getImage());

		// fusion monster
		$card = new CardParser(static::CARD_LINK);
		$this->assertTrue($card->isValid());
		$this->assertNotEmpty($card->getPasscode());
		$this->assertNotEmpty($card->getName());
		$this->assertNotEmpty($card->getDescription());
		$this->assertNotEmpty($card->getAttack());
		$this->assertNotEmpty($card->getDefense());
		$this->assertNotEmpty($card->getLevel());
		$this->assertIsList($card->getMonsterTypes());
		$this->assertNotEmpty($card->getMonsterTypes());
		$this->assertEquals(CardType::MONSTER, $card->getType());
		$this->assertNull($card->getProperty());
		$this->assertInstanceOf(Attribute::class, $card->getAttribute());
		$this->assertEquals(DeckType::EXTRA, $card->getDeckType());
		$this->assertNotEmpty($card->getImage());

		// ritual monster
		$card = new CardParser(static::CARD_LINK);
		$this->assertTrue($card->isValid());
		$this->assertNotEmpty($card->getPasscode());
		$this->assertNotEmpty($card->getName());
		$this->assertNotEmpty($card->getDescription());
		$this->assertNotEmpty($card->getAttack());
		$this->assertNotEmpty($card->getDefense());
		$this->assertNotEmpty($card->getLevel());
		$this->assertIsList($card->getMonsterTypes());
		$this->assertNotEmpty($card->getMonsterTypes());
		$this->assertEquals(CardType::MONSTER, $card->getType());
		$this->assertNull($card->getProperty());
		$this->assertInstanceOf(Attribute::class, $card->getAttribute());
		$this->assertEquals(DeckType::RITUAL, $card->getDeckType());
		$this->assertNotEmpty($card->getImage());

		Http::assertSentCount(10);
	}

	#[Test]
	public function validate_spell_cards(): void {
		Http::fake([
			'https://yugipedia.com/*' => Http::sequence()
				->push($this->getResponse('spell_missing_property'))
				->push($this->getResponse('valid_spell'))

		]);

		// Defaults to a normal spell
		$card = new CardParser(static::CARD_LINK);
		$this->assertTrue($card->isValid());
		$this->assertEquals(Property::NORMAL, $card->getProperty());

		// unknown strength
		$card = new CardParser(static::CARD_LINK);
		$this->assertTrue($card->isValid());
		$this->assertNotEmpty($card->getPasscode());
		$this->assertNotEmpty($card->getName());
		$this->assertNotEmpty($card->getDescription());
		$this->assertNull($card->getAttack());
		$this->assertNull($card->getDefense());
		$this->assertNull($card->getLevel());
		$this->assertIsList($card->getMonsterTypes());
		$this->assertEmpty($card->getMonsterTypes());
		$this->assertEquals(CardType::SPELL, $card->getType());
		$this->assertInstanceOf(Property::class, $card->getProperty());
		$this->assertNull($card->getAttribute());
		$this->assertEquals(DeckType::NORMAL, $card->getDeckType());
		$this->assertNotEmpty($card->getImage());

		Http::assertSentCount(2);
	}

	#[Test]
	public function validate_trap_cards(): void {
		Http::fake([
			'https://yugipedia.com/*' => Http::sequence()
				->push($this->getResponse('trap_missing_property'))
				->push($this->getResponse('valid_trap'))

		]);

		// Defaults to a normal trap
		$card = new CardParser(static::CARD_LINK);
		$this->assertTrue($card->isValid());
		$this->assertEquals(Property::NORMAL, $card->getProperty());

		// unknown strength
		$card = new CardParser(static::CARD_LINK);
		$this->assertTrue($card->isValid());
		$this->assertNotEmpty($card->getPasscode());
		$this->assertNotEmpty($card->getName());
		$this->assertNotEmpty($card->getDescription());
		$this->assertNull($card->getAttack());
		$this->assertNull($card->getDefense());
		$this->assertNull($card->getLevel());
		$this->assertIsList($card->getMonsterTypes());
		$this->assertEmpty($card->getMonsterTypes());
		$this->assertEquals(CardType::TRAP, $card->getType());
		$this->assertInstanceOf(Property::class, $card->getProperty());
		$this->assertNull($card->getAttribute());
		$this->assertEquals(DeckType::NORMAL, $card->getDeckType());
		$this->assertNotEmpty($card->getImage());

		Http::assertSentCount(2);
	}

	protected function getResponse(string $file): string {
		return file_get_contents(__DIR__ . '/CardParserResponses/' . $file . '.txt');
	}

	protected function tearDown(): void {
		Http::allowStrayRequests();
		parent::tearDown();
	}
}
