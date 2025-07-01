import { Navigator } from '@solidjs/router';
import { SetStoreFunction } from 'solid-js/store';
import AppState from '../interfaces/AppState';

export class ApiRequest {
	private static instance: ApiRequest;
	private appState: AppState;
	private setAppState: SetStoreFunction<AppState>;
	private navigate: Navigator;

	private constructor(appState: AppState, setAppState: SetStoreFunction<AppState>, navigate: Navigator) {
		this.appState = appState;
		this.setAppState = setAppState;
		this.navigate = navigate;
	}

	static initialize(appState: AppState, setAppState: SetStoreFunction<AppState>, navigate: Navigator): ApiRequest {
		if (!ApiRequest.instance) {
			ApiRequest.instance = new ApiRequest(appState, setAppState, navigate);
		}

		return ApiRequest.instance;
	}

	static getInstance(): ApiRequest {
		if (!ApiRequest.instance) {
			throw new Error('Application is not initialized.');
		}

		return ApiRequest.instance;
	}

	makeRequest(endpoint: string, init?: RequestInit): Promise<Response> {
		init = init ?? {};
		const headers = new Headers({
			'Content-Type': 'application/json',
			'Accept': 'application/json',
		});

		(new Headers(init.headers ?? {})).forEach((value, key) => headers.set(key, value));

		if (this.appState.auth.token) {
			headers.set('Authorization', `Bearer ${this.appState.auth.token}`);
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
						this.setAppState('auth', { token: null, user: null });
						this.navigate('/login', { replace: true });
						reject(new Error('Unauthenticated!'));
						return;
					}

					resolve(response);
				}).catch(error => reject(error));
		});
	}
}

const request = (endpoint: string, init?: RequestInit) => {
	return ApiRequest.getInstance().makeRequest(endpoint, init);
};

export default request;
