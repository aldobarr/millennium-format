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
use Illuminate\Support\Facades\App;
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
			$card->deleteImage();
		});
	}

	protected function localImage(): Attribute {
		return Attribute::make(get: fn(string|null $value, array $attributes) => is_null($value) ? $attributes['image'] : Storage::disk('r2')->url($value));
	}

	public function deleteImage(): void {
		if (!empty($this->attributes['local_image'])) {
			Storage::disk('r2')->delete($this->attributes['local_image']);

			try {
				$this->local_image = null;
				$this->save();
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
		if (!App::isProduction()) {
			return;
		}

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

		Storage::disk('r2')->put("{$this->id}.{$ext}", $response->getBody(), 'public');
		$this->local_image = "{$this->id}.{$ext}";
		$this->save();
	}
}
