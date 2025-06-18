<?php

namespace App\Models;

use App\Enums\DeckType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Card extends Model {
	use HasFactory;

	protected $casts = [
		'deck_type' => DeckType::class
	];

	public function category(){
		return $this->belongsTo(Category::class);
	}

	public function tags() {
		return $this->belongsToMany(Tag::class);
	}
}
