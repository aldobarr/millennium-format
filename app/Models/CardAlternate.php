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
		)->get($this->image);

		if (!$response->successful()) {
			return;
		}

		$this->image = "{$this->card_id}/{$this->id}.{$ext}";
		if (!Storage::disk('r2')->put($this->image, $response->getBody(), 'public')) {
			throw new \Exception('Failed to store card image please try again.');
		}

		$this->save();
	}

	public function card(): BelongsTo {
		return $this->belongsTo(Card::class);
	}
}
