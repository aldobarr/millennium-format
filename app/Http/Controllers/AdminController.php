<?php

namespace App\Http\Controllers;

use App\Http\Middleware\EnsureIsAdmin;
use App\Services\DataService;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Request as RequestFacade;

class AdminController extends Controller {
	public const int RESULTS_PER_PAGE = 20;

	public function __construct() {
		$this->middleware(EnsureIsAdmin::class);
	}

	public function dashboard() {
		return response()->json([
			'success' => true,
			'data' => app(DataService::class)->getDashboardCounts()
		]);
	}

	protected function getRequest(string $route): Request {
		$original = request();
		$request = Request::create(route($route), 'GET', $original->query(), $original->cookies->all(), $original->files->all(), $original->server->all(), $original->getContent());
		app()->instance('request', $request);
		RequestFacade::swap($request);
		return $request;
	}
}
