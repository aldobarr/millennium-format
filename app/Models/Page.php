<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Page extends Model {
	protected $casts = [
		'is_home' => 'boolean',
	];

	public function tabs(): HasMany {
		return $this->hasMany(Tab::class);
	}
}
