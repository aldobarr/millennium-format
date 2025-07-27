<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

class CardResource extends JsonResource {
	/**
	 * Transform the resource into an array.
	 *
	 * @return array<string, mixed>
	 */
	public function toArray(Request $request): array {
		return [
			'id' => $this->id,
			'name' => $this->name,
			'description' => $this->description,
			'type' => $this->type,
			'deckType' => $this->deck_type,
			'level' => $this->level,
			'image' => $this->local_image,
			'limit' => $this->limit,
			'legendary' => $this->legendary,
			'isErrata' => $this->is_errata,
			'alternates' => $this->whenLoaded('alternates', fn() => $this->alternates->map(fn($alternate) => [
				'id' => $alternate->id,
				'image' => $alternate->image,
			])),
			'tags' => TagResource::collection($this->tags),
		];
	}
}
