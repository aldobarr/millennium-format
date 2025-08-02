<?php

use App\Http\Controllers\Admin\CardsController;
use App\Http\Controllers\Admin\CategoriesController;
use App\Http\Controllers\Admin\DecksController;
use App\Http\Controllers\Admin\PagesController;
use App\Http\Controllers\Admin\TagsController;
use App\Http\Controllers\Admin\UsersController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthenticationController;
use App\Http\Controllers\DeckBuilderController;
use App\Http\Controllers\PageController;
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

Route::controller(PageController::class)->group(function() {
	Route::get('/nav', 'nav')->name('nav');
	Route::get('/page/home', 'home')->name('page.home');
	Route::get('/page/{page}/{child?}', 'page')->name('page');
});

Route::controller(DeckBuilderController::class)->group(function() {
	Route::get('/search', 'search')->name('search');
	Route::get('/cards/masters', 'deckMasters')->name('cards.masters');
	Route::get('/cards/monster/types', 'monsterTypes')->name('cards.monster.types');
	Route::put('/decks/validate', 'validateDeck')->name('decks.validate');
	Route::get('/decks/ydke/cards', 'getYDKECards')->name('decks.ydke.cards');
	Route::get('/decks/ydke/validate', 'validateYDKEDeck')->name('decks.ydke.validate');
});

Route::middleware(['auth:sanctum'])->group(function() {
	Route::controller(AuthenticationController::class)->group(function() {
		Route::get('/user', 'getUser')->name('user.get');
		Route::post('/logout', 'logout')->name('logout');
		Route::put('/change/password', 'changePassword')->name('password.change');
	});

	Route::controller(DeckBuilderController::class)->prefix('decks')->group(function() {
		Route::post('/', 'createDeck')->name('decks.create')->can('create', 'App\Models\Deck');
		Route::post('/import', 'importDeck')->name('decks.import')->can('create', 'App\Models\Deck');
		Route::get('/', 'decks')->name('decks.list');
		Route::get('/{deck}', 'getDeck')->name('decks.get')->can('view', 'deck');
		Route::get('/{deck}/download', 'downloadDeck')->name('decks.download')->can('view', 'deck');
		Route::get('/{deck}/export', 'exportDeck')->name('decks.export')->can('view', 'deck');
		Route::post('/{deck}/duplicate', 'duplicateDeck')->name('decks.duplicate')->can('dupe', 'deck');
		Route::put('/{deck}', 'editDeck')->name('decks.edit')->can('update', 'deck');
		Route::delete('/{deck}', 'deleteDeck')->name('decks.delete')->can('delete', 'deck');
	});

	Route::prefix('admin')->group(function() {
		Route::get('/dashboard', [AdminController::class, 'dashboard'])->name('admin.dashboard');

		Route::controller(CardsController::class)->group(function() {
			Route::get('/cards', 'cards')->name('admin.cards');
			Route::get('/cards/rules', 'imageRules')->name('admin.cards.rules');
			Route::post('/cards', 'createCard')->name('admin.cards.create');
			Route::put('/cards/{card}', 'editCard')->name('admin.cards.edit');
			Route::put('/cards/{card}/image', 'replaceCardImage')->name('admin.cards.edit.image');
			Route::patch('/cards/{card}/image', 'restoreCardImage')->name('admin.cards.edit.image.restore');
			Route::delete('/cards/{card}', 'deleteCard')->name('admin.cards.delete');
		});

		Route::controller(CategoriesController::class)->group(function() {
			Route::get('/categories', 'categories')->name('admin.categories');
			Route::post('/categories', 'createCategory')->name('admin.categories.create');
			Route::put('/categories/{category}', 'editCategory')->name('admin.categories.edit');
			Route::delete('/categories/{category}', 'deleteCategory')->name('admin.categories.delete');
		});

		Route::controller(DecksController::class)->group(function() {
			Route::get('/decks', 'decks')->name('admin.decks');
		});

		Route::controller(TagsController::class)->group(function() {
			Route::get('/tags', 'tags')->name('admin.tags');
			Route::post('/tags', 'createTag')->name('admin.tags.create');
			Route::put('/tags/{tag}', 'editTag')->name('admin.tags.edit');
			Route::delete('/tags/{tag}', 'deleteTag')->name('admin.tags.delete');
		});

		Route::controller(PagesController::class)->group(function() {
			Route::get('/pages', 'pages')->name('admin.pages');
			Route::post('/pages', 'newPage')->name('admin.pages.new');
			Route::get('/pages/orders', 'pageOrders')->name('admin.pages.orders');
			Route::get('/pages/{page}', 'page')->name('admin.page');
			Route::put('/pages/{page}', 'editPage')->name('admin.page.edit');
			Route::delete('/pages/{page}', 'deletePage')->name('admin.page.delete');
		});

		Route::controller(UsersController::class)->group(function() {
			Route::get('/users', 'users')->name('admin.users');
			Route::post('/users', 'createUser')->name('admin.users.create');
			Route::put('/users/{user}', 'editUser')->name('admin.users.edit');
			Route::delete('/users/{user}', 'deleteUser')->name('admin.users.delete');
		});
	});
});

Route::fallback(function() {
	return response()->json(['success' => false, 'errors' => ['Not Found']], Response::HTTP_NOT_FOUND);
});