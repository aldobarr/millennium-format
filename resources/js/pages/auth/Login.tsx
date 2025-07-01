import { Alert } from '@kobalte/core/alert';
import { Link } from '@kobalte/core/link';
import { Component, createEffect, createSignal, JSXElement, on, Show, useContext } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { Input } from '../../components/ui/Input';
import { AppContext } from '../../App';
import * as EmailValidator from 'email-validator';
import Label from '../../components/ui/Label';
import Button from '../../components/ui/Button';
import Checkbox from '../../components/ui/Checkbox';
import ValidationErrors from '../../components/ui/ValidationErrors';
import Authentication from '../../interfaces/Authentication';
import request from '../../util/Requests';

const Login: Component<{ children?: JSXElement }> = (props) => {
	const navigate = useNavigate();
	const [status, setStatus] = createSignal<string | null>(null);
	const [email, setEmail] = createSignal('');
	const [password, setPassword] = createSignal('');
	const [remember, setRemember] = createSignal(false);
	const [errors, setErrors] = createSignal<string[]>([]);
	const [processing, setProcessing] = createSignal(false);
	const { setAppState } = useContext(AppContext);

	const reset = (processing: boolean = false) => {
		setStatus(null);
		setErrors([]);
		setProcessing(processing);
	};

	const submit = async (e: SubmitEvent) => {
		e.preventDefault();

		const errors: string[] = [];
		if (email().trim() === '') {
			errors.push('The email field may not be blank.');
		}

		if (!EmailValidator.validate(email())) {
			errors.push('The email must be a valid email address.');
		}

		if (password() === '') {
			errors.push('The password field may not be blank.');
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

		const redirect = (data: Authentication) => {
			setAppState('auth', data);
			setTimeout(() => navigate('/', { replace: true }), 1500);
		};

		try {
			const body: {
				email: string;
				password: string;
				remember?: boolean;
			} = {
				email: email().trim(),
				password: password(),
			};

			if (remember()) {
				body['remember'] = true;
			}

			const res = await request('/login', {
				method: 'POST',
				body: JSON.stringify(body),
			});

			const response = await res.json();
			if (!response.success) {
				setErrors((Object.values(response.errors || {}) as string[][]).flat());
				setStatus(null);
				return;
			}

			setErrors([]);
			setStatus('Success! You will be redirected shortly.');
			redirect(response.data as Authentication);
		} catch (error) {
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
						<div class="relative mb-4">
							<Label for="email" class="leading-7 text-sm text-gray-400" value="Email" />
							<Input
								type="text"
								name="email"
								value={email()}
								class="mt-1 block w-full"
								autoComplete="username"
								handleChange={e => setEmail(e.currentTarget.value)}
								required
								darkBg
							/>
						</div>
						<div class="relative mb-4">
							<Label for="password" class="leading-7 text-sm text-gray-400" value="Password" />
							<Input
								type="password"
								name="password"
								value={password()}
								class="mt-1 block w-full"
								autoComplete="current-password"
								handleChange={e => setPassword(e.currentTarget.value)}
								required
								darkBg
							/>
						</div>
						<div class="relative mb-4">
							<label class="flex items-center">
								<Checkbox name="remember" checked={remember()} handleChange={e => setRemember(e.target.checked)} />

								<span class="ml-2 text-sm text-gray-400">Remember me</span>
							</label>
						</div>
						<div class="flex items-center justify-end mt-4">
							<Link
								href="/forgot/password"
								class="hover:underline text-sm text-blue-600 hover:text-blue-800"
							>
								Forgot your password?
							</Link>
							<Button class="ml-4" processing={processing}>
								Log in
							</Button>
						</div>
					</form>
				</div>
			</div>
			<div>
				{props.children}
			</div>
		</section>
	);
};

export default Login;
