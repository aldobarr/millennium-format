<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpException;

return Application::configure(basePath: dirname(__DIR__))
	->withRouting(
		web: __DIR__.'/../routes/web.php',
		api: __DIR__.'/../routes/api.php',
		commands: __DIR__.'/../routes/console.php',
		health: '/up',
	)
	->withMiddleware(function (Middleware $middleware): void {
		$middleware->trustProxies(at: '*');
		$middleware->prepend(ThrottleRequests::using('global'))->throttleApi();
	})
	->withExceptions(function (Exceptions $exceptions): void {
		$exceptions->render(function(ValidationException $e) {
			return response()->json(['success' => false, 'errors' => $e->errors()], Response::HTTP_UNPROCESSABLE_ENTITY);
		});

		$exceptions->render(function(\Illuminate\Auth\AuthenticationException $e) {
			return response()->json(['success' => false, 'errors' => [$e->getMessage()]], Response::HTTP_UNAUTHORIZED);
		});

		$exceptions->render(function(HttpException|HttpResponseException $e) {
			$error = $e->getMessage();
			$getResponse = 'getResponse';
			$getStatusCode = 'getStatusCode';
			$statusCode = is_callable([$e, $getStatusCode]) ? $e->$getStatusCode() : 500;
			if (is_callable([$e, $getResponse])) {
				if ($e->$getResponse() instanceof \Illuminate\Http\JsonResponse) {
					return $e->$getResponse();
				}

				if (empty($error)) {
					$error = $e->$getResponse()->getContent();
				}

				$statusCode = $e->$getResponse()->getStatusCode();
			}

			return response()->json(['success' => false, 'errors' => [$error]], $statusCode);
		});

		$exceptions->render(function(\Exception $e) {
			return response()->json(['success' => false, 'errors' => [$e->getMessage()]], Response::HTTP_INTERNAL_SERVER_ERROR);
		});
	})->create();
