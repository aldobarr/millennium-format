<?php

namespace Tests\Unit\App\Rules;

use App\Models\Page;
use App\Rules\PageOrder;
use Illuminate\Support\Facades\Validator;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class PageOrderTest extends TestCase {
	protected Page $homePage;

	public function setUp(): void {
		parent::setUp();

		$this->homePage = Page::where('is_home', true)->first();
		if (empty($this->homePage)) {
			$this->homePage = Page::factory()->create(['is_home' => true]);
		}
	}

	#[Test]
	public function it_rejects_non_int_vals(): void {
		$validator = Validator::make(['after' => 'string'], [
			'after' => new PageOrder(true)
		]);

		$this->assertFalse($validator->passes());
		$this->assertEquals('The selected page order value is invalid.', $validator->errors()->first('after'));

		$validator = Validator::make(['after' => [0]], [
			'after' => new PageOrder(true)
		]);

		$this->assertFalse($validator->passes());
		$this->assertEquals('The selected page order value is invalid.', $validator->errors()->first('after'));
	}

	#[Test]
	public function new_child_pages_can_have_order_zero(): void {
		$validator = Validator::make(['after' => 0, 'parent' => 1], [
			'after' => new PageOrder(true)
		]);

		$this->assertTrue($validator->passes());
	}

	#[Test]
	public function new_parent_pages_cannot_have_order_zero(): void {
		$validator = Validator::make(['after' => 0, 'parent' => null], [
			'after' => new PageOrder(true)
		]);

		$this->assertFalse($validator->passes());
		$this->assertEquals('The selected page order is invalid.', $validator->errors()->first('after'));
	}

	#[Test]
	public function new_pages_cannot_have_invalid_orders(): void {
		$parent1 = Page::factory(state: ['parent_id' => null])->create();
		$parent2 = Page::factory(state: ['parent_id' => null])->has(Page::factory(), 'children')->create();
		$validator = Validator::make(['after' => 10000000, 'parent' => null], [
			'after' => new PageOrder(true)
		]);

		$this->assertFalse($validator->passes());
		$this->assertEquals('The selected page order is invalid.', $validator->errors()->first('after'));

		$validator = Validator::make(['after' => $parent2->id, 'parent' => $parent1->id], [
			'after' => new PageOrder(true)
		]);

		$this->assertFalse($validator->passes());
		$this->assertEquals('A page cannot be ordered after a page that does not share the same parent.', $validator->errors()->first('after'));

		$validator = Validator::make(['after' => $parent2->id, 'parent' => $parent2->id], [
			'after' => new PageOrder(true)
		]);

		$this->assertFalse($validator->passes());
		$this->assertEquals('A page cannot be ordered after a page that does not share the same parent.', $validator->errors()->first('after'));

		$validator = Validator::make(['after' => $parent1->id, 'parent' => $parent2->children->first()->id], [
			'after' => new PageOrder(true)
		]);

		$this->assertFalse($validator->passes());
		$this->assertEquals('A page cannot be ordered after a page that does not share the same parent.', $validator->errors()->first('after'));

		$validator = Validator::make(['after' => $parent2->children->first()->id, 'parent' => $parent1->id], [
			'after' => new PageOrder(true)
		]);

		$this->assertFalse($validator->passes());
		$this->assertEquals('A page cannot be ordered after a page that does not share the same parent.', $validator->errors()->first('after'));

		$validator = Validator::make(['after' => $parent2->children->first()->id, 'parent' => null], [
			'after' => new PageOrder(true)
		]);

		$this->assertFalse($validator->passes());
		$this->assertEquals('A page cannot be ordered after a page that does not share the same parent.', $validator->errors()->first('after'));

		$validator = Validator::make(['after' => $parent2->children->first()->id, 'parent' => $parent2->id], [
			'after' => new PageOrder(true)
		]);

		$this->assertTrue($validator->passes());
	}

	#[Test]
	public function accepts_valid_new_pages(): void {
		$parent2 = Page::factory(state: ['parent_id' => null])->has(Page::factory(), 'children')->create();
		$validator = Validator::make(['after' => 0, 'parent' => 1], [
			'after' => new PageOrder(true)
		]);

		$this->assertTrue($validator->passes());

		$validator = Validator::make(['after' => $parent2->children->first()->id, 'parent' => $parent2->id], [
			'after' => new PageOrder(true)
		]);

		$this->assertTrue($validator->passes());

		$validator = Validator::make(['after' => $parent2->id, 'parent' => null], [
			'after' => new PageOrder(true)
		]);

		$this->assertTrue($validator->passes());
	}

	#[Test]
	public function home_page_order_must_be_zero(): void {
		$validator = Validator::make(['after' => 1], [
			'after' => new PageOrder(false, $this->homePage)
		]);

		$this->assertFalse($validator->passes());
		$this->assertEquals('The home page must always be first.', $validator->errors()->first('after'));

		$validator = Validator::make(['after' => 0], [
			'after' => new PageOrder(false, $this->homePage)
		]);

		$this->assertTrue($validator->passes());
	}

	#[Test]
	public function child_pages_can_have_order_zero(): void {
		$validator = Validator::make(['after' => 0, 'parent' => 1], [
			'after' => new PageOrder(false, Page::factory()->create())
		]);

		$this->assertTrue($validator->passes());
	}

	#[Test]
	public function parent_pages_cannot_have_order_zero(): void {
		$validator = Validator::make(['after' => 0, 'parent' => null], [
			'after' => new PageOrder(false, Page::factory()->create())
		]);

		$this->assertFalse($validator->passes());
		$this->assertEquals('The selected page order is invalid.', $validator->errors()->first('after'));
	}

	#[Test]
	public function pages_cannot_have_invalid_orders(): void {
		$editing = Page::factory()->create();
		$parent1 = Page::factory(state: ['parent_id' => null])->create();
		$parent2 = Page::factory(state: ['parent_id' => null])->has(Page::factory(), 'children')->create();
		$validator = Validator::make(['after' => 10000000, 'parent' => null], [
			'after' => new PageOrder(false, $editing)
		]);

		$this->assertFalse($validator->passes());
		$this->assertEquals('The selected page order is invalid.', $validator->errors()->first('after'));

		$validator = Validator::make(['after' => $parent2->id, 'parent' => $parent1->id], [
			'after' => new PageOrder(false, $editing)
		]);

		$this->assertFalse($validator->passes());
		$this->assertEquals('A page cannot be ordered after a page that does not share the same parent.', $validator->errors()->first('after'));

		$validator = Validator::make(['after' => $parent2->id, 'parent' => $parent2->id], [
			'after' => new PageOrder(false, $editing)
		]);

		$this->assertFalse($validator->passes());
		$this->assertEquals('A page cannot be ordered after a page that does not share the same parent.', $validator->errors()->first('after'));

		$validator = Validator::make(['after' => $parent1->id, 'parent' => $parent2->children->first()->id], [
			'after' => new PageOrder(false, $editing)
		]);

		$this->assertFalse($validator->passes());
		$this->assertEquals('A page cannot be ordered after a page that does not share the same parent.', $validator->errors()->first('after'));

		$validator = Validator::make(['after' => $parent2->children->first()->id, 'parent' => $parent1->id], [
			'after' => new PageOrder(false, $editing)
		]);

		$this->assertFalse($validator->passes());
		$this->assertEquals('A page cannot be ordered after a page that does not share the same parent.', $validator->errors()->first('after'));

		$validator = Validator::make(['after' => $parent2->children->first()->id, 'parent' => null], [
			'after' => new PageOrder(false, $editing)
		]);

		$this->assertFalse($validator->passes());
		$this->assertEquals('A page cannot be ordered after a page that does not share the same parent.', $validator->errors()->first('after'));

		$validator = Validator::make(['after' => $editing->id, 'parent' => null], [
			'after' => new PageOrder(false, $editing)
		]);

		$this->assertFalse($validator->passes());
		$this->assertEquals('A page cannot be ordered after itself.', $validator->errors()->first('after'));

		$validator = Validator::make(['after' => $parent2->children->first()->id, 'parent' => $parent2->id], [
			'after' => new PageOrder(false, $editing)
		]);

		$this->assertTrue($validator->passes());
	}

	#[Test]
	public function accepts_valid_pages(): void {
		$editing = Page::factory()->create();
		$parent2 = Page::factory(state: ['parent_id' => null])->has(Page::factory(), 'children')->create();
		$validator = Validator::make(['after' => 0, 'parent' => 1], [
			'after' => new PageOrder(false, $editing)
		]);

		$this->assertTrue($validator->passes());

		$validator = Validator::make(['after' => $parent2->children->first()->id, 'parent' => $parent2->id], [
			'after' => new PageOrder(false, $editing)
		]);

		$this->assertTrue($validator->passes());

		$validator = Validator::make(['after' => $parent2->id, 'parent' => null], [
			'after' => new PageOrder(false, $editing)
		]);

		$this->assertTrue($validator->passes());
	}
}
