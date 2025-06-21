<?php

namespace App\Http\Controllers;

use App\Http\Requests\ChangePassword;
use App\Http\Requests\ForgotPassword;
use App\Http\Requests\Login;
use App\Http\Requests\Registration;
use App\Http\Requests\ResetPassword as ResetPasswordRequest;
use App\Http\Requests\ValidateEmail;
use App\Http\Requests\ValidateEmailToken;
use App\Http\Resources\AuthResource;
use App\Http\Resources\EmailValidatedResource;
use App\Http\Resources\EmailValidationResource;
use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

class AuthenticationController extends Controller {
	public const int VALIDATION_EXPIRATION_MINUTES = 10;
	public const int REGISTRATION_EXPIRATION_MINUTES = 30;

	public function login(Login $request) {
		$user = User::where('email', $request->email)->first();
		if (empty($user) || !Hash::check($request->input('password'), $user->password)) {
			throw ValidationException::withMessages([
				'email' => ['The provided credentials are incorrect.'],
			]);
		}

		$token = $user->createToken($request->input('device', 'web'), ['*'], !$request->input('remember', false) ? now()->addHours(6) : null);
		return new AuthResource((object)['token' => $token->plainTextToken, 'user' => $user]);
	}

	public function validateEmail(ValidateEmail $request) {
		$email = $request->input('email');
		$token = bin2hex(random_bytes(64));
		Cache::put('validate:' . $email, Hash::make($token), now()->addMinutes(self::VALIDATION_EXPIRATION_MINUTES));

		User::factory()->make(['token' => $token, 'email' => $email])->notify(new VerifyEmail);

		return new EmailValidationResource((object)['expiration' => self::VALIDATION_EXPIRATION_MINUTES]);
	}

	public function validateEmailToken(ValidateEmailToken $request) {
		$email = $request->input('email');
		$tokenHash = Cache::get('validate:' . $email);

		if (empty($tokenHash) || !Hash::check($request->input('token'), $tokenHash)) {
			throw ValidationException::withMessages([
				'token' => ['The provided token is invalid or has expired.'],
			]);
		}

		$token = bin2hex(random_bytes(64));
		Cache::forget('validate:' . $email);
		Cache::put('register:' . $email, Hash::make($token), now()->addMinutes(self::REGISTRATION_EXPIRATION_MINUTES));

		return new EmailValidatedResource((object)['token' => $token]);
	}

	public function register(Registration $request) {
		$email = $request->input('email');
		$tokenHash = Cache::pull('register:' . $email);
		if (empty($tokenHash) || !Hash::check($request->input('token'), $tokenHash)) {
			throw ValidationException::withMessages([
				'token' => ['Your email validation has expired. Please try again.'],
			]);
		}

		$user = User::create([
			'name' => $request->input('name'),
			'email' => $email,
			'password' => Hash::make($request->input('password'))
		]);

		$token = $user->createToken($request->input('device', 'web'), ['*'], !$request->input('remember', false) ? now()->addHours(6) : null);
		return new AuthResource((object)['token' => $token->plainTextToken, 'user' => $user]);
	}

	public function forgotPassword(ForgotPassword $request) {
		$email = $request->input('email');
		$user = User::where('email', $email)->first();
		$response = response()->json(['success' => true, 'data' => ['message' => 'If this email is registered, you will receive a password reset link.']]);

		if (empty($user)) {
			return $response;
		}

		$token = bin2hex(random_bytes(64));
		Cache::put('forgot:' . $token, $user->id, now()->addMinutes(self::VALIDATION_EXPIRATION_MINUTES));
		$user->notify(new ResetPassword($token));
		return $response;
	}

	public function resetPassword(ResetPasswordRequest $request) {
		$token = $request->input('token');
		$userId = Cache::pull('forgot:' . $token);
		if (empty($userId)) {
			throw ValidationException::withMessages([
				'token' => ['The provided token is invalid or has expired.'],
			]);
		}

		$user = User::where('id', $userId)->first();
		if (empty($user)) {
			throw ValidationException::withMessages([
				'token' => ['The provided token is invalid or has expired.'],
			]);
		}

		$user->password = Hash::make($request->input('password'));
		$user->save();

		return response()->json(['success' => true, 'data' => []]);
	}

	public function logout(Request $request) {
		try {
			$request->user()->currentAccessToken()->delete();
		} catch (\Exception $e) {
			return response()->json(['success' => false, 'errors' => [$e->getMessage()]], Response::HTTP_INTERNAL_SERVER_ERROR);
		}

		return new AuthResource((object)['token' => null, 'user' => null]);
	}

	public function changePassword(ChangePassword $request) {
		try {
			$user = $request->user();
			$user->password = Hash::make($request->input('password'));
			$user->save();
		} catch (\Exception $e) {
			return response()->json(['success' => false, 'errors' => [$e->getMessage()]], Response::HTTP_INTERNAL_SERVER_ERROR);
		}

		return response()->json(['success' => true, 'data' => []]);
	}
}
