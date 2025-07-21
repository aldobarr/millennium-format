<?php

namespace Database\Seeders;

use App\Models\Page;
use App\Models\Tab;
use Illuminate\Database\Seeder;

class PageSeeder extends Seeder {
	/**
	 * Run the database seeds.
	 */
	public function run(): void {
		if (Page::where('is_home', true)->exists()) {
			return;
		}

		$page = new Page;
		$page->name = 'Home';
		$page->slug = 'home';
		$page->order = 0;
		$page->is_home = true;
		$page->is_placeholder = false;
		$page->is_visible = true;
		$page->save();

		$tab = new Tab;
		$tab->page_id = $page->id;
		$tab->name = 'Main';
		$tab->content = base64_encode(implode('|', unpack('c*', '<p style="text-align: center;">Home Page</p>')));
		$tab->order = 0;
		$tab->save();
	}
}
