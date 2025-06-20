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
			'is_admin' => $this->is_admin,
			'pfp' => $this->pfp ? asset($this->pfp) : null
		];
	}
}
