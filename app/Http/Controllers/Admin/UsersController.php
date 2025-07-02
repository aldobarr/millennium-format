<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\AdminController;
use App\Http\Requests\Admin\CreateUser;
use App\Http\Requests\Admin\EditUser;
use App\Http\Resources\Admin\UserResource;
use App\Http\Resources\Admin\Users;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpFoundation\Response;

class UsersController extends AdminController {
	public function users() {
		return new Users(User::withCount('decks')->paginate(perPage: static::RESULTS_PER_PAGE)->withQueryString());
	}

	public function createUser(CreateUser $request) {
		User::create([
			'name' => $request->input('name'),
			'email' => $request->input('email'),
			'password' => Hash::make($request->input('password'))
		]);

		return $this->users();
	}

	public function editUser(EditUser $request, User $user) {
		if ($user->is_admin) {
			abort(Response::HTTP_FORBIDDEN, 'You cannot edit an admin user.');
		}

		$user->name = $request->input('name');
		$user->email = $request->input('email');
		if ($request->has('password')) {
			$user->password = Hash::make($request->input('password'));
		}

		$user->save();

		return new UserResource($user->loadCount('decks'));
	}

	public function deleteUser(User $user) {
		if ($user->is_admin) {
			abort(Response::HTTP_FORBIDDEN, 'You cannot delete an admin user.');
		}

		$user->delete();
		return $this->users($this->getRequest('admin.users'));
	}
}
