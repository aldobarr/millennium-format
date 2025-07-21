<?php

namespace App\Models;

use App\Enums\CardType;
use App\Enums\DeckType;
use App\Models\Traits\HasTableName;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
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
	];

	protected static function booted(): void {
		static::created(function(Card $card) {
			$card->storeImage();
		});

		static::deleted(function(Card $card) {
			$card->deleteImage(true);
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

	public function categories(): BelongsToMany {
		return $this->belongsToMany(Category::class);
	}

	public function tags(): BelongsToMany {
		return $this->belongsToMany(Tag::class);
	}

	public function monsterTypes(): BelongsToMany {
		return $this->belongsToMany(MonsterType::class);
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

		if (!Storage::disk('r2')->put("{$this->id}.{$ext}", $response->getBody(), 'public')) {
			throw new \Exception('Failed to store card image please try again.');
		}

		$this->local_image = "{$this->id}.{$ext}";
		$this->save();
	}
}
