<?php

namespace App\Providers;

use App\Services\DataService;
use App\Services\DataService\DefaultDataService;
use App\Services\DataService\MySQLDataService;
use App\Services\DataService\PostgresDataService;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Contracts\Support\DeferrableProvider;
use Illuminate\Support\ServiceProvider;

class DataServiceProvider extends ServiceProvider implements DeferrableProvider {
	/**
	 * Register services.
	 */
	public function register(): void {
		$this->app->singleton(DataService::class, function(Application $app) {
			$driver = $app['db']->connection()->getDriverName();
			return match($driver) {
				'pgsql' => new PostgresDataService,
				'mysql' => new MySQLDataService,
				default => new DefaultDataService
			};
		});
	}

	/**
	 * Get the services provided by the provider.
	 *
	 * @return array<int, string>
	 */
	public function provides(): array {
		return [DataService::class];
	}
}
