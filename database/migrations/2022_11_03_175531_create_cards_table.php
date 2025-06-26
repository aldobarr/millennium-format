<?php

use App\Enums\CardType;
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
		$isPgSql = Schema::getConnection()->getDriverName() === 'pgsql';
		if ($isPgSql) {
			$card_types = implode('\',\'', CardType::casesRaw());
			$deck_types = implode('\',\'', DeckType::casesRaw());
			DB::statement("CREATE TYPE card_type AS ENUM ('{$card_types}')");
			DB::statement("CREATE TYPE deck_type AS ENUM ('{$deck_types}')");
		}

		Schema::create('cards', function(Blueprint $table) use ($isPgSql) {
			$table->id();
			$table->string('name');

			if ($isPgSql) {
				$table->rawColumn('type', 'card_type NOT NULL');
				$table->rawColumn('deck_type', 'deck_type NOT NULL');
			} else {
				$table->enum('type', CardType::casesRaw());
				$table->enum('deck_type', DeckType::casesRaw());
			}

			$table->tinyInteger('level')->unsigned()->nullable();
			$table->integer('attack')->unsigned()->nullable();
			$table->integer('defense')->unsigned()->nullable();
			$table->text('description');
			$table->string('image');
			$table->string('link');
			$table->tinyInteger('limit')->unsigned()->default(1);
			$table->boolean('legendary')->default(false);
			$table->timestamps();

			$table->index('name');
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
