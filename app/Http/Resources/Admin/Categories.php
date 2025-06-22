<?php

namespace App\Http\Resources\Admin;

use App\Http\Resources\ResourceCollection;

class Categories extends ResourceCollection {
	public $collects = CategoryResource::class;
}
