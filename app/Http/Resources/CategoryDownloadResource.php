<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

class CategoryDownloadResource extends JsonResource {
	/**
	 * Transform the resource into an array.
	 *
	 * @return array<string, mixed>
	 */
	public function toArray(Request $request): array {
		return [
			'id' => $this->uuid,
			'name' => $this->name,
			'type' => $this->type,
			'order' => $this->order,
			'cards' => $this->cards->map(fn($card) => $card->id)->toArray(),
		];
	}
}
