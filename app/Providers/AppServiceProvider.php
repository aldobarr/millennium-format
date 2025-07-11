<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Builder as EloquentBuilder;
use Illuminate\Database\Connection;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Symfony\Component\HttpFoundation\Response;

class AppServiceProvider extends ServiceProvider {
	public const int USER_LIMIT = 1000;
	public const int GLOBAL_LIMIT = 100000;
	public const int LOGIN_LIMIT = 500;
	public const int LOGIN_LIMIT_BY_EMAIL = 3;

	/**
	 * Register any application services.
	 */
	public function register(): void {}

	/**
	 * Bootstrap any application services.
	 */
	public function boot(): void {
		$this->extendQueryBuilders();
		$response = function(Request $request, array $headers) {
			return response()->json(['success' => false, 'errors' => ['Rate limit exceeded.']], Response::HTTP_TOO_MANY_REQUESTS, $headers);
		};

		RateLimiter::for('api', function(Request $request) use ($response) {
			return Limit::perMinute(self::USER_LIMIT)->by($request->user()?->id ?: $request->ip())->response($response);
		});

		RateLimiter::for('global', function(Request $request) use ($response) {
			return Limit::perMinute(self::GLOBAL_LIMIT)->response($response);
		});

		RateLimiter::for('login', function (Request $request) {
			return [
				Limit::perMinute(self::LOGIN_LIMIT),
				Limit::perMinute(self::LOGIN_LIMIT_BY_EMAIL)->by($request->input('email')),
			];
		});

		VerifyEmail::createUrlUsing(function($notifiable) {
			return route('email.verify.token', [
				'token' => $notifiable->token
			]);
		});

		ResetPassword::createUrlUsing(function (User $user, string $token) {
			return route('forgot.password.token', [
				'token' => $token
			]);
		});
	}

	private function extendQueryBuilders(): void {
		DB::macro('isPgSql', function(Connection|string|null $connection = null): bool {
			$connection = $connection instanceof Connection ? $connection : DB::connection($connection);
			return strcasecmp($connection->getDriverName(), 'pgsql') === 0;
		});

		$whereArrayAny = function(EloquentBuilder|QueryBuilder $query, string $column, array $values) {
			$column = $query->getGrammar()->wrap(preg_replace('/[^a-z_]/i', '', $column));
			$placeholders = implode(', ', array_fill(0, count($values), '?'));
			$sql = $column . ' ILIKE ANY (ARRAY[' . $placeholders . '])';
			return $query->whereRaw($sql, $values);
		};

		EloquentBuilder::macro('whereArrayAny', function(string $column, array $values) use ($whereArrayAny) {
			/** @var EloquentBuilder|QueryBuilder $this */
			if (!DB::isPgSql($this->getConnection())) {
				return $this->whereIn($column, $values);
			}

			return $whereArrayAny($this, $column, $values);
		});

		QueryBuilder::macro('whereArrayAny', function(string $column, array $values) use ($whereArrayAny) {
			/** @var EloquentBuilder|QueryBuilder $this */
			if (!DB::isPgSql($this->getConnection())) {
				return $this->whereIn($column, $values);
			}

			return $whereArrayAny($this, $column, $values);
		});
	}
}
