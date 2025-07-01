<?php

namespace App\Policies;

use App\Models\Deck;
use App\Models\User;

class DeckPolicy {
	public function before(User $user, string $ability): bool|null {
		if ($user->is_admin) {
			return true;
		}

		return null;
	}

	/**
	 * Determine whether the user can view any models.
	 */
	public function viewAny(User $user): bool {
		return false;
	}

	/**
	 * Determine whether the user can view the model.
	 */
	public function view(User $user, Deck $deck): bool {
		return $deck->is_public || $user->id === $deck->user_id;
	}

	/**
	 * Determine whether the user can create models.
	 */
	public function create(User $user): bool {
		return true;
	}

	/**
	 * Determine whether the user can update the model.
	 */
	public function update(User $user, Deck $deck): bool {
		return $user->id === $deck->user_id;
	}

	/**
	 * Determine whether the user can delete the model.
	 */
	public function delete(User $user, Deck $deck): bool {
		return $user->id === $deck->user_id;
	}

	/**
	 * Determine whether the user can restore the model.
	 */
	public function restore(User $user, Deck $deck): bool {
		return false;
	}

	/**
	 * Determine whether the user can permanently delete the model.
	 */
	public function forceDelete(User $user, Deck $deck): bool {
		return $this->delete($user, $deck);
	}
}
