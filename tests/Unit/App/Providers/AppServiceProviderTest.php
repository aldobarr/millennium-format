<?php

use App\Models\User;
use App\Providers\AppServiceProvider;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Database\Connection;
use Illuminate\Database\Eloquent\Builder as EloquentBuilder;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Database\Query\Grammars\Grammar;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Mockery\MockInterface;
use PHPUnit\Framework\Attributes\Test;
use Symfony\Component\HttpFoundation\Response;
use Tests\TestCase;

class AppServiceProviderTest extends TestCase {
	#[Test]
	public function db_has_pgsql_macro(): void {
		$this->assertTrue(DB::hasMacro('isPgSql'));
		$this->assertTrue(DB::isPgSql('pgsql'));
		$this->assertFalse(DB::isPgSql('mysql'));
	}

	#[Test]
	public function eloquent_has_whereArrayAny_macro_is_pgsql(): void {
		$grammar = new DummyGrammar();
		$connection = new FakeConnection('pgsql');
		$builder = new QueryBuilder($connection, $grammar);

		/** @var EloquentBuilder&MockInterface $query */
		$query = Mockery::mock(EloquentBuilder::class . '[whereRaw,getGrammar,getConnection]', [$builder])->makePartial();
		$query->shouldReceive('getConnection')->andReturn($connection);
		$query->shouldReceive('getGrammar')->andReturn($grammar);

		$column = 'col';
		$values = ['val1', 'val2'];

		$col = $grammar->wrap($column);
		$value = implode(', ', array_fill(0, count($values), '?'));
		$sql = $col . ' ILIKE ANY (ARRAY[' . $value . '])';

		$query->shouldReceive('whereRaw')
			->with($sql, $values)
			->once()
			->andReturnSelf();

		$result = $query->whereArrayAny($column, $values);
		$this->assertSame($query, $result);
	}

	#[Test]
	public function eloquent_has_whereArrayAny_macro_is_not_pgsql(): void {
		$connection = new FakeConnection('mysql');
		$builder = new QueryBuilder($connection);

		/** @var EloquentBuilder&MockInterface $query */
		$query = Mockery::mock(EloquentBuilder::class . '[whereIn,getConnection]', [$builder])->makePartial();
		$query->shouldReceive('getConnection')->andReturn($connection);

		$column = 'col';
		$values = ['val1', 'val2'];

		$query->shouldReceive('whereIn')
			->with($column, $values)
			->once()
			->andReturnSelf();

		$result = $query->whereArrayAny($column, $values);
		$this->assertSame($query, $result);
	}

	#[Test]
	public function query_builder_has_whereArrayAny_macro_is_pgsql(): void {
		$grammar = new DummyGrammar();
		$connection = new FakeConnection('pgsql');

		/** @var QueryBuilder&MockInterface $query */
		$query = Mockery::mock(QueryBuilder::class . '[whereRaw,getGrammar,getConnection]', [$connection, $grammar])->makePartial();
		$query->shouldReceive('getConnection')->andReturn($connection);
		$query->shouldReceive('getGrammar')->andReturn($grammar);

		$column = 'col';
		$values = ['val1', 'val2'];

		$col = $grammar->wrap($column);
		$value = implode(', ', array_fill(0, count($values), '?'));
		$sql = $col . ' ILIKE ANY (ARRAY[' . $value . '])';

		$query->shouldReceive('whereRaw')
			->with($sql, $values)
			->once()
			->andReturnSelf();

		$result = $query->whereArrayAny($column, $values);
		$this->assertSame($query, $result);
	}

	#[Test]
	public function query_builder_has_whereArrayAny_macro_is_not_pgsql(): void {
		$connection = new FakeConnection('mysql');

		/** @var QueryBuilder&MockInterface $query */
		$query = Mockery::mock(QueryBuilder::class . '[whereIn,getConnection]', [$connection])->makePartial();
		$query->shouldReceive('getConnection')->andReturn($connection);

		$column = 'col';
		$values = ['val1', 'val2'];

		$query->shouldReceive('whereIn')
			->with($column, $values)
			->once()
			->andReturnSelf();

		$result = $query->whereArrayAny($column, $values);
		$this->assertSame($query, $result);
	}

	#[Test]
	public function app_rate_limiter(): void {
		$limiters = [
			'api' => AppServiceProvider::USER_LIMIT,
			'global' => AppServiceProvider::GLOBAL_LIMIT,
		];

		$request = Mockery::mock(Request::class);
		$request->allows(['__construct']);
		$request->shouldReceive('user')->atLeast()->once();
		$request->shouldReceive('ip')->atLeast()->once();
		$request->shouldReceive('input')->atLeast()->once();

		foreach ($limiters as $key => $attempts) {
			$limiter = RateLimiter::limiter($key)($request);
			$this->assertEquals($attempts, $limiter->maxAttempts);
		}

		// Login limit is special
		$limiter = RateLimiter::limiter('login')($request);
		$this->assertIsArray($limiter);
		$this->assertCount(2, $limiter);
		$this->assertEquals(AppServiceProvider::LOGIN_LIMIT, $limiter[0]->maxAttempts);
		$this->assertEquals(AppServiceProvider::LOGIN_LIMIT_BY_EMAIL, $limiter[1]->maxAttempts);

		$api_limiter = RateLimiter::limiter('api')($request);
		$response = $api_limiter->responseCallback->__invoke($request, []);
		$this->assertInstanceOf(JsonResponse::class, $response);
		$this->assertEquals(Response::HTTP_TOO_MANY_REQUESTS, $response->getStatusCode());
	}

	#[Test]
	public function verify_email_create_url_using(): void {
		$token = 'test-token';
		$url = VerifyEmail::$createUrlCallback->__invoke(User::factory(state: ['token' => $token, 'email' => 'email'])->make());
		$this->assertIsString($url);
		$this->assertEquals(route('email.verify.token', ['token' => $token]), $url);
	}

	#[Test]
	public function reset_password_create_url_using(): void {
		$token = 'test-token';
		$url = ResetPassword::$createUrlCallback->__invoke(User::factory()->make(), $token);
		$this->assertIsString($url);
		$this->assertEquals(route('forgot.password.token', ['token' => $token]), $url);
	}

	protected function tearDown(): void {
		Mockery::close();
		parent::tearDown();
	}
}

class DummyGrammar extends Grammar{
	public function __construct() {}

	public function wrap($value): string {
		return '"' . $value . '"';
	}
}

class FakeConnection extends Connection {
	private string $driver;
	public function __construct(string $driver) {
		$this->driver = $driver;
	}

	public function getDriverName(): string {
		return $this->driver;
	}
}
