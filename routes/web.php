<?php

use App\Http\Controllers\WebHooksController;
use Illuminate\Support\Facades\Route;

Route::get('/', function() {
	return view('app');
});

Route::get('/verify/email/{token}', function($token) {
	return view('app');
})->name('email.verify.token');

Route::get('/forgot/password/{token}', function($token) {
	return view('app');
})->name('forgot.password.token');

Route::controller(WebHooksController::class)->prefix('hooks')->group(function() {
	Route::any('/health', 'healthCheck')->name('hook.health');
	Route::get('/db/backup', 'createBackup')->name('hook.db.backup');
});

Route::fallback(function() {
	return view('app');
});