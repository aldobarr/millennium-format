<?php

namespace Tests\Feature\Public;

use App\Http\Middleware\VerifyHMAC;
use App\Models\Card;
use App\Models\CardAlternate;
use App\Models\Deck;
use App\Services\CardService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Artisan;
use PHPUnit\Framework\Attributes\Test;
use Symfony\Component\HttpFoundation\Response;
use Tests\TestCase;

class WebhooksTest extends TestCase {
	public function setUp(): void {
		parent::setUp();

		$this->logout();
	}

	#[Test]
	public function db_backup_route_calls_backup_command(): void {
		Artisan::expects('call')->with('db:backup')->once();

		$url = route('hook.db.backup');
		$datetime = Carbon::now('UTC')->toIso8601String();
		$signature = VerifyHMAC::generateHMAC($url, $datetime, []);
		$response = $this->post($url, [], [
			'X-Signature' => $signature,
			'X-Time' => $datetime,
		]);

		$response->assertStatus(Response::HTTP_OK);
	}
}
