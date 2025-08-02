<?php

namespace Tests\Unit\App\Services;

use App\Enums\Attribute;
use App\Enums\CardType;
use App\Enums\DeckType;
use App\Enums\Property;
use App\Services\CardService;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\HttpClientException;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use PHPUnit\Framework\Attributes\Test;
use Symfony\Component\HttpFoundation\Response;
use Tests\TestCase;

class CardServiceTest extends TestCase {
	protected function setUp(): void {
		parent::setUp();
		Http::preventStrayRequests();
	}

	#[Test]
	public function normalize_passcode_returns_8_character_strings(): void {
		// Accepts integers or strings and pads them to 8 digits with leading zeroes.
		$this->assertEquals('00000001', CardService::normalizePasscode(1));
		$this->assertEquals('00000001', CardService::normalizePasscode('1'));

		// Does not change numbers that are already 8 digits long.
		$this->assertEquals('12345678', CardService::normalizePasscode(12345678));
		$this->assertEquals('12345678', CardService::normalizePasscode('12345678'));

		// Strips non-numeric characters.
		$this->assertEquals('00000001', CardService::normalizePasscode('abc1def'));

		// Throws when passcode is longer than 8 characters.
		$this->expectException(\InvalidArgumentException::class);
		$this->expectExceptionMessage('Passcode must be 8 characters or less.');
		CardService::normalizePasscode('123456789');
	}

	#[Test]
	public function passcode_method_sends_valid_passcode_requests(): void {
		Http::fake([
			CardService::API_URL . '*' => Http::response(static::VALID_CARD_DATA['monster']),
		]);

		$passcode = 1;
		CardService::fromPasscode($passcode);
		Http::assertSentCount(1);
		Http::assertSent(function (Request $request) use ($passcode) {
			return strcmp($request->url(), CardService::API_URL . '?id=' . CardService::normalizePasscode($passcode)) === 0;
		});
	}

	#[Test]
	public function name_method_sends_valid_name_requests(): void {
		Http::fake([
			CardService::API_URL . '*' => Http::response(static::VALID_CARD_DATA['monster']),
		]);

		$name = 'Some Monster';
		CardService::fromName($name);
		Http::assertSentCount(1);
		Http::assertSent(function (Request $request) use ($name) {
			return strcmp($request->url(), CardService::API_URL . '?name=' . rawurlencode($name)) === 0;
		});
	}

	#[Test]
	public function yugipedia_method_sends_valid_name_requests(): void {
		Http::fake([
			CardService::API_URL . '*' => Http::response(static::VALID_CARD_DATA['monster']),
		]);

		$name = 'Some Monster';
		CardService::fromYugipediaLink('https://yugipedia.com/wiki/' . str_replace(' ', '_', $name));
		Http::assertSent(function (Request $request) use ($name) {
			return strcmp($request->url(), CardService::API_URL . '?name=' . rawurlencode($name)) === 0;
		});

		$name = 'Some Monster Fixed';
		CardService::fromYugipediaLink('https://yugipedia.com/wiki/' . str_replace(' ', '_', $name) . '_(card)');
		Http::assertSent(function (Request $request) use ($name) {
			return strcmp($request->url(), CardService::API_URL . '?name=' . rawurlencode($name)) === 0;
		});

		Http::assertSentCount(2);
	}

	#[Test]
	public function yugipedia_method_throws_on_strings_that_are_not_links(): void {
		// Seriously malformed url
		$this->expectException(\InvalidArgumentException::class);
		$this->expectExceptionMessage('Invalid Yugipedia link provided.');
		CardService::fromYugipediaLink(':5');
	}

	#[Test]
	public function yugipedia_method_throws_on_links_with_no_path(): void {
		// No path in URL
		$this->expectException(\InvalidArgumentException::class);
		$this->expectExceptionMessage('Invalid Yugipedia link provided.');
		CardService::fromYugipediaLink('https://yugipedia.com');
	}

	#[Test]
	public function yugipedia_method_throws_on_links_with_not_enough_paths(): void {
		// No path in URL
		$this->expectException(\InvalidArgumentException::class);
		$this->expectExceptionMessage('Invalid Yugipedia link provided.');
		CardService::fromYugipediaLink('https://yugipedia.com/wiki');
	}

	#[Test]
	public function connection_errors_are_handled(): void {
		Http::fake([
			CardService::API_URL . '*' => Http::failedConnection()
		]);

		try {
			CardService::fromPasscode(12345678);
		} catch (ConnectionException) {}

		Http::assertSentCount(3);
	}

	#[Test]
	public function server_errors_are_handled(): void {
		Http::fake([
			CardService::API_URL . '*' => Http::response(null, Response::HTTP_INTERNAL_SERVER_ERROR)
		]);

		try {
			CardService::fromPasscode(12345678);
		} catch (ConnectionException $e) {
			$this->assertEquals('Failed to fetch card data from API.', $e->getMessage());
		}

		Http::assertSentCount(3);
	}

	#[Test]
	public function validate_card_not_found_is_handled(): void {
		Http::fake([
			CardService::API_URL . '*' => Http::response(static::CARD_NOT_FOUND, Response::HTTP_BAD_REQUEST)
		]);

		try {
			CardService::fromPasscode(12345678);
		} catch (\InvalidArgumentException $e) {
			$this->assertEquals(static::CARD_NOT_FOUND['error'], $e->getMessage());
		}

		Http::assertSentCount(1);
	}

	#[Test]
	public function validate_bad_responses_are_checked(): void {
		Http::fake([
			CardService::API_URL . '*' => Http::response([], Response::HTTP_BAD_REQUEST)
		]);

		try {
			CardService::fromPasscode(12345678);
		} catch (HttpClientException $e) {
			$this->assertEquals('Invalid card data format received from API.', $e->getMessage());
		}

		Http::assertSentCount(1);
	}

	#[Test]
	public function validate_monster_expectations(): void {
		Http::fake([
			CardService::API_URL . '*' => Http::sequence()
				->push(static::VALID_CARD_DATA['monster'])
				->push(static::VALID_CARD_DATA['fusion'])
				->push(static::VALID_CARD_DATA['ritual'])
				->push(static::VALID_CARD_DATA['unknown_strength'])
		]);

		$card = static::VALID_CARD_DATA['monster']['data'][0];

		// Main Deck Monster
		$service = CardService::fromPasscode(1);
		$this->assertIsObject($service->getCard());
		$this->assertEquals(CardService::normalizePasscode($card['id']), $service->getPasscode());
		$this->assertEquals($card['name'], $service->getName());
		$this->assertEquals($card['desc'], $service->getDescription());
		$this->assertEquals($card['atk'], $service->getAttack());
		$this->assertEquals($card['def'], $service->getDefense());
		$this->assertEquals($card['level'], $service->getLevel());
		$this->assertIsList($service->getMonsterTypes());
		$this->assertCount(count($card['typeline']), $service->getMonsterTypes());
		$this->assertEquals(CardType::MONSTER, $service->getType());
		$this->assertNull($service->getProperty());
		$this->assertEquals(Attribute::from($card['attribute']), $service->getAttribute());
		$this->assertEquals(DeckType::NORMAL, $service->getDeckType());
		$this->assertEquals([['passcode' => $card['card_images'][0]['id'], 'link' => $card['card_images'][0]['image_url']]], $service->getAllImages());

		$card = static::VALID_CARD_DATA['fusion']['data'][0];

		// Extra Deck Monster
		$service = CardService::fromPasscode(1);
		$this->assertIsObject($service->getCard());
		$this->assertEquals(CardService::normalizePasscode($card['id']), $service->getPasscode());
		$this->assertEquals($card['name'], $service->getName());
		$this->assertEquals($card['desc'], $service->getDescription());
		$this->assertEquals($card['atk'], $service->getAttack());
		$this->assertEquals($card['def'], $service->getDefense());
		$this->assertEquals($card['level'], $service->getLevel());
		$this->assertIsList($service->getMonsterTypes());
		$this->assertCount(count($card['typeline']), $service->getMonsterTypes());
		$this->assertEquals(CardType::MONSTER, $service->getType());
		$this->assertNull($service->getProperty());
		$this->assertEquals(Attribute::from($card['attribute']), $service->getAttribute());
		$this->assertEquals(DeckType::EXTRA, $service->getDeckType());
		$this->assertEquals([['passcode' => $card['card_images'][0]['id'], 'link' => $card['card_images'][0]['image_url']]], $service->getAllImages());

		$card = static::VALID_CARD_DATA['ritual']['data'][0];

		// Ritual Monster
		$service = CardService::fromPasscode(1);
		$this->assertIsObject($service->getCard());
		$this->assertEquals(CardService::normalizePasscode($card['id']), $service->getPasscode());
		$this->assertEquals($card['name'], $service->getName());
		$this->assertEquals($card['desc'], $service->getDescription());
		$this->assertEquals($card['atk'], $service->getAttack());
		$this->assertEquals($card['def'], $service->getDefense());
		$this->assertEquals($card['level'], $service->getLevel());
		$this->assertIsList($service->getMonsterTypes());
		$this->assertCount(count($card['typeline']), $service->getMonsterTypes());
		$this->assertEquals(CardType::MONSTER, $service->getType());
		$this->assertNull($service->getProperty());
		$this->assertEquals(Attribute::from($card['attribute']), $service->getAttribute());
		$this->assertEquals(DeckType::RITUAL, $service->getDeckType());
		$this->assertEquals([['passcode' => $card['card_images'][0]['id'], 'link' => $card['card_images'][0]['image_url']]], $service->getAllImages());

		$card = static::VALID_CARD_DATA['unknown_strength']['data'][0];

		// Question Mark Atk/Def Monster
		$service = CardService::fromPasscode(1);
		$this->assertIsObject($service->getCard());
		$this->assertEquals(CardService::normalizePasscode($card['id']), $service->getPasscode());
		$this->assertEquals($card['name'], $service->getName());
		$this->assertEquals($card['desc'], $service->getDescription());
		$this->assertNull($service->getAttack());
		$this->assertNull($service->getDefense());
		$this->assertEquals($card['level'], $service->getLevel());
		$this->assertIsList($service->getMonsterTypes());
		$this->assertCount(count($card['typeline']), $service->getMonsterTypes());
		$this->assertEquals(CardType::MONSTER, $service->getType());
		$this->assertNull($service->getProperty());
		$this->assertEquals(Attribute::from($card['attribute']), $service->getAttribute());
		$this->assertEquals(DeckType::NORMAL, $service->getDeckType());
		$this->assertEquals([['passcode' => $card['card_images'][0]['id'], 'link' => $card['card_images'][0]['image_url']]], $service->getAllImages());

		Http::assertSentCount(4);
	}

	#[Test]
	public function validate_spell_expectations(): void {
		Http::fake([
			CardService::API_URL . '*' => Http::sequence()
				->push(static::VALID_CARD_DATA['spell'])
		]);

		$card = static::VALID_CARD_DATA['spell']['data'][0];

		$service = CardService::fromPasscode(1);
		$this->assertIsObject($service->getCard());
		$this->assertEquals(CardService::normalizePasscode($card['id']), $service->getPasscode());
		$this->assertEquals($card['name'], $service->getName());
		$this->assertEquals($card['desc'], $service->getDescription());
		$this->assertNull($service->getAttack());
		$this->assertNull($service->getDefense());
		$this->assertNull($service->getLevel());
		$this->assertIsList($service->getMonsterTypes());
		$this->assertCount(0, $service->getMonsterTypes());
		$this->assertEquals(CardType::SPELL, $service->getType());
		$this->assertNotNull($service->getProperty());
		$this->assertInstanceOf(Property::class, $service->getProperty());
		$this->assertNull($service->getAttribute());
		$this->assertEquals(DeckType::NORMAL, $service->getDeckType());
		$this->assertEquals([['passcode' => $card['card_images'][0]['id'], 'link' => $card['card_images'][0]['image_url']]], $service->getAllImages());

		Http::assertSentCount(1);
	}

	#[Test]
	public function validate_trap_expectations(): void {
		Http::fake([
			CardService::API_URL . '*' => Http::sequence()
				->push(static::VALID_CARD_DATA['trap'])
		]);

		$card = static::VALID_CARD_DATA['trap']['data'][0];

		$service = CardService::fromPasscode(1);
		$this->assertIsObject($service->getCard());
		$this->assertEquals(CardService::normalizePasscode($card['id']), $service->getPasscode());
		$this->assertEquals($card['name'], $service->getName());
		$this->assertEquals($card['desc'], $service->getDescription());
		$this->assertNull($service->getAttack());
		$this->assertNull($service->getDefense());
		$this->assertNull($service->getLevel());
		$this->assertIsList($service->getMonsterTypes());
		$this->assertCount(0, $service->getMonsterTypes());
		$this->assertEquals(CardType::TRAP, $service->getType());
		$this->assertNotNull($service->getProperty());
		$this->assertInstanceOf(Property::class, $service->getProperty());
		$this->assertNull($service->getAttribute());
		$this->assertEquals(DeckType::NORMAL, $service->getDeckType());
		$this->assertEquals([['passcode' => $card['card_images'][0]['id'], 'link' => $card['card_images'][0]['image_url']]], $service->getAllImages());

		Http::assertSentCount(1);
	}

	protected function tearDown(): void {
		Http::allowStrayRequests();
		parent::tearDown();
	}

	private const array VALID_CARD_DATA = [
		'monster' => [
			'data' => [[
				'id' => 38033121,
				'name' => 'Dark Magician Girl',
				'typeline' => ['Spellcaster', 'Effect'],
				'type' => 'Effect Monster',
				'humanReadableCardType' => 'Effect Monster',
				'frameType' => 'effect',
				'desc' => 'Gains 300 ATK for every "Dark Magician" or "Magician of Black Chaos" in the GY.',
				'race' => 'Spellcaster',
				'atk' => 2000,
				'def' => 1700,
				'level' => 6,
				'attribute' => 'DARK',
				'archetype' => 'Dark Magician',
				'card_images' => [
					[
						'id' => 38033121,
						'image_url' => 'https://images.ygoprodeck.com/images/cards/38033121.jpg',
					]
				]
			]]
		],
		'fusion' => [
			'data' => [[
				'id' => 50237654,
				'name' => 'The Dark Magicians',
				'typeline' => ['Spellcaster', 'Fusion', 'Effect'],
				'type' => 'Fusion Monster',
				'humanReadableCardType' => 'Fusion Effect Monster',
				'frameType' => 'fusion',
				'desc' => '"Dark Magician" or "Dark Magician Girl" + 1 Spellcaster monster\r\nOnce per turn, if a Spell/Trap Card or effect is activated (except during the Damage Step): You can draw 1 card, then if it was a Spell/Trap, you can Set it, and if it was a Trap or Quick-Play Spell, you can activate it this turn. If this card is destroyed: You can Special Summon both 1 "Dark Magician" and 1 "Dark Magician Girl" from your hand, Deck, and/or GY.',
				'race' => 'Spellcaster',
				'atk' => 2800,
				'def' => 2300,
				'level' => 8,
				'attribute' => 'DARK',
				'archetype' => 'Dark Magician',
				'card_images' => [
					[
						'id' => 50237654,
						'image_url' => 'https://images.ygoprodeck.com/images/cards/50237654.jpg',
					]
				]
			]]
		],
		'ritual' => [
			'data' => [[
				'id' => 47963370,
				'name' => 'Magician of Chaos',
				'typeline' => ['Spellcaster', 'Ritual', 'Effect'],
				'type' => 'Ritual Effect Monster',
				'humanReadableCardType' => 'Ritual Effect Monster',
				'frameType' => 'ritual',
				'desc' => 'You can Ritual Summon this card with "Chaos Form". This card\'s name becomes "Dark Magician" while on the field or in the GY. Once per turn, when a Spell/Trap Card or effect is activated (Quick Effect): You can target 1 card on the field; destroy it. If this Ritual Summoned card is destroyed by battle or card effect: You can Special Summon 1 "Chaos" or "Black Luster Soldier" Ritual Monster from your hand, except "Magician of Chaos", ignoring its Summoning conditions.',
				'race' => 'Spellcaster',
				'atk' => 2500,
				'def' => 2100,
				'level' => 7,
				'attribute' => 'DARK',
				'archetype' => 'Dark Magician',
				'card_images' => [
					[
						'id' => 47963370,
						'image_url' => 'https://images.ygoprodeck.com/images/cards/47963370.jpg',
					]
				]
			]]
		],
		'unknown_strength' => [
			'data' => [[
				'id' => 10000020,
				'name' => 'Slifer the Sky Dragon',
				'typeline' => ['Divine-Beast', 'Effect'],
				'type' => 'Effect Monster',
				'humanReadableCardType' => 'Effect Monster',
				'frameType' => 'effect',
				'desc' => 'Requires 3 Tributes to Normal Summon (cannot be Normal Set). This card\'s Normal Summon cannot be negated. When Normal Summoned, cards and effects cannot be activated. Once per turn, during the End Phase, if this card was Special Summoned: Send it to the GY. Gains 1000 ATK/DEF for each card in your hand. If a monster(s) is Normal or Special Summoned to your opponent\'s field in Attack Position: That monster(s) loses 2000 ATK, then if its ATK has been reduced to 0 as a result, destroy it.',
				'race' => 'Divine-Beast',
				'atk' => -1,
				'def' => -1,
				'level' => 10,
				'attribute' => 'DIVINE',
				'archetype' => 'Egyptian God',
				'card_images' => [
					[
						'id' => 10000020,
						'image_url' => 'https://images.ygoprodeck.com/images/cards/10000020.jpg',
					]
				]
			]]
		],
		'spell' => [
			'data' => [[
				'id' => 49702428,
				'name' => 'Dark Burning Attack',
				'type' => 'Spell Card',
				'humanReadableCardType' => 'Normal Spell',
				'frameType' => 'spell',
				'desc' => 'If you control a "Dark Magician Girl" monster: Destroy all face-up monsters your opponent controls.',
				'race' => 'Normal',
				'archetype' => 'Dark Magician',
				'card_images' => [
					[
						'id' => 49702428,
						'image_url' => 'https://images.ygoprodeck.com/images/cards/49702428.jpg',
					]
				]
			]]
		],
		'trap' => [
			'data' => [[
				'id' => 86509711,
				'name' => 'Magicians\' Combination',
				'type' => 'Trap Card',
				'humanReadableCardType' => 'Continuous Trap',
				'frameType' => 'trap',
				'desc' => 'Once per turn, when a card or effect is activated (except during the Damage Step): You can Tribute 1 "Dark Magician" or 1 "Dark Magician Girl"; Special Summon 1 "Dark Magician" or 1 "Dark Magician Girl" from your hand or GY, with a different name from the Tributed monster, and if you do, negate that activated effect. If this face-up card is sent from the Spell & Trap Zone to the GY: You can destroy 1 card on the field.',
				'race' => 'Continuous',
				'archetype' => 'Dark Magician',
				'card_images' => [
					[
						'id' => 86509711,
						'image_url' => 'https://images.ygoprodeck.com/images/cards/86509711.jpg',
					]
				]
			]]
		]
	];

	private const CARD_NOT_FOUND = [
		'error' => 'Card not found.'
	];
}
