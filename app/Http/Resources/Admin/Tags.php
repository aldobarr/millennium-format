<?php

namespace App\Http\Resources\Admin;

use App\Http\Resources\ResourceCollection;

class Tags extends ResourceCollection {
	public $collects = TagResource::class;
}
