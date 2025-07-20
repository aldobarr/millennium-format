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
			'slug' => $this->slug,
			'parent' => new static($this->whenLoaded('parent')),
			'order' => $this->order,
			'header' => $this->header,
			'footer' => $this->footer,
			'isHome' => $this->is_home,
			'isPlaceholder' => $this->is_placeholder,
			'isVisible' => $this->is_visible,
			'createdAt' => $this->created_at,
			'updatedAt' => $this->updated_at,
			'children' => static::collection($this->whenLoaded('children')),
			'tabs' => TabResource::collection($this->whenLoaded('tabs')),
		];
	}
}
