<?php

namespace App\Models;

use App\Models\Traits\HasTableName;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

class Page extends Model {
	use HasFactory, HasTableName;

	protected $casts = [
		'is_home' => 'boolean',
		'is_visible' => 'boolean',
	];

	/**
	 * Should only be called from the Page controller after validation has occurred and within a transaction.
	 * @param int $after Id of the page after which this page should be ordered.
	 */
	public function setOrder(int $after): void {
		$prev = $this->getPrevious();
		if (!empty($prev) && array_key_exists('parent_id', $prev)) {
			$previous = Page::where('parent_id', $prev['parent_id'])->orderBy('order')->pluck('id')->toArray();
			foreach ($previous as $index => $page) {
				DB::table(static::getTableName())->where('id', $page)->update(['order' => $index]);
			}
		}

		$new_order = [];
		if ($after === 0) {
			$new_order[] = $this->id;
		}

		$after = Page::where('id', $after)->first();
		$pages_to_order = Page::where('parent_id', $this->parent_id)->orderBy('order')->pluck('id')->toArray();
		foreach ($pages_to_order as $page) {
			if ($page === $this->id) {
				continue;
			}

			$new_order[] = $page;

			if ($page === $after?->id) {
				$new_order[] = $this->id;
			}
		}

		// Very inefficient, but dealing with few enough pages that it shouldn't matter.
		foreach ($new_order as $index => $page) {
			DB::table(static::getTableName())->where('id', $page)->update(['order' => $index]);
		}

		$this->refresh();
	}

	public function parent() {
		return $this->belongsTo(Page::class, 'parent_id');
	}

	public function children() {
		return $this->hasMany(Page::class, 'parent_id')->orderBy('order');
	}

	public function tabs(): HasMany {
		return $this->hasMany(Tab::class)->orderBy('order');
	}
}
