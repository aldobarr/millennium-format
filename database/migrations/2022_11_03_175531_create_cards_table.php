<?php

use App\Enums\Attribute;
use App\Enums\CardType;
use App\Enums\DeckType;
use App\Enums\Property;
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
			$attributes = implode('\',\'', Attribute::casesRaw());
			$card_types = implode('\',\'', CardType::casesRaw());
			$deck_types = implode('\',\'', DeckType::casesRaw());
			$properties = implode('\',\'', Property::casesRaw());
			$types_query = <<<SQL
				DO $$
				BEGIN
					IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attribute') THEN
						CREATE TYPE attribute AS ENUM ('{$attributes}');
					END IF;
					IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'card_type') THEN
						CREATE TYPE card_type AS ENUM ('{$card_types}');
					END IF;
					IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'deck_type') THEN
						CREATE TYPE deck_type AS ENUM ('{$deck_types}');
					END IF;
					IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property') THEN
						CREATE TYPE property AS ENUM ('{$properties}');
					END IF;
				END $$;
			SQL;
			DB::unprepared($types_query);
		}

		Schema::create('cards', function(Blueprint $table) use ($isPgSql) {
			$table->id();
			$table->string('name');

			if ($isPgSql) {
				$table->rawColumn('type', 'card_type');
				$table->rawColumn('deck_type', 'deck_type');
				$table->rawColumn('attribute', 'attribute')->nullable();
				$table->rawColumn('property', 'property')->nullable();
			} else {
				$table->enum('type', CardType::casesRaw());
				$table->enum('deck_type', DeckType::casesRaw());
				$table->enum('attribute', Attribute::casesRaw())->nullable();
				$table->enum('property', Property::casesRaw())->nullable();
			}

			$table->tinyInteger('level')->unsigned()->nullable();
			$table->integer('attack')->unsigned()->nullable();
			$table->integer('defense')->unsigned()->nullable();
			$table->text('description');
			$table->string('image');
			$table->string('passcode');
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
		if (DB::isPgSql()) {
			DB::statement('DROP TYPE IF EXISTS attribute');
			DB::statement('DROP TYPE IF EXISTS card_type');
			DB::statement('DROP TYPE IF EXISTS deck_type');
			DB::statement('DROP TYPE IF EXISTS property');
		}
	}
};
