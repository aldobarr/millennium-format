<?php

namespace App\Models;

use App\Enums\CardType;
use App\Enums\DeckType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Card extends Model {
	use HasFactory;

	protected $casts = [
		'type' => CardType::class,
		'deck_type' => DeckType::class,
		'legendary' => 'boolean',
	];

	public function categories(): BelongsToMany {
		return $this->belongsToMany(Category::class);
	}

	public function tags(): BelongsToMany {
		return $this->belongsToMany(Tag::class);
	}
}
