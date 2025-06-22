import { Component, createEffect, createSignal, on, Show } from "solid-js";
import { Input } from "../../components/ui/Input";
import ValidationErrors from "../../components/ui/ValidationErrors";
import Label from "../../components/ui/Label";
import Button from "../../components/ui/Button";
import { useNavigate, useParams } from "@solidjs/router";
import { Alert } from "@kobalte/core/alert";
import { validatePasswordFields } from "../../util/AuthHelpers";

const ResetPassword: Component = () => {
	const params = useParams();
	const navigate = useNavigate();
	const [status, setStatus] = createSignal<string | null>(null);
	const [password, setPassword] = createSignal('');
	const [passwordConfirmation, setPasswordConfirmation] = createSignal('');
	const [errors, setErrors] = createSignal<string[]>([]);
	const [processing, setProcessing] = createSignal(false);

	const reset = (processing: boolean = false) => {
		setStatus(null);
		setErrors([]);
		setProcessing(processing);
	};

	const submit = (e: any) => {
		e.preventDefault();

		const errors: string[] = validatePasswordFields(password(), passwordConfirmation());
		if (Object.keys(errors).length > 0) {
			setErrors(errors);
			return;
		}

		reset(true);
	};

	createEffect(on(processing, async (isProcessing) => {
		if (!isProcessing) {
			return;
		}

		const redirect = () => setTimeout(() => navigate('/login', { replace: true }), 1500);

		try {
			const body: any = {
				token: params.token,
				password: password(),
				password_confirmation: passwordConfirmation()
			};

			const res = await fetch(`${import.meta.env.VITE_API_URL}/forgot/password/token`, {
				method: 'POST',
				body: JSON.stringify(body),
				headers: {
					'Content-Type': 'application/json',
				}
			});

			const response: any = await res.json();
			if (!response.success) {
				setErrors((Object.values(response.errors || {}) as string[][]).flat());
				setStatus(null);
				return;
			}

			setErrors([]);
			setStatus('Success! You will be redirected to login shortly.');
			redirect();
		} catch (error: any) {
			console.error(error);
			setErrors(['An unknown error occurred.']);
			setStatus(null);
		} finally {
			setProcessing(false);
		}
	}));

	return (
		<section class="text-gray-400 body-font">
			<div class="container px-5 py-24 mx-auto flex flex-wrap items-center">
				<div class="md:w-1/2 bg-gray-900 bg-opacity-50 rounded-lg p-8 flex flex-col md:mx-auto w-full mt-10 md:mt-0">
					<Show when={status() != null}>
						<Alert class="alert alert-success">{status()}</Alert>
					</Show>
					<ValidationErrors errors={errors} />

					<form onSubmit={submit}>
						<div class="mt-4">
							<Label for="password" value="Password" />

							<Input
								type="password"
								name="password"
								value={password()}
								class="mt-1 block w-full"
								handleChange={(e: any) => setPassword(e.currentTarget.value)}
								required
								darkBg
							/>
						</div>

						<div class="mt-4">
							<Label for="password_confirmation" value="Confirm Password" />

							<Input
								type="password"
								name="password_confirmation"
								value={passwordConfirmation()}
								class="mt-1 block w-full"
								handleChange={(e: any) => setPasswordConfirmation(e.currentTarget.value)}
								required
								darkBg
							/>
						</div>

						<div class="flex items-center justify-end mt-4">
							<Button class="ml-4" processing={processing}>
								Reset Password
							</Button>
						</div>
					</form>
				</div>
			</div>
		</section>
	);
}

export default ResetPassword;