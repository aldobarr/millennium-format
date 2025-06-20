<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

class EmailValidationResource extends JsonResource {
	public $with = [];

	/**
	 * Transform the resource into an array.
	 *
	 * @return array<string, mixed>
	 */
	public function toArray(Request $request): array {
		return [
			'expiration' => $this->expiration
		];
	}
}
