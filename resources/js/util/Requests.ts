import { useContext } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { AppContext } from '../App';

const request = (endpoint: string, init?: RequestInit) => {
	const navigate = useNavigate();
	const { appState, setAppState } = useContext(AppContext);
	if (!appState) {
		throw new Error('Application is not initialized.');
	}

	init = init ?? {};
	const headers = new Headers({
		'Content-Type': 'application/json',
		'Accept': 'application/json',
	});

	(new Headers(init.headers ?? {})).forEach((value, key) => headers.set(key, value));

	if (appState.auth.token) {
		headers.set('Authorization', `Bearer ${appState.auth.token}`);
	}

	init.headers = headers;
	if (!endpoint.startsWith('/')) {
		endpoint = `/${endpoint}`;
	}

	const url = new URL(!endpoint.startsWith('http') ? (import.meta.env.VITE_API_URL + endpoint) : endpoint);
	return new Promise<Response>((resolve, reject) => {
		fetch(url, init)
			.then((response) => {
				if (response.status === 401) {
					setAppState('auth', { token: null, user: null });
					navigate('/login', { replace: true });
					reject(new Error('Unauthenticated!'));
					return;
				}

				resolve(response);
			}).catch(error => reject(error));
	});
};

export default request;
