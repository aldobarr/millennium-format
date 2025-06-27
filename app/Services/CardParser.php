<?php

namespace App\Services;

use App\Enums\CardType;
use App\Enums\DeckType;

class CardParser {
	private const int POW_BASE = 3;
	private const int MAX_TRIES = 3;

	private $document;
	private $xpath;
	private $name = '';
	private $description = '';
	private $deckType = null;
	private $type = null;
	private $level = null;
	private $attack = null;
	private $questionAttack = false;
	private $defense = null;
	private $questionDefense = false;
	private $image = '';
	private $isRitual = false;
	private $isValid = false;

	public function __construct($link) {
		$this->document = new \DOMDocument;
		if (!$this->loadLink($link)) {
			unset($this->document);
			$this->document = null;
			return;
		}

		$this->xpath = new \DOMXPath($this->document);

		$this->init();

		unset($this->xpath);
		unset($this->document);
		$this->xpath = null;
		$this->document = null;
	}

	private function loadLink(string $link): bool {
		if (empty($link) || !$this->document instanceof \DOMDocument) {
			return false;
		}

		$tries = 0;
		$success = false;
		while (!$success && $tries <= static::MAX_TRIES) {
			sleep($tries !== 0 ? pow(static::POW_BASE, $tries) : 0);
			$success = @$this->document->loadHTMLFile($link);
			$tries++;
		}

		return $success;
	}

	private function init() {
		$image_element = $this->getElementByClass('cardtable-main_image-wrapper');
		if (empty($image_element) || $image_element->count() < 1 || empty($image_element->item(0)->firstChild)) {
			return;
		}

		$image = $image_element->item(0)->firstChild->firstChild;
		if (empty($image) || !$image->hasAttributes() || empty($image->attributes->getNamedItem('src'))) {
			return;
		}

		$this->image = $this->getImageUrl($image);

		$heading_element = $this->getElementByClass('heading');
		if (empty($heading_element) || $heading_element->count() < 1 || empty($heading_element->item(0)->firstChild)) {
			return;
		}

		$this->name = trim($heading_element->item(0)->firstChild->textContent);
		if (empty($this->name)) {
			return;
		}

		$this->parseCardTable();
		if (empty($this->type)) {
			return;
		}

		if ($this->type === CardType::MONSTER) {
			if (empty($this->level)) {
				return;
			}

			if ($this->attack === null && !$this->questionAttack) {
				return;
			}

			if ($this->defense === null && !$this->questionDefense) {
				return;
			}
		}

		if (empty($this->deckType)) {
			return;
		}

		if ($this->isRitual && $this->type === CardType::MONSTER) {
			$this->deckType = DeckType::RITUAL;
		}

		$lore_element = $this->getElementByClass('lore');
		if (empty($lore_element) || $lore_element->count() < 1 || empty($lore_element->item(0)->firstChild)) {
			return;
		}

		$this->description = trim($lore_element->item(0)->textContent);
		if (empty($this->description)) {
			return;
		}

		$this->isValid = true;
	}

	private function getElementByClass($class) {
		return $this->xpath?->query("//*[contains(concat(' ', normalize-space(@class), ' '), ' $class ')]");
	}

	private function isExtraDeck(string $type): bool {
		return array_key_exists(strtolower(trim($type)), [
			'fusion' => true,
			'link' => true,
			'synchro' => true,
			'xyz' => true,
		]);
	}

	private function parseCardTable() {
		$card_table = $this->getElementByClass('card-table-columns');
		if (empty($card_table) || $card_table->count() < 1) {
			return null;
		}

		$table_list = $card_table->item(0)->getElementsByTagName('table');
		if (empty($table_list) || $table_list->count() < 1) {
			return null;
		}

		$table = $table_list->item(0);
		if (empty($table) || !$table->hasChildNodes()) {
			return null;
		}

		$rows = $table->getElementsByTagName('tr');
		if (empty($rows) || $rows->count() < 1) {
			return null;
		}

		$this->deckType = DeckType::NORMAL;
		foreach ($rows as $row) {
			if (empty($row) || !$row->hasChildNodes()) {
				continue;
			}

			$row_header = $row->firstChild->firstChild;
			if (empty($row_header)) {
				continue;
			}

			$header = trim($row_header->textContent);
			if (strcasecmp($header, 'Card type') === 0) {
				foreach ($row->childNodes as $child) {
					if ($child->nodeType !== XML_ELEMENT_NODE || $child->nodeName !== 'td') {
						continue;
					}

					$typeValue = $child->getElementsByTagName('a')?->item(0);
					if (empty($typeValue) || empty($typeValue->textContent)) {
						break;
					}

					$type = trim($typeValue->textContent);
					$this->type = CardType::tryFrom($type);
					break;
				}
			} else if (strcasecmp($header, 'Types') === 0) {
				$break_loop = false;
				foreach ($row->childNodes as $child) {
					if ($child->nodeType !== XML_ELEMENT_NODE || $child->nodeName !== 'td') {
						continue;
					}

					$types = $child->getElementsByTagName('a');
					if (empty($types) || $types->count() < 1) {
						break;
					}

					$break_loop = true;
					foreach ($types as $type) {
						if ($this->isExtraDeck($type->textContent)) {
							$this->deckType = DeckType::EXTRA;
						}

						if (strcasecmp(trim($type->textContent), 'ritual') === 0) {
							$this->isRitual = true;
						}
					}

					if ($break_loop) {
						break;
					}
				}
			} else if (strcasecmp($header, 'Level') === 0) {
				foreach ($row->childNodes as $child) {
					if ($child->nodeType !== XML_ELEMENT_NODE || $child->nodeName !== 'td') {
						continue;
					}

					$levelValue = $child->getElementsByTagName('a')?->item(0);
					if (empty($levelValue) || empty($levelValue->textContent)) {
						break;
					}

					$level = intval(trim($levelValue->textContent));
					$this->level = $level > 0 ? $level : null;
					break;
				}
			} else if (strcasecmp($header, 'ATK') === 0) {
				foreach ($row->childNodes as $child) {
					if ($child->nodeType !== XML_ELEMENT_NODE || $child->nodeName !== 'td') {
						continue;
					}

					$atk_def_values = $child->getElementsByTagName('a');
					if (empty($atk_def_values) || $atk_def_values->count() != 2) {
						break;
					}

					$attack = trim($atk_def_values->item(0)->textContent);
					if (strcmp($attack, '?') !== 0) {
						$this->attack = intval($attack);
					} else {
						$this->questionAttack = true;
					}

					$defense = trim($atk_def_values->item(1)->textContent);
					if (strcmp($defense, '?') !== 0) {
						$this->defense = intval($defense);
					} else {
						$this->questionDefense = true;
					}

					break;
				}
			}
		}
	}

	private function getImageUrl(\DOMElement $image): string {
		$default_src = trim($image->attributes->getNamedItem('src')->nodeValue);
		if (!$image->hasAttribute('srcset')) {
			return $default_src;
		}

		$src = trim($image->attributes->getNamedItem('srcset')->nodeValue);
		if (empty($src)) {
			return $default_src;
		}

		$src_parts = explode(' ', $src);
		if (empty($src_parts)) {
			return $default_src;
		}

		array_walk($src_parts, function(&$part) {
			$part = trim($part);
			if (str_ends_with($part, ',')) {
				$part = substr($part, 0, -1);
			}
		});

		$sources = array_filter($src_parts, function($part) use ($default_src) {
			return !empty($part) &&
				str_starts_with($part, 'http') &&
				!str_contains($part, '/thumb') &&
				strcmp($part, $default_src) !== 0;
		});

		if (empty($sources)) {
			return $default_src;
		}

		reset($sources);
		return current($sources);
	}

	public function isValid() {
		return $this->isValid;
	}

	public function getName() {
		return $this->name;
	}

	public function getDescription() {
		return $this->description;
	}

	public function getType() {
		return $this->type;
	}

	public function getLevel() {
		return $this->level;
	}

	public function getAttack() {
		return $this->attack;
	}

	public function getDefense() {
		return $this->defense;
	}

	public function getDeckType() {
		return $this->deckType;
	}

	public function getImage() {
		return $this->image;
	}
}