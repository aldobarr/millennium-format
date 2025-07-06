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

	public const array ALLOWED_IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg'];
	public const int MAX_IMAGE_SIZE = 2097152; // 2 MB in bytes
	public const int MIN_DISK_SPACE = 10485760; // 10 MB in bytes

	protected $casts = [
		'type' => CardType::class,
		'deck_type' => DeckType::class,
		'legendary' => 'boolean',
	];

	protected static function booted(): void {
		static::deleted(function(Card $card) {
			$card->deleteImage();
		});
	}

	protected function image(): Attribute {
		return Attribute::make(get: function(string $value, array $attributes): string {
			foreach (static::ALLOWED_IMAGE_EXTENSIONS as $ext) {
				if (Storage::disk('public')->exists("images/cards/{$attributes['id']}.{$ext}")) {
					return asset("storage/images/cards/{$attributes['id']}.{$ext}");
				}
			}

			return $this->storeImage();
		});
	}

	public function deleteImage(): void {
		foreach (static::ALLOWED_IMAGE_EXTENSIONS as $ext) {
			if (Storage::disk('public')->exists("images/cards/{$this->id}.{$ext}")) {
				Storage::disk('public')->delete("images/cards/{$this->id}.{$ext}");
			}
		}
	}

	public function categories(): BelongsToMany {
		return $this->belongsToMany(Category::class);
	}

	public function tags(): BelongsToMany {
		return $this->belongsToMany(Tag::class);
	}

	public function monsterTypes(): BelongsToMany {
		return $this->belongsToMany(MonsterType::class);
	}

	public function storeImage(): string {
		$original = $this->attributes['image'];
		$disk_space = disk_free_space(Storage::disk('public')->path('images'));
		if ($disk_space === false || $disk_space < static::MIN_DISK_SPACE) {
			return $original;
		}

		foreach (static::ALLOWED_IMAGE_EXTENSIONS as $ext) {
			if (Storage::disk('public')->exists("images/cards/{$this->id}.{$ext}")) {
				return asset("storage/images/cards/{$this->id}.{$ext}");
			}
		}

		$pathinfo = pathinfo($original);
		if (empty($pathinfo) || empty($pathinfo['extension'])) {
			return $original;
		}

		$allowed = false;
		$ext = strtolower($pathinfo['extension']);
		foreach (static::ALLOWED_IMAGE_EXTENSIONS as $allowed_ext) {
			if (strcasecmp($ext, $allowed_ext) === 0) {
				$allowed = true;
				break;
			}
		}

		if (!$allowed) {
			return $original;
		}

		$ext = strcasecmp($ext, 'jpeg') !== 0 ? $ext : 'jpg';
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
