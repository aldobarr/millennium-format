import { userEvent } from '@vitest/browser/context';
import { expect, vi } from 'vitest';
import { render, screen } from '@solidjs/testing-library';
import { createStore } from 'solid-js/store';
import type AppState from '../../../../resources/js/interfaces/AppState';
import { AppContext } from '../../../../resources/js/App';
import DeckBuilder from '../../../../resources/js/components/DeckBuilder';
import { ApiRequest } from '../../../../resources/js/util/Requests';
import { card, deck } from '../../fixtures/decks';
import type Deck from '../../../../resources/js/interfaces/Deck';

let editor: HTMLElement;
let categoryNames: string[] = [];
const browserFetch = window.fetch.bind(window);

export async function renderDeck(fixture: Deck = deck()) {
	vi.stubGlobal('fetch', async (input: RequestInfo | URL, options?: RequestInit) => {
		const url = new URL(input instanceof Request ? input.url : String(input));
		if (url.origin !== 'http://deck-fixture.test') return browserFetch(input, options);
		if (url.pathname === '/api/decks/42' && (!options?.method || options.method === 'GET')) {
			return Response.json({ success: true, data: fixture });
		}
		if (url.pathname === '/api/search') return Response.json({ success: true, data: [card(7)] });
		throw new Error('Unexpected fixture API request: ' + url);
	});
	const [appState, setAppState] = createStore<AppState>({
		nav: [], auth: { token: 'test-session', user: null },
	});
	ApiRequest.initialize(appState, setAppState, () => {
		throw new Error('Unexpected navigation during a deck interaction');
	});
	const view = render(() => (
		<AppContext.Provider value={{ appState, setAppState }}>
			<DeckBuilder deckId={42} />
		</AppContext.Provider>
	));
	editor = view.container;
	categoryNames = fixture.categories.map(category => category.name);
	await vi.waitFor(() => expect(screen.queryByDisplayValue(fixture.name)).not.toBeNull());
	await vi.waitFor(() => expect(screen.queryByRole('img', { name: 'Card-1' })).not.toBeNull());
	await Promise.all(Array.from(editor.querySelectorAll('img')).map(image => image.decode()));
	return view;
}

export const deckEditor = () => editor;
export const deckCategoryNames = () => categoryNames;

export async function searchForCard() {
	// The existing search input has no accessible label; its HTML name is the
	// single fallback locator. Search submission still uses the visible button.
	const input = editor.querySelector('input[name="search"]')!;
	await userEvent.fill(input, 'Card-7');
	await userEvent.click(screen.getByRole('button', { name: 'Search' }));
	await vi.waitFor(() => expect(screen.queryByRole('img', { name: 'Card-7' })).not.toBeNull());
	await (screen.getByRole('img', { name: 'Card-7' }) as HTMLImageElement).decode();
}
