import { SetStoreFunction } from "solid-js/store";
import AppState from "../interfaces/AppState";

const logout = async (token: string, setAppState: SetStoreFunction<AppState>) => {
	try {
		const response = await fetch(`${import.meta.env.VITE_API_URL}/logout`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		});

		const data: any = await response.json();
		if (!data.success) {
			throw new Error(data.errors ? (Array.isArray(data.errors) ? data.errors[0] : data.errors) : 'Logout failed');
		}
	} catch (error) {
		console.error('Clearing token failed:', error);
	} finally {
		setAppState('auth', { token: null, user: null });
	}
}

const validatePasswordFields = (password: string, passwordConfirmation: string): string[] => {
	const errors: string[] = [];
	if (password === '') {
		errors.push('The password field may not be blank.');
	}

	if (passwordConfirmation === '') {
		errors.push('The password confirmation field may not be blank.');
	}

	if (password.length < 10) {
		errors.push('The password must be at least 10 characters long.');
	}

	if (password.length > 100) {
		errors.push('The password may not be longer than 100 characters.');
	}

	if (!/[a-zA-Z]/.test(password)) {
		errors.push('The password must contain at least one letter.');
	}

	if (!/[0-9]/.test(password)) {
		errors.push('The password must contain at least one number.');
	}

	if (password !== passwordConfirmation) {
		errors.push('The passwords do not match.');
	}

	return errors;
}

export { logout, validatePasswordFields };