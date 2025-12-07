<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Symfony\Component\HttpFoundation\Response;

class VerifyHMAC {
	public const VALID_MINUTES = 1;
	public const VALID_SECONDS = 15;
	protected const FIFTEEN_MINUTES_IN_SECONDS = 900;

	/**
	 * Handle an incoming request.
	 *
	 * @param  \Illuminate\Http\Request  $request
	 * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
	 * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
	 */
	public function handle(Request $request, Closure $next) {
		$signature = $request->header('X-Signature');
		if (empty($signature)) {
			abort(Response::HTTP_UNAUTHORIZED, 'Unauthorized.');
		}

		$datetime = $request->header('X-Timestamp');
		if (empty($datetime)) {
			abort(Response::HTTP_UNAUTHORIZED, 'Unauthorized.');
		}

		$datetime_parsed = $this->parseTime($datetime);
		$valid_from = Carbon::now('UTC')->subMinutes(static::VALID_MINUTES);
		if ($datetime_parsed->lt($valid_from) || $datetime_parsed->gt(Carbon::now('UTC')->addSeconds(static::VALID_SECONDS))) {
			abort(Response::HTTP_UNAUTHORIZED, 'Unauthorized.');
		}

		$url = $request->url();
		$payload = $request->all();
		$hash = static::generateHMAC($url, $datetime, $payload);

		if (!hash_equals($hash, $signature)) {
			abort(Response::HTTP_UNAUTHORIZED, 'Unauthorized.');
		}

		set_time_limit(static::FIFTEEN_MINUTES_IN_SECONDS);
		return $next($request);
	}

	public static function generateHMAC(string $url, string $datetime, array $payload): string {
		ksort($payload);
		$data = $url . ':' . $datetime . ':' . json_encode($payload);

		return hash_hmac('sha256', $data, config('app.hmac.secret'));
	}

	private function parseTime(string $datetime): Carbon {
		try {
			return Carbon::parse($datetime, 'UTC');
		} catch (\Exception) {
			abort(Response::HTTP_UNAUTHORIZED, 'Unauthorized.');
		}
	}
}
