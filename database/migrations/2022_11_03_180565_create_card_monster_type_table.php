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
		Schema::create('card_monster_type', function(Blueprint $table) {
			$table->bigInteger('card_id')->unsigned();
			$table->bigInteger('monster_type_id')->unsigned();

			$table->foreign('card_id')->references('id')->on('cards')->cascadeOnDelete();
			$table->foreign('monster_type_id')->references('id')->on('monster_types')->cascadeOnDelete();
		});
	}

	/**
	 * Reverse the migrations.
	 *
	 * @return void
	 */
	public function down() {
		Schema::dropIfExists('card_monster_type');
	}
};
