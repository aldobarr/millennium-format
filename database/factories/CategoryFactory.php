<?php

namespace Database\Factories;

use App\Enums\CategoryType;
use App\Models\Deck;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Category>
 */
class CategoryFactory extends Factory {
	/**
	 * Define the model's default state.
	 *
	 * @return array<string, mixed>
	 */
	public function definition(): array {
		return [
			'uuid' => fake()->uuid(),
			'name' => fake()->words(asText: true),
			'type' => fake()->randomElement(CategoryType::casesRaw()),
			'deck_id' => Deck::factory(),
			'order' => fake()->numberBetween(1, 100),
		];
	}
}
