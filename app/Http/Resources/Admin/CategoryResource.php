<?php

namespace App\Http\Resources\Admin;

use App\Http\Resources\JsonResource;
use Illuminate\Http\Request;

class CategoryResource extends JsonResource {
	/**
	 * Transform the resource into an array.
	 *
	 * @return array<string, mixed>
	 */
	public function toArray(Request $request): array {
		return [
			'id' => $this->id,
			'name' => $this->name,
			'cards_count' => $this->cards_count,
			'created_at' => $this->created_at
		];
	}
}
