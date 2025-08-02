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
		static::deleting(function(Card $card) {
			$card->alternates()->each(fn($alternate) => $alternate->delete());
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

	protected function description(): Attribute {
		return Attribute::make(get: fn(string $value) => $this->is_errata ? $this->errata_description : $value);
	}

	public function alternates(): HasMany {
		return $this->hasMany(CardAlternate::class);
	}

	public function categories(): BelongsToMany {
		return $this->belongsToMany(Category::class);
	}

	public function image(): Attribute {
		return Attribute::make(get: fn() => ($this->alternates->firstWhere('passcode', $this->passcode) ?? $this->alternates->first())->image);
	}

	public function monsterTypes(): BelongsToMany {
		return $this->belongsToMany(MonsterType::class);
	}

	public function tags(): BelongsToMany {
		return $this->belongsToMany(Tag::class);
	}
}
