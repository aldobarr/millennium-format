<?php

namespace App\Http\Resources\Admin;

use App\Http\Resources\ResourceCollection;

class Users extends ResourceCollection {
	public $collects = UserResource::class;
}
