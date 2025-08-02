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
			'type' => $this->type,
			'description' => $this->description,
			'image' => $this->image,
			'limit' => $this->limit,
			'legendary' => $this->legendary,
			'isErrata' => $this->is_errata,
			'createdAt' => $this->created_at,
			'tags' => TagResource::collection($this->whenLoaded('tags'))
		];
	}
}
