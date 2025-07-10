<?php

use App\Models\Deck;
use PHPUnit\Framework\Attributes\Test;
use Symfony\Component\HttpFoundation\Response;
use Tests\TestCase;

class DeckBuilderTest extends TestCase {
	public function setUp(): void {
		parent::setUp();

		$this->logout();
	}

	#[Test]
	public function public_routes_are_accessible_while_authenticated(): void {
		$response = $this->get('/api/search');
		$response->assertStatus(Response::HTTP_OK);
		$response->assertJson(['success' => true]);

		$response = $this->get('/api/cards/masters');
		$response->assertStatus(Response::HTTP_OK);
		$response->assertJson(['success' => true]);

		$response = $this->get('/api/decks/validate');
		$this->assertContains($response->getStatusCode(), [Response::HTTP_OK, Response::HTTP_UNPROCESSABLE_ENTITY]);
	}

	#[Test]
	public function public_routes_are_inaccessible_without_authentication(): void {
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
