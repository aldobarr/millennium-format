<?php

namespace Tests\Unit\App\Services\DataService;

use App\Services\DataService\PostgresDataService;
use Illuminate\Support\Facades\DB;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class PgSqlTest extends TestCase {
	#[Test]
	public function get_dashboard_counts_returns_counts(): void {
		DB::expects('select')
			->withArgs(function ($query) {
				return str_contains($query, 'SELECT COUNT(*) AS cards')
					&& str_contains($query, 'SELECT COUNT(*) AS decks')
					&& str_contains($query, 'SELECT COUNT(*) AS tags')
					&& str_contains($query, 'SELECT COUNT(*) AS users');
			})
			->once();

		$service = new PostgresDataService;
		$service->getDashboardCounts();
	}
}
