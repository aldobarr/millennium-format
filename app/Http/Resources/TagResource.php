<?php

namespace App\Http\Resources;

use App\Http\Resources\JsonResource;
use Illuminate\Http\Request;

class TagResource extends JsonResource {
	/**
	 * Transform the resource into an array.
	 *
	 * @return array<string, mixed>
	 */
	public function toArray(Request $request): array {
		return [
			'id' => $this->id,
			'name' => $this->name,
		];
	}
}
