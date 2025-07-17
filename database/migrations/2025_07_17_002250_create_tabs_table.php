<?php

use Database\Seeders\PageSeeder;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
	/**
	 * Run the migrations.
	 */
	public function up(): void {
		Schema::create('tabs', function (Blueprint $table) {
			$table->id();
			$table->bigInteger('page_id')->unsigned();
			$table->string('name');
			$table->text('content')->nullable();
			$table->timestamps();

			$table->foreign('page_id')->references('id')->on('pages')->cascadeOnDelete();
		});

		(new PageSeeder)->run();
	}

	/**
	 * Reverse the migrations.
	 */
	public function down(): void {
		Schema::dropIfExists('tabs');
	}
};
