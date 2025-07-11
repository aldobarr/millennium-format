<?php

use App\Models\Deck;
use App\Models\User;
use Illuminate\Support\Facades\Gate;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class DeckPolicyTest extends TestCase {
	#[Test]
	public function can_view_any_checks(): void {
		$admin = User::factory(state: ['is_admin' => true])->make();
		$user = User::factory(state: ['is_admin' => false])->make();

		$this->assertTrue($admin->can('viewAny', Deck::class));
		$this->assertFalse($user->can('viewAny', Deck::class));
	}

	#[Test]
	public function can_view_deck(): void {
		$admin = User::factory(state: ['id' => 1, 'is_admin' => true])->make();
		$user = User::factory(state: ['id' => 2, 'is_admin' => false])->make();
		$owner = User::factory(state: ['id' => 3, 'is_admin' => false])->make();
		$deck = Deck::factory(state: ['is_public' => false])->for($owner)->make();

		$this->assertTrue($admin->can('view', $deck));
		$this->assertFalse($user->can('view', $deck));
		$this->assertTrue($owner->can('view', $deck));
		$this->assertFalse(Gate::allows('view', $deck));

		$deck->is_public = true;
		$this->assertTrue($admin->can('view', $deck));
		$this->assertTrue($user->can('view', $deck));
		$this->assertTrue($owner->can('view', $deck));
		$this->assertTrue(Gate::allows('view', $deck));
	}

	#[Test]
	public function anyone_can_create(): void {
		$admin = User::factory(state: ['id' => 1, 'is_admin' => true])->make();
		$user = User::factory(state: ['id' => 2, 'is_admin' => false])->make();

		$this->assertTrue($admin->can('create', Deck::class));
		$this->assertTrue($user->can('create', Deck::class));

		// Except guests
		$this->assertFalse(Gate::allows('create', Deck::class));
	}

	#[Test]
	public function can_dupe_deck(): void {
		$admin = User::factory(state: ['id' => 1, 'is_admin' => true])->make();
		$user = User::factory(state: ['id' => 2, 'is_admin' => false])->make();
		$owner = User::factory(state: ['id' => 3, 'is_admin' => false])->make();
		$deck = Deck::factory(state: ['is_public' => false])->for($owner)->make();

		$this->assertTrue($admin->can('dupe', $deck));
		$this->assertFalse($user->can('dupe', $deck));
		$this->assertTrue($owner->can('dupe', $deck));
		$this->assertFalse(Gate::allows('dupe', $deck));

		$deck->is_public = true;
		$this->assertTrue($admin->can('dupe', $deck));
		$this->assertTrue($user->can('dupe', $deck));
		$this->assertTrue($owner->can('dupe', $deck));
		$this->assertFalse(Gate::allows('dupe', $deck));
	}

	#[Test]
	public function can_update_deck(): void {
		$admin = User::factory(state: ['id' => 1, 'is_admin' => true])->make();
		$user = User::factory(state: ['id' => 2, 'is_admin' => false])->make();
		$owner = User::factory(state: ['id' => 3, 'is_admin' => false])->make();
		$deck = Deck::factory(state: ['is_public' => false])->for($owner)->make();

		$this->assertTrue($admin->can('update', $deck));
		$this->assertFalse($user->can('update', $deck));
		$this->assertTrue($owner->can('update', $deck));
		$this->assertFalse(Gate::allows('update', $deck));

		$deck->is_public = true;
		$this->assertTrue($admin->can('update', $deck));
		$this->assertFalse($user->can('update', $deck));
		$this->assertTrue($owner->can('update', $deck));
		$this->assertFalse(Gate::allows('update', $deck));
	}

	#[Test]
	public function can_delete_deck(): void {
		$admin = User::factory(state: ['id' => 1, 'is_admin' => true])->make();
		$user = User::factory(state: ['id' => 2, 'is_admin' => false])->make();
		$owner = User::factory(state: ['id' => 3, 'is_admin' => false])->make();
		$deck = Deck::factory(state: ['is_public' => false])->for($owner)->make();

		$this->assertTrue($admin->can('delete', $deck));
		$this->assertFalse($user->can('delete', $deck));
		$this->assertTrue($owner->can('delete', $deck));
		$this->assertFalse(Gate::allows('delete', $deck));

		$this->assertTrue($admin->can('forceDelete', $deck));
		$this->assertFalse($user->can('forceDelete', $deck));
		$this->assertTrue($owner->can('forceDelete', $deck));
		$this->assertFalse(Gate::allows('forceDelete', $deck));

		$deck->is_public = true;
		$this->assertTrue($admin->can('delete', $deck));
		$this->assertFalse($user->can('delete', $deck));
		$this->assertTrue($owner->can('delete', $deck));
		$this->assertFalse(Gate::allows('delete', $deck));

		$this->assertTrue($admin->can('forceDelete', $deck));
		$this->assertFalse($user->can('forceDelete', $deck));
		$this->assertTrue($owner->can('forceDelete', $deck));
		$this->assertFalse(Gate::allows('forceDelete', $deck));
	}

	#[Test]
	public function can_restore_deck(): void {
		$admin = User::factory(state: ['id' => 1, 'is_admin' => true])->make();
		$user = User::factory(state: ['id' => 2, 'is_admin' => false])->make();
		$owner = User::factory(state: ['id' => 3, 'is_admin' => false])->make();
		$deck = Deck::factory(state: ['is_public' => false])->for($owner)->make();

		$this->assertTrue($admin->can('restore', $deck));
		$this->assertFalse($user->can('restore', $deck));
		$this->assertFalse($owner->can('restore', $deck));
		$this->assertFalse(Gate::allows('restore', $deck));

		$deck->is_public = true;
		$this->assertTrue($admin->can('restore', $deck));
		$this->assertFalse($user->can('restore', $deck));
		$this->assertFalse($owner->can('restore', $deck));
		$this->assertFalse(Gate::allows('restore', $deck));
	}
}
