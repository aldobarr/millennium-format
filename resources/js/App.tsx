import { createContext, createSignal, Component, Accessor, Setter } from 'solid-js';
import { makePersisted, storageSync, AsyncStorage } from '@solid-primitives/storage';
import { createStore, SetStoreFunction } from 'solid-js/store';
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
	return (
		<AppContext.Provider value={{ appState, setAppState }}>
			{props.children}
		</AppContext.Provider>
	);
};

export default App;