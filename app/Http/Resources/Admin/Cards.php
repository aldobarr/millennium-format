<?php

namespace App\Http\Resources\Admin;

use App\Http\Resources\ResourceCollection;

class Cards extends ResourceCollection {
	public $collects = CardResource::class;
}
