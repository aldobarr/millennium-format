<?php

use App\Providers\DataServiceProvider;
use App\Services\DataService;
use App\Services\DataService\DefaultDataService;
use App\Services\DataService\MySQLDataService;
use App\Services\DataService\PostgresDataService;
use Illuminate\Support\Facades\DB;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class PgSqlDataServiceProviderTest extends TestCase {
	private string $connection;

	protected function setUp(): void {
		parent::setUp();

		$this->connection = config('database.default');
	}

	#[Test]
	public function provides_dataservice(): void {
		$this->assertEquals([DataService::class], (new DataServiceProvider(app()))->provides());
	}

	#[Test]
	public function provides_pgsql_instance(): void {
		config(['database.default' => 'pgsql']);
		$this->assertEquals('pgsql', DB::connection()->getDriverName());

		$service = app(DataService::class);
		$this->assertInstanceOf(PostgresDataService::class, $service);
	}

	#[Test]
	public function provides_mysql_instance(): void {
		config(['database.default' => 'mysql']);
		$this->assertEquals('mysql', DB::connection()->getDriverName());

		$service = app(DataService::class);
		$this->assertInstanceOf(MySQLDataService::class, $service);
	}

	#[Test]
	public function provides_default_instance(): void {
		config(['database.default' => 'sqlite']);
		$this->assertEquals('sqlite', DB::connection()->getDriverName());

		$service = app(DataService::class);
		$this->assertInstanceOf(DefaultDataService::class, $service);
	}

	protected function tearDown(): void {
		config(['database.default' => $this->connection]);

		parent::tearDown();
	}
}
