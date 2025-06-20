<?php

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

Route::fallback(function() {
	return view('app');
});