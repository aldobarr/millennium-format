import { Component, createEffect, createSignal, on, Show, useContext } from 'solid-js';
import { validatePasswordFields } from '../../util/AuthHelpers';
import { createStore, produce } from 'solid-js/store';
import { Alert } from '@kobalte/core/alert';
import { AppContext } from '../../App';
import { Input } from '../ui/Input';
import Button from '../ui/Button';
import Label from '../ui/Label';

const UpdatePasswordForm: Component = () => {
	const [status, setStatus] = createSignal<boolean>(false);
	const [passwordForm, setPasswordForm] = createStore({ password: '', passwordConfirmation: '', currentPassword: '' });
	const [errors, setErrors] = createStore<Record<string, string[]>>({});
	const [processing, setProcessing] = createSignal(false);
	const { appState } = useContext(AppContext);

	const resetErrors = () => {
		setErrors(produce((errors) => {
			Object.keys(errors).forEach((key) => {
				delete errors[key];
			});
		}));
	};

	const reset = (processing: boolean = false) => {
		setStatus(false);
		setProcessing(processing);
		resetErrors();
	};

	const submit = (e: SubmitEvent) => {
		e.preventDefault();

		const errors: string[] = [];
		if (passwordForm.currentPassword.length === 0) {
			errors.push('Current password is required.');
		}

		errors.concat(validatePasswordFields(passwordForm.password, passwordForm.passwordConfirmation));
		if (Object.keys(errors).length > 0) {
			setErrors({ password: errors });
			return;
		}

		reset(true);
	};

	createEffect(on(processing, async (isProcessing) => {
		if (!isProcessing) {
			return;
		}

		try {
			const res = await fetch(`${import.meta.env.VITE_API_URL}/change/password`, {
				method: 'PUT',
				body: JSON.stringify({
					current_password: passwordForm.currentPassword,
					password: passwordForm.password,
					password_confirmation: passwordForm.passwordConfirmation,
				}),
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${appState.auth.token}`,
				},
			});

			const response = await res.json();
			if (!response.success) {
				setErrors(Array.isArray(response.errors) ? { password_confirmation: response.errors } : response.errors);
				setStatus(false);
				return;
			}

			setPasswordForm({ password: '', passwordConfirmation: '', currentPassword: '' });
			setStatus(true);
			setTimeout(() => setStatus(false), 3000);
		} catch (error) {
			console.error(error);
			setErrors({ password_confirmation: ['An unknown error occurred.'] });
			setStatus(false);
		} finally {
			setProcessing(false);
		}
	}));

	return (
		<div class="md:grid md:grid-cols-3 md:gap-6">
			<div class="md:col-span-1">
				<div class="px-4 sm:px-0">
					<h3 class="text-lg font-medium text-gray-100">Update Password</h3>

					<p class="mt-1 text-sm text-gray-300">
						Ensure your account is using a long, random password to stay secure.
						We recommend using a password manager like Bitwarden.
					</p>
				</div>
			</div>
			<div class="mt-5 md:mt-0 md:col-span-2">
				<form onSubmit={submit}>
					<div class="px-4 py-5 border rounded border-gray-900 sm:p-6 shadow sm:rounded-tl-md sm:rounded-tr-md">
						<Show when={status()}>
							<Alert class="alert alert-success mb-4">
								<div><strong class="font-bold">Success!</strong></div>
								<div>Your password has been updated.</div>
							</Alert>
						</Show>
						<div class="grid grid-cols-6 gap-6">
							<div class="col-span-6">
								<Label for="current_password" class="leading-7 text-sm text-gray-100" value="Current Password" />
								<Input
									type="password"
									name="current_password"
									class="mt-1 block w-full"
									value={passwordForm.currentPassword}
									handleChange={e => setPasswordForm('currentPassword', e.currentTarget.value)}
									errors={() => errors.current_password}
									required
								/>
							</div>

							<div class="col-span-6">
								<Label for="password" class="leading-7 text-sm text-gray-100" value="New Password" />
								<Input
									type="password"
									name="password"
									class="mt-1 block w-full"
									value={passwordForm.password}
									handleChange={e => setPasswordForm('password', e.currentTarget.value)}
									errors={() => errors.password}
									required
								/>
							</div>

							<div class="col-span-6">
								<Label for="password_confirmation" class="leading-7 text-sm text-gray-100" value="Confirm Password" />
								<Input
									type="password"
									name="password_confirmation"
									class="mt-1 block w-full"
									autoComplete="off"
									value={passwordForm.passwordConfirmation}
									handleChange={e => setPasswordForm('passwordConfirmation', e.currentTarget.value)}
									errors={() => errors.password_confirmation}
									required
								/>
							</div>
						</div>
						<div class="flex items-center justify-end text-right pt-4">
							<Button type="submit" processing={processing} class={processing() ? 'opacity-25' : ''}>Save</Button>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
};

export default UpdatePasswordForm;
