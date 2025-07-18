<?php

namespace App\Models;

use App\Models\Traits\HasTableName;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Page extends Model {
	use HasFactory, HasTableName;

	protected $casts = [
		'is_home' => 'boolean',
	];

	public function tabs(): HasMany {
		return $this->hasMany(Tab::class)->orderBy('order');
	}
}
