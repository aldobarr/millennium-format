<?php

use App\Http\Controllers\YugiohController;
use App\Http\Middleware\EnsureIsGuestOrEmailVerified;
use Illuminate\Support\Facades\Route;

Route::middleware(EnsureIsGuestOrEmailVerified::class)->group(function() {
	Route::controller(YugiohController::class)->group(function() {
		Route::get('/search', 'search')->name('search');
	});
});