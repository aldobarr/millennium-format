<?php

namespace App\Services;

abstract class DataService {
	abstract public function getDashboardCounts(): array;
}
