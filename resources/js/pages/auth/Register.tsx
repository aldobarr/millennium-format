import { Component, createEffect, createSignal, on, Show, useContext } from "solid-js";
import { Input } from "../../components/ui/Input";
import { Link } from "@kobalte/core/link";
import { Alert } from "@kobalte/core/alert";
import { AppContext } from "../../App";
import ValidationErrors from "../../components/ui/ValidationErrors";
import Label from "../../components/ui/Label";
import * as EmailValidator from 'email-validator';
import Button from "../../components/ui/Button";

const Register: Component = () => {
	const [status, setStatus] = createSignal<string | null>(null);
	const [email, setEmail] = createSignal('');
	const [errors, setErrors] = createSignal<string[]>([]);
	const [processing, setProcessing] = createSignal(false);
	const { setAppState } = useContext(AppContext);

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

		if (!EmailValidator.validate(email())) {
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
			const body: any = {
				email: email().trim()
			};

			const response = await fetch(`${import.meta.env.VITE_API_URL}/verify/email`, {
				method: 'POST',
				body: JSON.stringify(body),
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
			setAppState('validatingEmail', body.email);
			setStatus(data.data.expiration);
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
						<Alert class="alert alert-success">
							A verification email has been sent to your email address.
							Please check your inbox and follow the instructions to complete your registration.
							Your verification link will expire in <strong>{status()} minutes</strong>.
						</Alert>
					</Show>
					<ValidationErrors errors={errors} />

					<form onSubmit={submit}>
						<h2 class="text-white text-lg font-medium title-font mb-5">Register</h2>
						<div class="relative mb-4">
							<Label for="email" value="Email" />
							<Input
								type="email"
								name="email"
								value={email()}
								class="mt-1 block w-full"
								autoComplete="username"
								handleChange={(e: any) => setEmail(e.currentTarget.value)}
								required
							/>
						</div>

						<div class="flex items-center justify-end mt-4">
							<Link href="/login" class="hover:underline text-sm text-blue-600 hover:text-blue-800">
								Already registered?
							</Link>

							<Button class="ml-4" processing={processing}>
								Verify Email
							</Button>
						</div>
					</form>
				</div>
			</div>
		</section>
	);
}

export default Register;