<?php

namespace App\Http\Resources\Admin;

use App\Http\Resources\JsonResource;
use Illuminate\Http\Request;

class UserResource extends JsonResource {
	/**
	 * Transform the resource into an array.
	 *
	 * @return array<string, mixed>
	 */
	public function toArray(Request $request): array {
		return [
			'id' => $this->id,
			'name' => $this->name,
			'email' => $this->email,
			'decks_count' => $this->decks_count,
			'is_admin' => $this->is_admin,
			'created_at' => $this->created_at
		];
	}
}
