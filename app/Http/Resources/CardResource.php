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
			'image' => $this->image,
			'limit' => $this->limit,
			'legendary' => $this->legendary,
			'isErrata' => $this->is_errata,
			'alternate' => $this->whenPivotLoaded('card_category', function() {
				$alternate = $this->alternates->firstWhere('id', $this->pivot->card_alternate_id);
				return $alternate ? [
					'id' => $alternate->id,
					'passcode' => $alternate->passcode,
					'image' => $alternate->image,
				] : null;
			}),
			'alternates' => $this->whenLoaded('alternates', fn() => $this->alternates->map(fn($alternate) => [
				'id' => $alternate->id,
				'passcode' => $alternate->passcode,
				'image' => $alternate->image,
			])),
			'ownership' => $this->whenPivotLoaded('card_category', fn() => $this->pivot->ownership),
			'tags' => TagResource::collection($this->tags),
		];
	}
}
