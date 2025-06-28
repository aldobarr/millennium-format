<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Category extends Model {
	use HasFactory;

	public function cards(): BelongsToMany {
		return $this->belongsToMany(Card::class);
	}

	public function deck(): BelongsTo {
		return $this->belongsTo(Deck::class);
	}
}
