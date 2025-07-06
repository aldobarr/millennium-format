<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
	/**
	 * Run the migrations.
	 */
	public function up(): void {
		Schema::create('card_category', function (Blueprint $table) {
			$table->bigInteger('card_id')->unsigned();
			$table->bigInteger('category_id')->unsigned();
			$table->smallInteger('order');

			$table->foreign('card_id')->references('id')->on('cards')->cascadeOnDelete();
			$table->foreign('category_id')->references('id')->on('categories')->cascadeOnDelete();
		});
	}

	/**
	 * Reverse the migrations.
	 */
	public function down(): void {
		Schema::dropIfExists('card_category');
	}
};
