<?php

namespace Tests;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
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
}
