<?php

use App\Models\Card;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
	/**
	 * Run the migrations.
	 */
	public function up(): void {
		Schema::create('card_alternates', function (Blueprint $table) {
			$table->id();
			$table->foreignIdFor(Card::class)->constrained()->cascadeOnDelete()->index();
			$table->string('passcode')->index();
			$table->string('link');
			$table->string('image')->nullable();
			$table->timestamps();
		});
	}

	/**
	 * Reverse the migrations.
	 */
	public function down(): void {
		Schema::dropIfExists('card_alternates');
	}
};
