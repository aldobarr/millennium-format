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
			'type' => $this->type,
			'deckType' => $this->deck_type,
			'level' => $this->level,
			'image' => $this->image,
			'limit' => $this->limit,
			'legendary' => $this->legendary,
			'tags' => $this->tags->map(fn($tag) => ['id' => $tag->id, 'name' => $tag->name])->toArray(),
		];
	}
}
