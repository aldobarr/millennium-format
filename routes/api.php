<?php

use App\Http\Controllers\Admin\CategoriesController;
use App\Http\Controllers\Admin\TagsController;
use App\Http\Controllers\AuthenticationController;
use App\Http\Controllers\YugiohController;
use Illuminate\Support\Facades\Route;
use Symfony\Component\HttpFoundation\Response;

Route::any('/', function() {
	return response()->json(['error' => 'Not Found'], Response::HTTP_NOT_FOUND);
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
	Route::controller(AuthenticationController::class)->group(function() {
		Route::post('/logout', 'logout')->name('logout');
		Route::put('/change/password', 'changePassword')->name('password.change');
	});

	Route::prefix('admin')->group(function() {
		Route::controller(CategoriesController::class)->group(function() {
			Route::get('/categories', 'categories')->name('admin.categories');
			Route::post('/categories', 'createCategory')->name('admin.categories.create');
			Route::put('/categories/{category}', 'editCategory')->name('admin.categories.edit');
			Route::delete('/categories/{category}', 'deleteCategory')->name('admin.categories.delete');
		});

		Route::controller(TagsController::class)->group(function() {
			Route::get('/tags', 'tags')->name('admin.tags');
			Route::post('/tags', 'createTag')->name('admin.tags.create');
			Route::put('/tags/{tag}', 'editTag')->name('admin.tags.edit');
			Route::delete('/tags/{tag}', 'deleteTag')->name('admin.tags.delete');
		});
	});
});

Route::controller(YugiohController::class)->group(function() {
	Route::get('/search', 'search')->name('search');
});

Route::fallback(function() {
	return response()->json(['error' => 'Not Found'], Response::HTTP_NOT_FOUND);
});