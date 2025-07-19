<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
	/**
	 * Run the migrations.
	 */
	public function up(): void {
		Schema::create('pages', function (Blueprint $table) {
			$table->id();
			$table->string('name');
			$table->string('slug')->unique();
			$table->bigInteger('parent_id')->nullable();
			$table->integer('order');
			$table->text('header')->nullable();
			$table->text('footer')->nullable();
			$table->boolean('is_home')->default(false);
			$table->timestamps();

			$table->foreign('parent_id')->references('id')->on('pages');
			$table->index(['parent_id', 'is_home']);
			$table->index(['slug']);
		});
	}

	/**
	 * Reverse the migrations.
	 */
	public function down(): void {
		Schema::dropIfExists('pages');
	}
};
