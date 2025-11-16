<?php

namespace Tests;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Testing\TestResponse;
use PHPUnit\Framework\Constraint\ExceptionMessageIsOrContains;
use PHPUnit\Framework\Constraint\ExceptionMessageMatchesRegularExpression;

abstract class TestCase extends BaseTestCase {
	use RefreshDatabase;

	public function logout(string|null $guard = null): void {
		if ($this->app['auth']->guard($guard)->check()) {
			$this->app['auth']->guard($guard)->logout();
		}
	}

	final protected function expectToThrow(\Closure $fn, string $exception, string|null $message = null, string|null $matches = null): void {
		$thrown = null;

		try {
			$fn();
		} catch (\Throwable $e) {
			$thrown = $e;
		}

		$this->assertInstanceOf($exception, $thrown, 'Failed asserting that exception of type "' . $exception . '" is thrown.');
		if ($message !== null) {
			$this->assertThat($thrown->getMessage(), new ExceptionMessageIsOrContains($message));
		}

		if ($matches !== null) {
			$this->assertThat($thrown->getMessage(), new ExceptionMessageMatchesRegularExpression($matches));
		}
	}

	final protected function assertApiResponseStructure(TestResponse $response, array|string|null $data = 'data'): void {
		$structure = ['success'];
		if ($data !== null) {
			if (is_array($data)) {
				$structure['data'] = $data;
			} elseif (is_string($data)) {
				$structure[] = $data;
			}
		}

		$response->assertJsonStructure($structure);
	}

	final protected function assertPaginatedApiResponseStructure(TestResponse $response, array $data = []): void {
		$response->assertJsonStructure([
			'success',
			'data' => $data,
			'links' => [
				'first',
				'last',
				'prev',
				'next',
			],
			'meta' => [
				'current_page',
				'from',
				'last_page',
				'links' => [
					'*' => [
						'url',
						'label',
						'active'
					]
				],
				'path',
				'per_page',
				'to',
				'total'
			],
		]);
	}
}
