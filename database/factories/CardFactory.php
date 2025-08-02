<?php

namespace Database\Factories;

use App\Enums\Attribute;
use App\Enums\CardType;
use App\Enums\DeckType;
use App\Enums\Property;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Card>
 */
class CardFactory extends Factory {
	/**
	 * Define the model's default state.
	 *
	 * @return array<string, mixed>
	 */
	public function definition(): array {
		$type = fake()->randomElement(CardType::casesRaw());
		$is_monster = strcmp($type, CardType::MONSTER->value) === 0;

		return [
			'name' => fake()->unique()->name(),
			'type' => $type,
			'deck_type' => fake()->randomElement(DeckType::casesRaw()),
			'attribute' => $is_monster ? fake()->randomElement(Attribute::casesRaw()) : null,
			'property' => !$is_monster ? fake()->randomElement(Property::casesRaw()) : null,
			'level' => $is_monster ? fake()->numberBetween(1, 12) : null,
			'attack' => $is_monster ? fake()->numberBetween(0, 5000) : null,
			'defense' => $is_monster ? fake()->numberBetween(0, 5000) : null,
			'description' => fake()->text(),
			'passcode' => fake()->unique()->numerify('########'),
			'link' => fake()->url(),
		];
	}
}
