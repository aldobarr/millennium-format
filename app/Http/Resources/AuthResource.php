<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

class AuthResource extends JsonResource {
	public $with = [];

	/**
	 * Transform the resource into an array.
	 *
	 * @return array<string, mixed>
	 */
	public function toArray(Request $request): array {
		return [
			'token' => $this->token,
			'user' => !empty($this->user) ? new UserResource($this->user) : null
		];
	}
}
