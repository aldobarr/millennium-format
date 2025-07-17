<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Tab extends Model {
	public function page(): BelongsTo {
		return $this->belongsTo(Page::class);
	}
}
