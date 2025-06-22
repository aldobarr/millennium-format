<?php

namespace App\Services;

use App\Enums\DeckType;
use App\Models\Category;
use Illuminate\Support\Str;

class CardParser {
	private $document;
	private $category;
	private $xpath;
	private $name = '';
	private $description = '';
	private $deckType = null;
	private $image = '';
	private $isValid = false;

	public function __construct($link, Category $category) {
		$this->document = new \DOMDocument;
		@$this->document->loadHTMLFile($link);
		$this->xpath = new \DOMXPath($this->document);
		$this->category = $category;

		$this->init();

		unset($this->xpath);
		unset($this->document);
		$this->xpath = null;
		$this->document = null;
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

		$this->image = trim($image->attributes->getNamedItem('src')->nodeValue);

		$heading_element = $this->getElementByClass('heading');
		if (empty($heading_element) || $heading_element->count() < 1 || empty($heading_element->item(0)->firstChild)) {
			return;
		}

		$this->name = trim($heading_element->item(0)->firstChild->textContent);
		if (empty($this->name)) {
			return;
		}

		$lore_element = $this->getElementByClass('lore');
		if (empty($lore_element) || $lore_element->count() < 1 || empty($lore_element->item(0)->firstChild)) {
			return;
		}

		$this->description = trim($lore_element->item(0)->textContent);
		if (empty($this->description)) {
			return;
		}

		$this->deckType = Str::contains($this->category->name, 'fusion', true) ? DeckType::EXTRA : DeckType::MAIN;
		$this->isValid = true;
	}

	private function getElementByClass($class) {
		return $this->xpath?->query("//*[contains(concat(' ', normalize-space(@class), ' '), ' $class ')]");
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

	public function getDeckType() {
		return $this->deckType;
	}

	public function getImage() {
		return $this->image;
	}
}