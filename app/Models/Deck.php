<?php

namespace App\Models;

use App\Models\Traits\HasTableName;
use App\Services\DeckService;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Deck extends Model {
	use HasFactory, HasTableName;

	protected $casts = [
		'is_public' => 'boolean',
	];

	protected function isValid(): Attribute {
		return Attribute::make(
			get: fn() => DeckService::isDeckValid($this)
		);
	}

	public function user(): BelongsTo {
		return $this->belongsTo(User::class);
	}

	public function categories(): HasMany {
		return $this->hasMany(Category::class)->orderBy('order');
	}
}
