<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Page>
 */
class PageFactory extends Factory {
	/**
	 * Define the model's default state.
	 *
	 * @return array<string, mixed>
	 */
	public function definition(): array {
		return [
			'name' => fake()->name(),
			'slug' => fake()->unique()->randomAscii(),
			'order' => fake()->randomNumber(1),
			'header' => fake()->optional()->text(),
			'footer' => fake()->optional()->text(),
			'is_home' => false,
			'is_visible' => true,
		];
	}
}
