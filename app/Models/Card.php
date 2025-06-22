<?php

namespace App\Models;

use App\Enums\DeckType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Card extends Model {
	use HasFactory;

	protected $casts = [
		'deck_type' => DeckType::class
	];

	public function category(): BelongsTo {
		return $this->belongsTo(Category::class);
	}

	public function tags(): BelongsToMany {
		return $this->belongsToMany(Tag::class);
	}
}
