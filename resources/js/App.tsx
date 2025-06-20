import { createContext, createSignal, Component, Accessor, Setter } from 'solid-js';
import { makePersisted, storageSync, AsyncStorage } from '@solid-primitives/storage';
import { Location, useLocation } from '@solidjs/router';
import { createStore, SetStoreFunction } from 'solid-js/store';
import { Link } from '@kobalte/core/link';
import { logout } from './util/AuthHelpers';
import ApplicationLogo from './components/ApplicationLogo';
import NavLink from './components/ui/NavLink';
import Dropdown from './components/ui/Dropdown';
import ResponsiveNavLink from './components/ui/ResponsiveNavLink';
import Modal from './components/ui/Modal';
import AppState from './interfaces/AppState';

export type AppContextType = {
	appState: AppState,
	setAppState: SetStoreFunction<AppState>
};

export const AppContext = createContext<AppContextType>({} as AppContextType);
const baseAppState: AppState = {
	auth: {
		token: null,
		user: null
	}
};

const [key, setKey] = createSignal<CryptoKey>();
const [storedIV, setStoredIV] = makePersisted(createSignal<string | null>(null), {
	name: 'iv',
	sync: storageSync
});

const encrypt = async (data: string) => {
	if (key() == null || key() == undefined) {
		throw new Error("Encryption key is not set.");
	}

	const iv = window.crypto.getRandomValues(new Uint8Array(12));
	setStoredIV(btoa(String.fromCharCode(...new Uint8Array(iv))));

	return await crypto.subtle.encrypt({
		name: 'AES-GCM',
		iv: iv
	}, key()!, new TextEncoder().encode(data));
};

const decrypt = async (data: ArrayBuffer) => {
	if (key() == null || key() == undefined) {
		throw new Error("Decryption key is not set.");
	}

	if (storedIV() == null || storedIV() == undefined) {
		throw new Error("IV is not set.");
	}

	let ivString = storedIV()!;
	if (ivString == null || ivString == undefined) {
		throw new Error("IV is not set.");
	}

	ivString = atob(ivString);
	const iv = new ArrayBuffer(ivString.length);
	const buffer = new Uint8Array(iv);
	for (let i = 0; i < ivString.length; i++) {
		buffer[i] = ivString.charCodeAt(i);
	}

	setStoredIV(null);
	return (new TextDecoder("utf-8")).decode(await crypto.subtle.decrypt({
		name: 'AES-GCM',
		iv: iv
	}, key()!, data));
};

interface AsyncSecureStorage extends AsyncStorage {
	storedKey: Accessor<JsonWebKey | null>;
	setStoredKey: Setter<JsonWebKey | null>;
	initialized: boolean;
	initialize: (this: AsyncSecureStorage) => Promise<void>;
}

const [storedKey, setStoredKey] = makePersisted(createSignal<JsonWebKey | null>(null), {
	name: 'key',
	sync: storageSync,
	serialize: (data: JsonWebKey | null) => btoa(JSON.stringify(data)),
	deserialize: (data: string) => JSON.parse(atob(data)) as JsonWebKey | null,
});

const secureLocalStorage: AsyncSecureStorage = {
	storedKey: storedKey,
	setStoredKey: setStoredKey,
	initialized: false,
	async initialize() {
		if (this.initialized) {
			return;
		}

		if (this.storedKey() == null) {
			localStorage.clear();
			const key: CryptoKey = await crypto.subtle.generateKey(
				{
					name: "AES-GCM",
					length: 256,
				},
				true,
				["encrypt", "decrypt"]
			);

			setKey(key);
			const jwk: JsonWebKey = await crypto.subtle.exportKey('jwk', key);
			this.setStoredKey(jwk);
			return;
		}

		const key: CryptoKey = await crypto.subtle.importKey(
			'jwk',
			this.storedKey() as JsonWebKey,
			{
				name: "AES-GCM",
				length: 256,
			},
			true,
			["encrypt", "decrypt"]
		);

		setKey(key);
		if (storedIV() == null) {
			localStorage.removeItem("app");
		}
	},
	async getItem(key: string): Promise<any> {
		if (!this.initialized) {
			await this.initialize();
		}

		let data = localStorage.getItem(key);
		if (data == null) {
			return null;
		}

		data = atob(data);
		const cipher = new ArrayBuffer(data.length);
		const buffer = new Uint8Array(cipher);
		for (let i = 0; i < data.length; i++) {
			buffer[i] = data.charCodeAt(i);
		}

		const item = JSON.parse(await decrypt(cipher));
		const reEncryptedItem = await encrypt(JSON.stringify(item));
		localStorage.setItem(key, btoa(String.fromCharCode(...new Uint8Array(reEncryptedItem))));
		return item;
	},
	setItem: async (key: string, value: any) => {
		const cipher = await encrypt(JSON.stringify(value));
		localStorage.setItem(key, btoa(String.fromCharCode(...new Uint8Array(cipher))));
	},
	removeItem: async (key: string) => {
		localStorage.removeItem(key);
	},
	clear: async () => {
		localStorage.clear();
	},
	key: async (index: number) => {
		return localStorage.key(index)
	}
};

const [appState, setAppState] = makePersisted(createStore<AppState>(baseAppState), {
	name: 'app',
	sync: storageSync,
	storage: secureLocalStorage
});

const App: Component<{children?: any}> = (props) => {
	const locationIs = (page: string) => {
		const location: Location<unknown> = useLocation();
		const locations: string[] = location.pathname.split("/");
		if (locations.length <= 1) {
			return page === "";
		}

		return locations[1] === page;
	};

	const [showingNavigationDropdown, setShowingNavigationDropdown] = createSignal(false);
	const [showUserModal, setShowUserModal] = createSignal(false);
	const isAdmin: boolean = appState.auth.user != null && appState.auth.user.is_admin === true;

	return (
		<div class="flex flex-col min-h-screen justify-between">
			<nav class="bg-gray-900 border-b border-gray-800">
				<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div class="flex justify-between h-16">
						<div class="flex">
							<div class="shrink-0 flex items-center">
								<Link href="/">
									<ApplicationLogo class="block h-16 w-auto text-blue-500 hover:text-blue-600" />
								</Link>
							</div>
							<div class="hidden space-x-8 sm:-my-px sm:ml-10 sm:flex">
								<NavLink href="/" active={locationIs("")}>
									Home
								</NavLink>
								<NavLink href="/admin" show={isAdmin} active={false}>
									Admin
								</NavLink>
							</div>
						</div>

						<div class="hidden sm:flex sm:items-center sm:ml-6 top-0 right-0 px-6 py-4">
							{!appState.auth.user ? (
								<>
									<Link href="/login" class="text-sm text-gray-400 hover:text-white">
										Log in
									</Link>

									<Link href="/register" class="ml-4 text-sm text-gray-400 hover:text-white">
										Register
									</Link>
								</>
							) : null}
						</div>

						{ appState.auth.user ? (
							<div class="hidden sm:flex sm:items-center sm:ml-6">
								<div class="ml-3 relative">
									<Dropdown>
										<Dropdown.Trigger>
											<span class="inline-flex rounded-md">
												<button
													type="button"
													class="cursor-pointer inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-400 bg-gray-900 hover:text-blue-400 focus:text-blue-500 focus:outline-none transition ease-in-out duration-150"
												>
													{appState.auth.user?.name || ''}

													<svg
														class="ml-2 -mr-0.5 h-4 w-4"
														xmlns="http://www.w3.org/2000/svg"
														viewBox="0 0 20 20"
														fill="currentColor"
													>
														<path
															fill-rule="evenodd"
															d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
															clip-rule="evenodd"
														/>
													</svg>
												</button>
											</span>
										</Dropdown.Trigger>

										<Dropdown.Content>
											<Dropdown.Button onClick={() => setShowUserModal(true)}>
												Account Settings
											</Dropdown.Button>
											<Dropdown.Button onClick={() => logout(appState.auth.token!, setAppState)}>
												Log Out
											</Dropdown.Button>
										</Dropdown.Content>
									</Dropdown>
								</div>
							</div>
						) : null }

						<div class="-mr-2 flex items-center sm:hidden">
							<button
								onClick={() => setShowingNavigationDropdown((previousState) => !previousState)}
								class="inline-flex items-center justify-center p-2 rounded-md text-white bg-gray-700 hover:text-gray-500 hover:bg-gray-800 focus:outline-none focus:bg-gray-800 focus:text-gray-100 transition duration-150 ease-in-out"
							>
								<svg class="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
									<path
										class={!showingNavigationDropdown() ? 'inline-flex' : 'hidden'}
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M4 6h16M4 12h16M4 18h16"
									/>
									<path
										class={showingNavigationDropdown() ? 'inline-flex' : 'hidden'}
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</button>
						</div>
					</div>
				</div>

				<div class={(showingNavigationDropdown() ? 'block' : 'hidden') + ' sm:hidden'}>
					<div class="pt-2 pb-3 space-y-1">
						<ResponsiveNavLink href="/" active={locationIs("")}>
							Home
						</ResponsiveNavLink>
						{ appState.auth.user && appState.auth.user.is_admin && (
							<ResponsiveNavLink href="/admin" active={false}>
								Admin
							</ResponsiveNavLink>
						)}
					</div>
					{ appState.auth.user ? (
						<div class="pt-4 pb-1 border-t border-gray-200">
							<div class="px-4">
								<div class="font-medium text-base text-gray-800">{appState.auth.user.name}</div>
								<div class="font-medium text-sm text-gray-500">{appState.auth.user.email}</div>
							</div>

							<div class="mt-3 space-y-1">
								<ResponsiveNavLink href="/logout" as="button">
									Log Out
								</ResponsiveNavLink>
							</div>
						</div>
					) : (
						<div class="pt-4 pb-1 border-t border-gray-800">
							<div class="mt-3 space-y-1">
								<ResponsiveNavLink href="/login">
									Log in
								</ResponsiveNavLink>
								<ResponsiveNavLink href="/register">
									Register
								</ResponsiveNavLink>
							</div>
						</div>
					)}
				</div>
			</nav>

			<main>
				<AppContext.Provider value={{ appState, setAppState }}>
					{props.children}
				</AppContext.Provider>
			</main>

			<Modal
				open={showUserModal()}
				onOpenChange={setShowUserModal}
				size="xl"
			>
				<Modal.Header>
					<h2 class="text-2xl font-bold">Add Category</h2>
				</Modal.Header>
				<Modal.Body>
					Profile Goes Here
				</Modal.Body>
			</Modal>
			<footer />
		</div>
	);
};

export default App;