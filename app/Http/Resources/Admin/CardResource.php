<?php

namespace App\Http\Resources\Admin;

use App\Http\Resources\JsonResource;
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
			'image' => $this->image,
			'deck_type' => $this->deck_type,
			'limit' => $this->limit,
			'created_at' => $this->created_at,
			'category' => new CategoryResource($this->whenLoaded('category')),
			'tags' => TagResource::collection($this->whenLoaded('tags'))
		];
	}
}
