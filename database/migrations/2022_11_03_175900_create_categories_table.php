<?php

use App\Enums\CategoryType;
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
		$isPgSql = DB::isPgSql();
		if ($isPgSql) {
			$category_types = implode('\',\'', CategoryType::casesRaw());
			$types_query = <<<SQL
				DO $$
				BEGIN
					IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'category_type') THEN
						CREATE TYPE category_type AS ENUM ('{$category_types}');
					END IF;
				END $$;
			SQL;
			DB::unprepared($types_query);
		}

		Schema::create('categories', function(Blueprint $table) use ($isPgSql) {
			$table->id();
			$table->uuid();
			$table->string('name');

			if ($isPgSql) {
				$table->rawColumn('type', 'category_type');
			} else {
				$table->enum('type', CategoryType::casesRaw());
			}

			$table->bigInteger('deck_id')->unsigned();
			$table->smallInteger('order');
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
		if (DB::isPgSql()) {
			DB::statement('DROP TYPE IF EXISTS category_type');
		}
	}
};
