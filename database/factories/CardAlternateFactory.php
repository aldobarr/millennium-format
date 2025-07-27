<?php

namespace Database\Factories;

use App\Models\Card;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\CardAlternate>
 */
class CardAlternateFactory extends Factory {
	/**
	 * Define the model's default state.
	 *
	 * @return array<string, mixed>
	 */
	public function definition(): array {
		return [
			'card_id' => Card::factory(),
			'passcode' => fake()->numerify('########'),
			'link' => $this->faker->url(),
		];
	}
}
