<?php

namespace App\Services;

use App\Enums\Attribute;
use App\Enums\CardType;
use App\Enums\DeckType;
use App\Enums\Property;
use App\Models\MonsterType;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\HttpClientException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class CardService {
	public const string API_URL = 'https://db.ygoprodeck.com/api/v7/cardinfo.php';
	public const string ERROR_REPLACE_SEARCH = 'Please see https://db.ygoprodeck.com/api-guide/ for syntax usage.';

	private array $monsterTypes = [];
	private CardType $type;
	private Property|null $property = null;
	private DeckType $deckType;

	private function __construct(private readonly object $card) {
		$type = str_contains(strtolower($card->type), 'monster') ? 'Monster' : ucfirst($card->frameType);
		$this->type = CardType::from($type);

		if (isset($card->typeline)) {
			foreach ($card->typeline as $type) {
				$this->monsterTypes[] = value(function() use ($type) {
					if (Cache::has('monster:types:' . $type)) {
						return intval(Cache::get('monster:types:' . $type));
					}

					$new_type = MonsterType::firstOrCreate(['type' => $type]);
					return tap($new_type->id, function() use ($new_type) {
						Cache::put('monster:types:' . $new_type->type, $new_type->id, now()->addDays(7));
					});
				});
			}
		}

		if ($this->type !== CardType::MONSTER) {
			$this->property = Property::from($card->race);
		}

		$this->deckType = match($card->frameType) {
			'fusion', 'link', 'synchro', 'xyz' => DeckType::EXTRA,
			'ritual' => DeckType::RITUAL,
			default => DeckType::NORMAL,
		};
	}

	protected static function getWithParams(array $params): object {
		$response = Http::retry(
			3, fn(int $attempt) => pow($attempt, 3),
			fn(\Throwable $e) => !($e instanceof RequestException) || ($e instanceof RequestException && empty($e->response)) || !$e->response->clientError(),
			false
		)->get(self::API_URL, $params);

		if (!$response->successful() && !$response->clientError()) {
			throw new ConnectionException('Failed to fetch card data from API.');
		}

		$response_data = $response->object();
		if ($response->clientError() && !empty($response_data->error)) {
			$message = trim(str_ireplace(static::ERROR_REPLACE_SEARCH, '', $response_data->error));
			throw new \InvalidArgumentException($message);
		}

		if (empty($response_data) || empty($response_data->data) || empty($response_data->data[0])) {
			throw new HttpClientException('Invalid card data format received from API.');
		}

		return $response_data->data[0];
	}

	public static function fromPasscode(string|int $passcode): static {
		return new static(static::getWithParams(['id' => static::normalizePasscode($passcode)]));
	}

	public static function fromYugipediaLink(string $link): static {
		$url = parse_url($link);
		if (empty($url) || empty($url['path'])) {
			throw new \InvalidArgumentException('Invalid Yugipedia link provided.');
		}

		$path = explode('/', $url['path']);
		if (empty($path) || count($path) < 3 || empty($path[count($path) - 1])) {
			throw new \InvalidArgumentException('Invalid Yugipedia link provided.');
		}

		$replaces = ['(card)'];
		$name = trim(str_replace('_', ' ', urldecode($path[count($path) - 1])));
		$lowercased_name = strtolower($name);
		foreach ($replaces as $replace) {
			if (str_ends_with($lowercased_name, $replace)) {
				$name = trim(substr($name, 0, -strlen($replace)));
			}
		}

		return static::fromName($name);
	}

	public static function fromName(string $name): static {
		return new static(static::getWithParams(['name' => $name]));
	}

	public static function normalizePasscode(string|int $passcode): string {
		if (strlen($passcode . '') > 8) {
			throw new \InvalidArgumentException('Passcode must be 8 characters or less.');
		}

		return str_pad(preg_replace('/\D/', '', $passcode . ''), 8, '0', STR_PAD_LEFT);
	}

	public function getCard(): object {
		return $this->card;
	}

	public function getPasscode(): string {
		return static::normalizePasscode($this->card->id);
	}

	public function getName(): string {
		return $this->card->name;
	}

	public function getDescription(): string {
		return $this->card->desc;
	}

	public function getType(): CardType {
		return $this->type;
	}

	public function getDeckType(): DeckType {
		return $this->deckType;
	}

	public function getAttribute(): Attribute|null {
		return Attribute::tryFrom(strtoupper($this->card->attribute ?? ''));
	}

	public function getProperty(): Property|null {
		return $this->property;
	}

	public function getMonsterTypes(): array {
		return $this->monsterTypes;
	}

	public function getLevel(): int|null {
		return $this->card->level ?? null;
	}

	public function getAttack(): int|null {
		$attack = $this->card->atk ?? null;
		if ($attack === -1) {
			return null;
		}

		return $attack;
	}

	public function getDefense(): int|null {
		$defense = $this->card->def ?? null;
		if ($defense === -1) {
			return null;
		}

		return $defense;
	}

	public function getAllImages(): array {
		return array_map(fn($image) => ['passcode' => static::normalizePasscode($image->id), 'link' => $image->image_url], $this->card->card_images ?? []);
	}
}
