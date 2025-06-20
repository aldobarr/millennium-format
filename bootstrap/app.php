<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Validation\ValidationException;

return Application::configure(basePath: dirname(__DIR__))
	->withRouting(
		web: __DIR__.'/../routes/web.php',
		api: __DIR__.'/../routes/api.php',
		commands: __DIR__.'/../routes/console.php',
		health: '/up',
	)
	->withMiddleware(function (Middleware $middleware): void {
		$middleware->prepend(ThrottleRequests::using('global'))->throttleApi();
	})
	->withExceptions(function (Exceptions $exceptions): void {
		$exceptions->render(function(ValidationException $e) {
			return response()->json(['success' => false, 'errors' => $e->errors()], 422);
		});

		$exceptions->render(function(\Illuminate\Auth\AuthenticationException $e) {
			return response()->json(['success' => false, 'errors' => [$e->getMessage()]], 401);
		});

		$exceptions->render(function(\Illuminate\Http\Exceptions\HttpResponseException $e) {
			if ($e->getResponse() instanceof \Illuminate\Http\JsonResponse) {
				return $e->getResponse();
			}

			$error = $e->getMessage() ?: $e->getResponse()->getContent();
			return response()->json(['success' => false, 'errors' => [$error]], $e->getResponse()->getStatusCode());
		});

		$exceptions->render(function(\Exception $e) {
			return response()->json(['success' => false, 'errors' => [$e->getMessage()]], 500);
		});
	})->create();
