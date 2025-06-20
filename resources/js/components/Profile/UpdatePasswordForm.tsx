import { useForm } from '@inertiajs/inertia-react';
import React from 'react';
import Input from '@/Components/Input';
import Label from '@/Components/Label';
import Button from '@/Components/Button';

export default function UpdatePasswordForm() {
	const form = useForm({ current_password: '', password: '', password_confirmation: '' });

	function updatePassword(e) {
		e.preventDefault();
		form.put(route('user-password.update'), {
			errorBag: 'updatePassword',
			preserveScroll: true,
			preserveState: true,
			onSuccess: () => form.reset(),
			onError: () => {
				if (form.errors.password) {
					form.reset('password', 'password_confirmation');
				}

				if (form.errors.current_password) {
					form.reset('current_password');
				}
			}
		});
	}

	return (
		<div className="md:grid md:grid-cols-3 md:gap-6">
			<div className="md:col-span-1">
				<div className="px-4 sm:px-0">
					<h3 className="text-lg font-medium text-gray-100">Update Password</h3>

					<p className="mt-1 text-sm text-gray-300">
						Ensure your account is using a long, random password to stay secure.
						We recommend using a password manager like Bitwarden.
					</p>
				</div>
			</div>
			<div className="mt-5 md:mt-0 md:col-span-2">
				<form onSubmit={updatePassword}>
					<div className="px-4 py-5 bg-gray-900 sm:p-6 shadow sm:rounded-tl-md sm:rounded-tr-md">
						<div className="grid grid-cols-6 gap-6">
							<div className="col-span-6">
								<Label forInput="current_password" className="leading-7 text-sm text-gray-100" value="Current Password" />
								<Input
									type="password"
									name="current_password"
									className="mt-1 block w-full"
									value={form.data.current_password}
									autoComplete="off"
									handleChange={(e) => form.setData('current_password', e.currentTarget.value)}
									errors={form.errors.current_password}
								/>
							</div>

							<div className="col-span-6">
								<Label forInput="password" className="leading-7 text-sm text-gray-100" value="New Password" />
								<Input
									type="password"
									name="password"
									className="mt-1 block w-full"
									value={form.data.password}
									autoComplete="off"
									handleChange={(e) => form.setData('password', e.currentTarget.value)}
									errors={form.errors.password_confirmation}
								/>
							</div>

							<div className="col-span-6">
								<Label forInput="password_confirmation" className="leading-7 text-sm text-gray-100" value="Confirm Password" />
								<Input
									type="password"
									name="password_confirmation"
									className="mt-1 block w-full"
									autoComplete="off"
									value={form.data.password_confirmation}
									handleChange={(e) => form.setData('password_confirmation', e.currentTarget.value)}
									errors={form.errors.password_confirmation}
								/>
							</div>
						</div>
					</div>

					<div className="flex items-center justify-end px-4 py-3 bg-gray-900 text-right sm:px-6 shadow sm:rounded-bl-md sm:rounded-br-md">
						<Button type="submit" processing={form.processing} className={form.processing ? 'opacity-25' : ''}>Save</Button>
					</div>
				</form>
			</div>
		</div>
	);
}
