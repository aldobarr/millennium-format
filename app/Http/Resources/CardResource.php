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
			'image' => $this->image,
			'limit' => $this->limit
		];
	}
}
