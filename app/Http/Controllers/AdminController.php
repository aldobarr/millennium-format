<?php

namespace App\Http\Controllers;

use App\Http\Middleware\EnsureIsAdmin;
use Illuminate\Routing\Controller;

class AdminController extends Controller {
	public const int RESULTS_PER_PAGE = 20;

	public function __construct() {
		$this->middleware(EnsureIsAdmin::class);
	}
}
