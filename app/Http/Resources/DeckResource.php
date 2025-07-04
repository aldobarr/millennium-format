<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

class DeckResource extends JsonResource {
	/**
	 * Transform the resource into an array.
	 *
	 * @return array<string, mixed>
	 */
	public function toArray(Request $request): array {
		return [
			'id' => $this->id,
			'name' => $this->name,
			'notes' => $this->notes,
			'isValid' => $this->is_valid,
			'categories' => CategoryResource::collection($this->categories),
			'canEdit' => $request->user()->can('update', $this->resource),
		];
	}
}
