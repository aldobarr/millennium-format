<?php

use App\Http\Controllers\AuthenticationController;
use App\Http\Controllers\YugiohController;
use Illuminate\Support\Facades\Route;

Route::any('/', function() {
	return response()->json(['error' => 'Not Found'], 404);
});

Route::controller(AuthenticationController::class)->group(function() {
	Route::middleware(['throttle:login'])->group(function () {
		Route::post('/login', 'login')->name('login');
		Route::post('/verify/email', 'validateEmail')->name('email.verify.start');
		Route::post('/forgot/password', 'forgotPassword')->name('password.forgot');
	});

	Route::post('/verify/email/token', 'validateEmailToken')->name('email.verify.end');
	Route::post('/forgot/password/token', 'resetPassword')->name('password.forgot.end');
	Route::post('/register', 'register')->name('register');
});

Route::middleware(['auth:sanctum'])->group(function() {
	Route::post('/logout', [AuthenticationController::class, 'logout'])->name('logout');
});

Route::controller(YugiohController::class)->group(function() {
	Route::get('/search', 'search')->name('search');
});

Route::fallback(function() {
	return response()->json(['error' => 'Not Found'], 404);
});