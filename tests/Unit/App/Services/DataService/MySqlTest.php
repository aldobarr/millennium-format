<?php

namespace Tests\Unit\App\Services\DataService;

use App\Services\DataService\MySQLDataService;
use Illuminate\Support\Facades\DB;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class MySqlTest extends TestCase {
	#[Test]
	public function get_dashboard_counts_returns_counts(): void {
		DB::expects('select')
			->withArgs(function ($query) {
				return str_contains($query, 'SELECT COUNT(*)');
			})
			->once();

		$service = new MySQLDataService;
		$service->getDashboardCounts();
	}
}
