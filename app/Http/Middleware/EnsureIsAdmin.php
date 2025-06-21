<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureIsAdmin {
	/**
	 * Handle an incoming request.
	 *
	 * @param  \Illuminate\Http\Request  $request
	 * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
	 * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
	 */
	public function handle(Request $request, Closure $next) {
		if (!$request->user()) {
			abort(Response::HTTP_UNAUTHORIZED, 'Unauthenticated.');
		} else if (!$request->user()->is_admin) {
			abort(Response::HTTP_FORBIDDEN, 'Forbidden.');
		}

		return $next($request);
	}
}
