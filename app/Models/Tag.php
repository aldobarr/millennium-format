<?php

namespace App\Models;

use App\Models\Traits\HasTableName;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Tag extends Model {
	use HasFactory, HasTableName;

	public function cards(): BelongsToMany {
		return $this->belongsToMany(Card::class);
	}
}
