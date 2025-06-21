import { Component, createEffect, createSignal, on, Show } from "solid-js";
import { Input } from "../../components/ui/Input";
import { Alert } from "@kobalte/core/alert";
import * as EmailValidator from 'email-validator';
import Button from "../../components/ui/Button";
import ValidationErrors from "../../components/ui/ValidationErrors";

const ForgotPassword: Component = () => {
	const [status, setStatus] = createSignal<string | null>(null);
	const [email, setEmail] = createSignal('');
	const [errors, setErrors] = createSignal<string[]>([]);
	const [processing, setProcessing] = createSignal(false);

	const reset = (processing: boolean = false) => {
		setStatus(null);
		setErrors([]);
		setProcessing(processing);
	};

	const submit = (e: any) => {
		e.preventDefault();

		const errors: string[] = [];
		if (email().trim() === '') {
			errors.push('The email field may not be blank.');
		}

		if (!EmailValidator.validate(email().trim())) {
			errors.push('The email must be a valid email address.');
		}

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

		try {
			const response = await fetch(`${import.meta.env.VITE_API_URL}/forgot/password`, {
				method: 'POST',
				body: JSON.stringify({ email: email().trim() }),
				headers: {
					'Content-Type': 'application/json',
				}
			});

			const data: any = await response.json();
			if (!data.success) {
				setErrors((Object.values(data.errors || {}) as string[][]).flat());
				setStatus(null);
				return;
			}

			setErrors([]);
			setStatus(data.data.message);
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

					<div class="mb-4 text-sm text-white leading-normal">
						Forgot your password? No problem. Just let us know your email address and we will email you a password
						reset link that will allow you to choose a new one.
					</div>

					<form onSubmit={submit}>
						<Input
							type="text"
							name="email"
							value={email()}
							class="mt-1 block w-full"
							handleChange={(e: any) => setEmail(e.target.value)}
							required
							darkBg
						/>

						<div class="flex items-center justify-end mt-4">
							<Button class="ml-4" processing={processing}>
								Email Password Reset Link
							</Button>
						</div>
					</form>
				</div>
			</div>
		</section>
	);
}

export default ForgotPassword;