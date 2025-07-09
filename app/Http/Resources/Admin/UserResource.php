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
			'decksCount' => $this->decks_count,
			'isAdmin' => $this->is_admin,
			'createdAt' => $this->created_at
		];
	}
}
