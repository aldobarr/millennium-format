<?php

namespace App\Console\Commands;

use App\Models\Card;
use App\Models\CardAlternate;
use App\Services\CardService;
use Illuminate\Console\Command;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\HttpClientException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

use function Laravel\Prompts\progress;

class ImportAlternates extends Command {
	/**
	 * The name and signature of the console command.
	 *
	 * @var string
	 */
	protected $signature = 'app:import-alternates';

	/**
	 * The console command description.
	 *
	 * @var string
	 */
	protected $description = 'Command description';

	/**
	 * Execute the console command.
	 */
	public function handle() {
		$bar = progress('Importing alternates', Card::count());
		$bar->start();
		$now = now();

		Card::chunk(250, function ($cards) use (&$bar, &$now) {
			foreach ($cards as $card) {
				$response = Http::retry(
					3, fn(int $attempt) => pow($attempt, 3),
					fn(\Throwable $e) => !($e instanceof RequestException) || ($e instanceof RequestException && empty($e->response)) || !$e->response->clientError(),
					false
				)->get('https://db.ygoprodeck.com/api/v7/cardinfo.php', ['name' => $card->name]);

				if (!$response->successful() && !$response->clientError()) {
					throw new ConnectionException('Failed to fetch card data from API.');
				}

				$response_data = $response->object();
				if ($response->clientError() && !empty($response_data->error)) {
					throw new \InvalidArgumentException($response_data->error);
				}

				if (empty($response_data) || empty($response_data->data) || empty($response_data->data[0])) {
					throw new HttpClientException('Invalid card data format received from API.');
				}

				if (count($response_data->data) > 1) {
					throw new HttpClientException("Multiple cards found for {$card->name}, using first result.");
				}

				$card_data = $response_data->data[0];
				if (empty($card_data->id) || empty($card_data->card_images)) {
					throw new \InvalidArgumentException('Invalid card data received from API.');
				}

				$inserts = [];
				$card->passcode = CardService::normalizePasscode($card_data->id);
				$card->save();

				foreach ($card_data->card_images as $image) {
					if (empty($image->id) || empty($image->image_url)) {
						throw new \InvalidArgumentException('Invalid card image data received from API.');
					}

					$inserts[] = [
						'card_id' => $card->id,
						'passcode' => $image->id,
						'link' => $image->image_url,
						'created_at' => $now,
						'updated_at' => $now,
					];
				}

				DB::table(CardAlternate::getTableName())->insert($inserts);
				$bar->advance();
			}
		});

		$bar->finish();
		$this->info('Alternates imported successfully.');

		$bar = progress('Downloading images', Card::count());
		$bar->start();

		CardAlternate::chunk(250, function ($alternates) use (&$bar) {
			foreach ($alternates as $alternate) {
				$alternate->storeImage();
				$bar->advance();
			}
		});

		$bar->finish();
		$this->info('Alternates downloaded successfully.');
		return 0;
	}
}
