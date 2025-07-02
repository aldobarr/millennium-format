<?php

namespace App\Models\Traits;

trait HasTableName {
	public static function getTableName(): string {
		return (new static)->getTable();
	}
}
