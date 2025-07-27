<?php

namespace App\Models;

use App\Models\Traits\HasTableName;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class CardAlternate extends Model {
	use HasFactory, HasTableName;

	/**
	 * The attributes that are mass assignable.
	 *
	 * @var array<int, string>
	 */
	protected $fillable = ['passcode', 'link'];

	protected static function booted(): void {
		static::created(function(CardAlternate $alternate) {
			$alternate->storeImage();
		});

		static::deleted(function(CardAlternate $alternate) {
			$alternate->deleteImage(true);
		});
	}

	protected function image(): Attribute {
		return Attribute::make(get: function(string|null $value, array $attributes) {
			if (empty($value)) {
				return $attributes['link'];
			}

			/** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
			$disk = Storage::disk('r2');
			return $disk->url($value);
		});
	}

	public function storeImage(): void {
		$pathinfo = pathinfo($this->link);
		if (empty($pathinfo) || empty($pathinfo['extension'])) {
			return;
		}

		$allowed = false;
		$ext = strtolower($pathinfo['extension']);
		foreach (Card::ALLOWED_IMAGE_EXTENSIONS as $allowed_ext) {
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
		)->get($this->link);

		if (!$response->successful()) {
			return;
		}

		$image_path = "{$this->card_id}/{$this->id}.{$ext}";
		if (!Storage::disk('r2')->put($image_path, $response->getBody(), 'public')) {
			throw new \Exception('Failed to store card image please try again.');
		}

		$this->image = $image_path;
		$this->save();
	}

	public function deleteImage(bool $skip_clear = false): void {
		if (!empty($this->attributes['image'])) {
			try {
				Storage::disk('r2')->delete($this->attributes['image']);

				if (!$skip_clear) {
					$this->image = null;
					$this->save();
				}
			} catch (\Exception) {}
		}
	}

	public function card(): BelongsTo {
		return $this->belongsTo(Card::class);
	}
}
