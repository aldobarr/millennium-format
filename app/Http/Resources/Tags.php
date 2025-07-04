<?php

namespace App\Http\Resources;

use App\Http\Resources\ResourceCollection;

class Tags extends ResourceCollection {
	public $collects = TagResource::class;
}
