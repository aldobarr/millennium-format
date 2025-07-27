<?php

namespace App\Models;

use App\Enums\CardType;
use App\Enums\DeckType;
use App\Enums\MonsterProperty;
use App\Models\Traits\HasTableName;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class Card extends Model {
	use HasFactory, HasTableName;

	public const array ALLOWED_IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg'];
	public const int MAX_IMAGE_SIZE = 2097152; // 2 MB in bytes

	protected $casts = [
		'type' => CardType::class,
		'deck_type' => DeckType::class,
		'legendary' => 'boolean',
		'is_errata' => 'boolean',
	];

	protected static function booted(): void {
		static::created(function(Card $card) {
			$card->storeImage();
		});

		static::deleting(function(Card $card) {
			$card->alternates()->each(fn($alternate) => $alternate->delete());
		});

		static::deleted(function(Card $card) {
			$card->deleteImage(true);
		});
	}

	protected function fullType(): Attribute {
		return Attribute::make(get: fn() => match ($this->type) {
			CardType::MONSTER => trim(
				$this->monsterTypes->reduce(fn($carry, $mt) =>
					($carry ?? '')
					. (MonsterProperty::has($mt->type) ? MonsterProperty::from($mt->type)->value : ''))
				. ' ' . $this->type->value
			),
			default => $this->type->value,
		});
	}

	protected function localImage(): Attribute {
		return Attribute::make(get: function(string|null $value, array $attributes) {
			if (empty($value)) {
				return $attributes['image'];
			}

			/** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
			$disk = Storage::disk('r2');
			return $disk->url($value);
		});
	}

	protected function description(): Attribute {
		return Attribute::make(get: fn(string $value) => $this->is_errata ? $this->errata_description : $value);
	}

	public function deleteImage(bool $skip_clear = false): void {
		if (!empty($this->attributes['local_image'])) {
			try {
				Storage::disk('r2')->delete($this->attributes['local_image']);

				if (!$skip_clear) {
					$this->local_image = null;
					$this->save();
				}
			} catch (\Exception) {}
		}
	}

	public function storeImage(): void {
		$pathinfo = pathinfo($this->image);
		if (empty($pathinfo) || empty($pathinfo['extension'])) {
			return;
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
			return;
		}

		$ext = strcasecmp($ext, 'jpeg') !== 0 ? $ext : 'jpg';
		$response = Http::timeout(30)->retry(
			3, fn(int $attempt) => pow($attempt, 3),
			fn(\Exception $e) => !($e instanceof RequestException) || !$e->response->clientError(),
			false
		)->get($this->image);

		if (!$response->successful()) {
			return;
		}

		$image_path = "{$this->id}.{$ext}";
		if (!Storage::disk('r2')->put($image_path, $response->getBody(), 'public')) {
			throw new \Exception('Failed to store card image please try again.');
		}

		$this->local_image = $image_path;
		$this->save();
	}

	public function alternates(): HasMany {
		return $this->hasMany(CardAlternate::class);
	}

	public function categories(): BelongsToMany {
		return $this->belongsToMany(Category::class);
	}

	public function monsterTypes(): BelongsToMany {
		return $this->belongsToMany(MonsterType::class);
	}

	public function tags(): BelongsToMany {
		return $this->belongsToMany(Tag::class);
	}
}
