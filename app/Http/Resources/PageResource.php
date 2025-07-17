<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

class PageResource extends JsonResource {
	/**
	 * Transform the resource into an array.
	 *
	 * @return array<string, mixed>
	 */
	public function toArray(Request $request): array {
		return [
			'id' => $this->id,
			'name' => $this->name,
			'order' => $this->order,
			'header' => $this->header,
			'footer' => $this->footer,
			'isHome' => $this->is_home,
			'createdAt' => $this->created_at,
			'updatedAt' => $this->updated_at,
			'tabs' => TabResource::collection($this->whenLoaded('tabs')),
		];
	}
}
