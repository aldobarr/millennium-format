<?php

namespace Tests\Unit\App\Rules;

use App\Models\Page;
use App\Rules\PageParent;
use Illuminate\Support\Facades\Validator;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class PageParentTest extends TestCase {
	protected Page $homePage;

	public function setUp(): void {
		parent::setUp();

		$this->homePage = Page::where('is_home', true)->first();
		if (empty($this->homePage)) {
			$this->homePage = Page::factory()->create(['is_home' => true]);
		}
	}

	#[Test]
	public function null_parent_always_valid(): void {
		$validator = Validator::make(['parent' => null], [
			'parent' => new PageParent(null)
		]);

		$this->assertTrue($validator->passes());

		$validator = Validator::make(['parent' => null], [
			'parent' => new PageParent($this->homePage)
		]);

		$this->assertTrue($validator->passes());

		$validator = Validator::make(['parent' => null], [
			'parent' => new PageParent(Page::factory(state: ['parent_id' => null])->create())
		]);

		$this->assertTrue($validator->passes());

		$validator = Validator::make(['parent' => null], [
			'parent' => new PageParent(Page::factory()->has(Page::factory(), 'children')->create())
		]);

		$this->assertTrue($validator->passes());
	}

	#[Test]
	public function home_page_cannot_have_parent(): void {
		$validator = Validator::make(['parent' => 1], [
			'parent' => new PageParent($this->homePage)
		]);

		$this->assertFalse($validator->passes());
		$this->assertEquals('The home page cannot have a parent.', $validator->errors()->first('parent'));
	}

	#[Test]
	public function parent_pages_must_exist(): void {
		$validator = Validator::make(['parent' => 1000000], [
			'parent' => new PageParent(null)
		]);

		$this->assertFalse($validator->passes());
		$this->assertEquals('The selected parent page does not exist.', $validator->errors()->first('parent'));

		$validator = Validator::make(['parent' => 1000000], [
			'parent' => new PageParent(Page::factory()->create())
		]);

		$this->assertFalse($validator->passes());
		$this->assertEquals('The selected parent page does not exist.', $validator->errors()->first('parent'));
	}

	#[Test]
	public function parent_pages_must_be_top_level(): void {
		$child = Page::factory()->for(Page::factory(), 'parent')->create();
		$validator = Validator::make(['parent' => $child->id], [
			'parent' => new PageParent(null)
		]);

		$this->assertFalse($validator->passes());
		$this->assertEquals('A page cannot have a parent that is not a top-level page.', $validator->errors()->first('parent'));

		$validator = Validator::make(['parent' => $child->id], [
			'parent' => new PageParent(Page::factory()->create())
		]);

		$this->assertFalse($validator->passes());
		$this->assertEquals('A page cannot have a parent that is not a top-level page.', $validator->errors()->first('parent'));
	}

	#[Test]
	public function page_cannot_be_its_own_parent(): void {
		$test1 = Page::factory()->create();
		$test2 = Page::factory()->for(Page::factory(), 'parent')->create();
		$validator = Validator::make(['parent' => $test1->id], [
			'parent' => new PageParent($test1)
		]);

		$this->assertFalse($validator->passes());
		$this->assertEquals('A page cannot be its own parent.', $validator->errors()->first('parent'));

		$validator = Validator::make(['parent' => $test2->id], [
			'parent' => new PageParent($test2)
		]);

		$this->assertFalse($validator->passes());
		$this->assertEquals('A page cannot be its own parent.', $validator->errors()->first('parent'));
	}

	#[Test]
	public function accepts_valid_parents(): void {
		$testPage = Page::factory()->create();
		$testChildPage = Page::factory()->for($testPage, 'parent')->create();

		$noChildrenTlp = Page::factory()->create();
		$hasChildrenTlp = Page::factory()->has(Page::factory(), 'children')->create();

		$validator = Validator::make(['parent' => null], [
			'parent' => new PageParent(null)
		]);

		$this->assertTrue($validator->passes());

		$validator = Validator::make(['parent' => null], [
			'parent' => new PageParent($this->homePage)
		]);

		$this->assertTrue($validator->passes());

		$validator = Validator::make(['parent' => null], [
			'parent' => new PageParent($testPage)
		]);

		$this->assertTrue($validator->passes());

		$validator = Validator::make(['parent' => null], [
			'parent' => new PageParent($testChildPage)
		]);

		$this->assertTrue($validator->passes());

		$validator = Validator::make(['parent' => $noChildrenTlp->id], [
			'parent' => new PageParent(null)
		]);

		$this->assertTrue($validator->passes());

		$validator = Validator::make(['parent' => $noChildrenTlp->id], [
			'parent' => new PageParent($testPage)
		]);

		$this->assertTrue($validator->passes());

		$validator = Validator::make(['parent' => $noChildrenTlp->id], [
			'parent' => new PageParent($testChildPage)
		]);

		$this->assertTrue($validator->passes());

		$validator = Validator::make(['parent' => $hasChildrenTlp->id], [
			'parent' => new PageParent(null)
		]);

		$this->assertTrue($validator->passes());

		$validator = Validator::make(['parent' => $hasChildrenTlp->id], [
			'parent' => new PageParent($testPage)
		]);

		$this->assertTrue($validator->passes());

		$validator = Validator::make(['parent' => $hasChildrenTlp->id], [
			'parent' => new PageParent($testChildPage)
		]);

		$this->assertTrue($validator->passes());
	}
}
