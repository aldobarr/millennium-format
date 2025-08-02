<?php

namespace Tests\Feature\Public;

use App\Models\Card;
use App\Models\CardAlternate;
use App\Models\Deck;
use App\Services\CardService;
use PHPUnit\Framework\Attributes\Test;
use Symfony\Component\HttpFoundation\Response;
use Tests\TestCase;

class DeckBuilderTest extends TestCase {
	public function setUp(): void {
		parent::setUp();

		$this->logout();

		$max = random_int(50, 100);
		for ($i = 1; $i <= $max; $i++) {
			$passcode = CardService::normalizePasscode(fake()->unique()->numerify('########'));
			Card::factory(state: ['passcode' => $passcode])->has(CardAlternate::factory(state: ['passcode' => $passcode]), 'alternates')->create();
		}
	}

	#[Test]
	public function public_routes_are_accessible_without_authentication(): void {
		$response = $this->get('/api/search');
		$response->assertStatus(Response::HTTP_OK);
		$response->assertJson(['success' => true]);

		$response = $this->get('/api/cards/masters');
		$response->assertStatus(Response::HTTP_OK);
		$response->assertJson(['success' => true]);

		$response = $this->get('/api/decks/ydke/cards');
		$this->assertContains($response->getStatusCode(), [Response::HTTP_OK, Response::HTTP_UNPROCESSABLE_ENTITY]);

		$response = $this->get('/api/decks/ydke/validate');
		$this->assertContains($response->getStatusCode(), [Response::HTTP_OK, Response::HTTP_UNPROCESSABLE_ENTITY]);

		$response = $this->put('/api/decks/validate');
		$this->assertContains($response->getStatusCode(), [Response::HTTP_OK, Response::HTTP_UNPROCESSABLE_ENTITY]);
	}

	#[Test]
	public function search_returns_paginated_list_of_cards(): void {
		$response = $this->get('/api/search');
		$response->assertStatus(Response::HTTP_OK);
		$response->assertJson(['success' => true]);
		$this->assertPaginatedApiResponseStructure($response, [
			'*' => [
				'id',
				'name',
				'deckType',
				'level',
				'image',
				'limit',
				'legendary',
				'tags'
			],
		]);

		$this->assertEquals(Card::count(), $response->json('meta.total'));
	}

	#[Test]
	public function private_routes_are_inaccessible_without_authentication(): void {
		$deck = Deck::factory()->create(['name' => 'Test Deck']);

		$response = $this->post('/api/decks', []);
		$response->assertStatus(Response::HTTP_UNAUTHORIZED);
		$response->assertJson([
			'success' => false,
			'errors' => ['Unauthenticated.']
		]);

		$response = $this->post('/api/decks', []);
		$response->assertStatus(Response::HTTP_UNAUTHORIZED);
		$response->assertJson([
			'success' => false,
			'errors' => ['Unauthenticated.']
		]);

		$response = $this->get('/api/decks');
		$response->assertStatus(Response::HTTP_UNAUTHORIZED);
		$response->assertJson([
			'success' => false,
			'errors' => ['Unauthenticated.']
		]);

		$this->assertDatabaseHas('decks', ['id' => $deck->id]);

		$response = $this->get('/api/decks/' . $deck->id);
		$response->assertStatus(Response::HTTP_UNAUTHORIZED);
		$response->assertJson([
			'success' => false,
			'errors' => ['Unauthenticated.']
		]);

		$response = $this->get('/api/decks/' . $deck->id . '/download');
		$response->assertStatus(Response::HTTP_UNAUTHORIZED);
		$response->assertJson([
			'success' => false,
			'errors' => ['Unauthenticated.']
		]);

		$response = $this->get('/api/decks/' . $deck->id . '/export');
		$response->assertStatus(Response::HTTP_UNAUTHORIZED);
		$response->assertJson([
			'success' => false,
			'errors' => ['Unauthenticated.']
		]);

		$response = $this->post('/api/decks/' . $deck->id . '/duplicate');
		$response->assertStatus(Response::HTTP_UNAUTHORIZED);
		$response->assertJson([
			'success' => false,
			'errors' => ['Unauthenticated.']
		]);

		$this->assertEquals(1, Deck::count());

		$new_name = 'Updated Deck Name';
		$response = $this->put('/api/decks/' . $deck->id, ['name' => $new_name]);
		$response->assertStatus(Response::HTTP_UNAUTHORIZED);
		$response->assertJson([
			'success' => false,
			'errors' => ['Unauthenticated.']
		]);

		$this->assertDatabaseHas('decks', ['id' => $deck->id]);
		$this->assertDatabaseMissing('decks', ['id' => $deck->id, 'name' => $new_name]);

		$response = $this->delete('/api/decks/' . $deck->id);
		$response->assertStatus(Response::HTTP_UNAUTHORIZED);
		$response->assertJson([
			'success' => false,
			'errors' => ['Unauthenticated.']
		]);

		$this->assertDatabaseHas('decks', ['id' => $deck->id]);
	}
}
