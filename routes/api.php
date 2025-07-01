<?php

use App\Http\Controllers\Admin\CardsController;
use App\Http\Controllers\Admin\CategoriesController;
use App\Http\Controllers\Admin\TagsController;
use App\Http\Controllers\AuthenticationController;
use App\Http\Controllers\DeckBuilderController;
use Illuminate\Support\Facades\Route;
use Symfony\Component\HttpFoundation\Response;

Route::any('/', function() {
	return response()->json(['success' => false, 'errors' => ['Not Found']], Response::HTTP_NOT_FOUND);
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

	Route::controller(DeckBuilderController::class)->prefix('decks')->group(function() {
		Route::post('/', 'createDeck')->name('decks.create')->can('create', 'App\Models\Deck');
		Route::post('/import', 'importDeck')->name('decks.import')->can('create', 'App\Models\Deck');
		Route::get('/', 'decks')->name('decks.list')->can('viewAny', 'App\Models\Deck');
		Route::get('/{deck}', 'getDeck')->name('decks.get')->can('view', 'deck');
		Route::get('/{deck}/download', 'downloadDeck')->name('decks.download')->can('view', 'deck');
		Route::put('/{deck}', 'editDeck')->name('decks.edit')->can('update', 'deck');
		Route::delete('/{deck}', 'deleteDeck')->name('decks.delete')->can('delete', 'deck');
	});

	Route::prefix('admin')->group(function() {
		Route::controller(CardsController::class)->group(function() {
			Route::get('/cards', 'cards')->name('admin.cards');
			Route::post('/cards', 'createCard')->name('admin.cards.create');
			Route::put('/cards/{card}', 'editCard')->name('admin.cards.edit');
			Route::delete('/cards/{card}', 'deleteCard')->name('admin.cards.delete');
		});

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

Route::controller(DeckBuilderController::class)->group(function() {
	Route::get('/search', 'search')->name('search');
	Route::get('/categories', 'categories')->name('categories');
});

Route::fallback(function() {
	return response()->json(['success' => false, 'errors' => ['Not Found']], Response::HTTP_NOT_FOUND);
});