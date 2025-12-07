<?php

namespace Tests\Feature\Public\Middleware;

use App\Http\Middleware\VerifyHMAC;
use Illuminate\Support\Carbon;
use PHPUnit\Framework\Attributes\Test;
use Symfony\Component\HttpFoundation\Response;
use Tests\TestCase;

class VerifyHMACTest extends TestCase {
	public function setUp(): void {
		parent::setUp();

		$this->logout();
	}

	#[Test]
	public function aborts_without_signature(): void {
		$response = $this->post(route('hook.health'), []);
		$response->assertStatus(Response::HTTP_UNAUTHORIZED);
	}

	#[Test]
	public function aborts_without_timestamp(): void {
		$response = $this->post(route('hook.health'), [], [
			'X-Signature' => 'some-signature',
		]);

		$response->assertStatus(Response::HTTP_UNAUTHORIZED);
	}

	#[Test]
	public function aborts_with_garbage_timestamp(): void {
		$response = $this->post(route('hook.health'), [], [
			'X-Signature' => 'some-signature',
			'X-Timestamp' => 'not-a-timestamp',
		]);

		$response->assertStatus(Response::HTTP_UNAUTHORIZED);
	}

	#[Test]
	public function aborts_with_expired_timestamp(): void {
		$response = $this->post(route('hook.health'), [], [
			'X-Signature' => 'some-signature',
			'X-Timestamp' => Carbon::now('UTC')->subMinutes(VerifyHMAC::VALID_MINUTES)->toIso8601String(),
		]);

		$response->assertStatus(Response::HTTP_UNAUTHORIZED);
	}

	#[Test]
	public function aborts_with_future_timestamp(): void {
		$response = $this->post(route('hook.health'), [], [
			'X-Signature' => 'some-signature',
			'X-Timestamp' => Carbon::now('UTC')->addSeconds(VerifyHMAC::VALID_SECONDS + 5)->toIso8601String(),
		]);

		$response->assertStatus(Response::HTTP_UNAUTHORIZED);
	}

	#[Test]
	public function aborts_with_invalid_signature(): void {
		$response = $this->post(route('hook.health'), [], [
			'X-Signature' => 'some-signature',
			'X-Timestamp' => Carbon::now('UTC')->toIso8601String(),
		]);

		$response->assertStatus(Response::HTTP_UNAUTHORIZED);
	}

	#[Test]
	public function aborts_with_tampered_signature(): void {
		$url = route('hook.health');
		$datetime = Carbon::now('UTC')->toIso8601String();
		$signature = VerifyHMAC::generateHMAC(
			route('hook.health'),
			Carbon::now('UTC')->toIso8601String(),
			[]
		);

		$response = $this->post($url, ['invalid' => 'data'], [
			'X-Signature' => $signature,
			'X-Timestamp' => $datetime,
		]);

		$response->assertStatus(Response::HTTP_UNAUTHORIZED);
	}

	#[Test]
	public function validates_valid_post_request(): void {
		$url = route('hook.health');
		$datetime = Carbon::now('UTC')->toIso8601String();
		$payload = ['some' => 'data', 'another' => 'field'];
		$signature = VerifyHMAC::generateHMAC(
			route('hook.health'),
			Carbon::now('UTC')->toIso8601String(),
			$payload
		);

		$response = $this->post($url, $payload, [
			'X-Signature' => $signature,
			'X-Timestamp' => $datetime,
		]);

		$response->assertStatus(Response::HTTP_OK);
		$response->assertJson(['success' => true, 'message' => 'OK']);
	}

	#[Test]
	public function validates_valid_get_request(): void {
		$url = route('hook.health');
		$datetime = Carbon::now('UTC')->toIso8601String();
		$payload = ['some' => 'data', 'another' => 'field'];
		$signature = VerifyHMAC::generateHMAC(
			route('hook.health'),
			Carbon::now('UTC')->toIso8601String(),
			$payload
		);

		$response = $this->get($url . '?' . http_build_query($payload), [
			'X-Signature' => $signature,
			'X-Timestamp' => $datetime,
		]);

		$response->assertStatus(Response::HTTP_OK);
		$response->assertJson(['success' => true, 'message' => 'OK']);
	}
}
