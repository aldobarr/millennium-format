<?php

use App\Models\CardAlternate;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
	/**
	 * Run the migrations.
	 */
	public function up(): void {
		Schema::table('card_category', function (Blueprint $table) {
			$table->foreignIdFor(CardAlternate::class)->nullable()->constrained()->nullOnDelete();
		});
	}

	/**
	 * Reverse the migrations.
	 */
	public function down(): void {
		Schema::table('card_category', function (Blueprint $table) {
			$table->dropForeignIdFor(CardAlternate::class);
		});
	}
};
