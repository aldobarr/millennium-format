<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

class UserResource extends JsonResource {
	/**
	 * Transform the resource into an array.
	 *
	 * @return array<string, mixed>
	 */
	public function toArray(Request $request): array {
		return [
			'name' => $this->name,
			'email' => $this->email,
			'isAdmin' => $this->is_admin,
			'pfp' => $this->pfp ? asset($this->pfp) : null
		];
	}
}
