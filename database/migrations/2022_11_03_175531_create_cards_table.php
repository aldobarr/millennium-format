<?php

use App\Enums\DeckType;
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
		Schema::create('cards', function(Blueprint $table) {
			$table->id();
			$table->string('name');
			$table->text('description');
			$table->string('image');
			$table->string('link');
			$table->enum('deck_type', DeckType::casesRaw());
			$table->bigInteger('category_id')->unsigned();
			$table->tinyInteger('limit')->unsigned()->default(1);
			$table->timestamps();

			$table->index('name');
			$table->foreign('category_id')->references('id')->on('categories')->restrictOnDelete();
		});
	}

	/**
	 * Reverse the migrations.
	 *
	 * @return void
	 */
	public function down() {
		Schema::dropIfExists('cards');
	}
};
