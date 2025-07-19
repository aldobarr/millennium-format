<?php

namespace Database\Factories;

use App\Http\Requests\Admin\Page;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Tab>
 */
class TabFactory extends Factory {
	/**
	 * Define the model's default state.
	 *
	 * @return array<string, mixed>
	 */
	public function definition(): array {
		return [
			'page_id' => Page::factory(),
			'name' => fake()->name(),
			'content' => fake()->optional()->text(),
		];
	}
}
