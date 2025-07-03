<?php

namespace App\Models;

use App\Enums\CardType;
use App\Enums\DeckType;
use App\Models\Traits\HasTableName;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class Card extends Model {
	use HasFactory, HasTableName;

	protected $casts = [
		'type' => CardType::class,
		'deck_type' => DeckType::class,
		'legendary' => 'boolean',
	];

	protected function image(): Attribute {
		return Attribute::make(get: function(string $value, array $attributes): string {
			if (Storage::disk('public')->exists("images/cards/{$attributes['id']}.png")) {
				return asset("storage/images/cards/{$attributes['id']}.png");
			} else if (Storage::disk('public')->exists("images/cards/{$attributes['id']}.jpg")) {
				return asset("storage/images/cards/{$attributes['id']}.jpg");
			}

			return $this->storeImage();
		});
	}

	public function categories(): BelongsToMany {
		return $this->belongsToMany(Category::class);
	}

	public function tags(): BelongsToMany {
		return $this->belongsToMany(Tag::class);
	}

	public function storeImage(): string {
		if (Storage::disk('public')->exists("images/cards/{$this->id}.png")) {
			return asset("storage/images/cards/{$this->id}.png");
		}

		if (Storage::disk('public')->exists("images/cards/{$this->id}.jpg")) {
			return asset("storage/images/cards/{$this->id}.jpg");
		}

		$original = $this->attributes['image'];
		$pathinfo = pathinfo($original);
		if (empty($pathinfo) || empty($pathinfo['extension'])) {
			return $original;
		}

		$ext = $pathinfo['extension'];
		if (strcasecmp($ext, 'png') !== 0 && strcasecmp($ext, 'jpg') !== 0) {
			return $original;
		}

		$response = Http::timeout(30)->get($original);
		if (!$response->ok()) {
			return $original;
		}

		if (!Storage::disk('public')->put("images/cards/{$this->id}.{$ext}", $response->getBody())) {
			return $original;
		}

		return asset("storage/images/cards/{$this->id}.{$ext}");
	}
}
