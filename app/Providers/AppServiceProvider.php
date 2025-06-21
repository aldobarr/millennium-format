<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Symfony\Component\HttpFoundation\Response;

class AppServiceProvider extends ServiceProvider {
	public const int USER_LIMIT = 1000;
	public const int GLOBAL_LIMIT = 100000;

	/**
	 * Register any application services.
	 */
	public function register(): void {
		//
	}

	/**
	 * Bootstrap any application services.
	 */
	public function boot(): void {
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
				Limit::perMinute(500),
				Limit::perMinute(3)->by($request->input('email')),
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
}
