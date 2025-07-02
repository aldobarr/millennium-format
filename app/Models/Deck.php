<?php

namespace App\Models;

use App\Models\Traits\HasTableName;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Deck extends Model {
	use HasFactory, HasTableName;

	protected $casts = [
		'is_public' => 'boolean',
	];

	public function user(): BelongsTo {
		return $this->belongsTo(User::class);
	}

	public function categories(): HasMany {
		return $this->hasMany(Category::class);
	}
}
