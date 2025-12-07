<?php

namespace App\Http\Controllers;

use App\Http\Middleware\VerifyHMAC;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Artisan;

class WebHooksController extends Controller {
	public function __construct() {
		$this->middleware(VerifyHMAC::class);
	}

	public function healthCheck() {
		return response()->json(['success' => true, 'message' => 'OK']);
	}

	public function createBackup() {
		Artisan::call('db:backup');
		return response()->json(['success' => true, 'message' => 'Backup created.']);
	}
}
