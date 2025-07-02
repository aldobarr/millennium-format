<?php

namespace App\Models;

use App\Models\Traits\HasTableName;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Category extends Model {
	use HasFactory, HasTableName;

	/**
	 * The attributes that are mass assignable.
	 *
	 * @var array<int, string>
	 */
	protected $fillable = ['uuid', 'name', 'type', 'order'];

	public function cards(): BelongsToMany {
		return $this->belongsToMany(Card::class)->withPivot('order')->orderByPivot('order', 'asc');
	}

	public function deck(): BelongsTo {
		return $this->belongsTo(Deck::class);
	}
}
