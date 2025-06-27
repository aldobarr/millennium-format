<?php

use App\Enums\DeckType;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
	/**
	 * Run the migrations.
	 *
	 * @return void
	 */
	public function up() {
		Schema::create('categories', function(Blueprint $table) {
			$table->id();
			$table->uuid();
			$table->string('name');

			if (DB::isPgSql()) {
				$table->rawColumn('type', 'deck_type NOT NULL');
			} else {
				$table->enum('type', DeckType::casesRaw());
			}

			$table->bigInteger('deck_id')->unsigned();
			$table->timestamps();

			$table->foreign('deck_id')->references('id')->on('decks')->cascadeOnDelete();
		});
	}

	/**
	 * Reverse the migrations.
	 *
	 * @return void
	 */
	public function down() {
		Schema::dropIfExists('categories');
	}
};
