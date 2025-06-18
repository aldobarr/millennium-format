<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
	/**
	 * Run the migrations.
	 *
	 * @return void
	 */
	public function up() {
		Schema::create('card_tag', function(Blueprint $table) {
			$table->bigInteger('card_id')->unsigned();
			$table->bigInteger('tag_id')->unsigned();

			$table->foreign('card_id')->references('id')->on('cards')->cascadeOnDelete();
			$table->foreign('tag_id')->references('id')->on('tags')->cascadeOnDelete();
		});
	}

	/**
	 * Reverse the migrations.
	 *
	 * @return void
	 */
	public function down() {
		Schema::dropIfExists('card_tag');
	}
};
