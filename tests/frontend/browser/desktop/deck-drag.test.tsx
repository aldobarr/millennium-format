import { commands } from '@vitest/browser/context';
import { describe, expect, it, vi } from 'vitest';
import { card, deck } from '../../fixtures/decks';
import { renderDeck, searchForCard } from '../support/render-deck';
import {
	cardImage, categoryCards, categoryDropPoint, categoryHeading, categoryImages,
	categoryRegion, expectHeldAt, grabPoint, heldCard, pointIn, visibleCategoryOrder,
} from '../support/deck-screen';
import { dragUntilVisible, expectScrollStarted, expectScrollStopped, moveTo, nearBottom, nearTop, pause, pickUp, releaseCard } from '../support/gestures';

function singleCardDeck() {
	const fixture = deck([card(1)]);
	fixture.categories = fixture.categories.filter(category => category.id !== 'category-2');
	return fixture;
}

async function deckWithOneRow(full: boolean) {
	// Discover row capacity from the rendered UI. Card size, gaps, column
	// count, and responsive breakpoints are not part of the contract.
	const candidates = [card(1), ...Array.from({ length: 15 }, (_, index) => card(index + 10))];
	const probe = await renderDeck(deck(candidates));
	const images = categoryImages();
	const first = images[0].getBoundingClientRect();
	const capacity = images.filter(image => Math.abs(image.getBoundingClientRect().top - first.top) < first.height / 2).length;
	probe.unmount();
	await renderDeck(deck(candidates.slice(0, full ? capacity : Math.max(1, capacity - 1))));
}

describe('Moving cards and previewing placement', () => {
	it.each(['Card-1', 'Card-4'])('picking up %s within its own slot preserves the deck order', async (name) => {
		await renderDeck();
		await pickUp(name);
		expect(categoryCards()).toEqual(['Card-1', 'Card-2', 'Card-3', 'Card-4']);
	});

	it('moving Card-4 to Card-2 previews and commits insertion before Card-2', async () => {
		await renderDeck();
		await pickUp('Card-4');
		await moveTo(pointIn(cardImage('Card-2', 'Category-1')));
		const expected = ['Card-1', 'Card-4', 'Card-2', 'Card-3'];
		await vi.waitFor(() => expect(categoryCards()).toEqual(expected));
		await releaseCard();
		await vi.waitFor(() => expect(categoryCards()).toEqual(expected));
	});

	it('small movements within the chosen slot keep its insertion preview stable', async () => {
		await renderDeck();
		await pickUp('Card-4');
		const target = cardImage('Card-2', 'Category-1').getBoundingClientRect();
		const point = { x: target.left + target.width / 2, y: target.top + target.height / 2 };
		await moveTo(point);
		const expected = ['Card-1', 'Card-4', 'Card-2', 'Card-3'];
		await vi.waitFor(() => expect(categoryCards()).toEqual(expected));
		for (const fraction of [0.03, -0.03, 0]) {
			await moveTo({ x: point.x + target.width * fraction, y: point.y });
			expect(categoryCards()).toEqual(expected);
		}
	});

	it('a search result previews and drops before the pointed-to card, preserving the other cards', async () => {
		await renderDeck();
		await searchForCard();
		await pickUp('Card-7');
		await moveTo(pointIn(cardImage('Card-2', 'Category-1')));
		const expected = ['Card-1', 'Card-7', 'Card-2', 'Card-3', 'Card-4'];
		await vi.waitFor(() => expect(categoryCards()).toEqual(expected));
		await releaseCard();
		await vi.waitFor(() => expect(categoryCards()).toEqual(expected));
	});

	it('grabbing a search card off-center still inserts it at the mouse position', async () => {
		await renderDeck();
		await searchForCard();
		await pickUp('Card-7', { x: 0.1 });
		await moveTo(pointIn(cardImage('Card-1', 'Category-1'), 0.8));
		await vi.waitFor(() => expect(categoryCards()).toEqual(['Card-7', 'Card-1', 'Card-2', 'Card-3', 'Card-4']));
	});

	it.each([false, true])('a search preview follows the visible destination after previewing in a row (full: %s)', async (full) => {
		await deckWithOneRow(full);
		await searchForCard();
		cardImage('Card-7').scrollIntoView({ block: 'start', behavior: 'instant' });
		await pickUp('Card-7', { reveal: false });
		const originalCards = categoryCards();
		const belowBefore = categoryHeading('Category-2').getBoundingClientRect().top;
		await moveTo(pointIn(cardImage('Card-1', 'Category-1')));
		await vi.waitFor(() => expect(categoryCards()).toEqual(['Card-7', ...originalCards]));
		// Establish the scenario, not a five-column or fixed-height layout.
		if (full) expect(categoryHeading('Category-2').getBoundingClientRect().top).toBeGreaterThan(belowBefore);
		const target = categoryDropPoint('Category-2');
		expect(target.y, 'the destination is visible without another scrolling gesture').toBeGreaterThan(0);
		expect(target.y).toBeLessThan(innerHeight);
		await moveTo(target);
		await vi.waitFor(() => expect(categoryCards('Category-2')).toEqual(['Card-7', 'Card-5', 'Card-6']));
		expect(categoryCards()).toEqual(originalCards);
	});

	it('reordering a category preserves the displayed category order on drop', async () => {
		await renderDeck();
		const heading = categoryHeading('Category-1');
		heading.scrollIntoView({ block: 'center', behavior: 'instant' });
		const origin = pointIn(heading);
		await moveTo(origin);
		await commands.pointer({ type: 'down' });
		await moveTo({ x: origin.x + heading.getBoundingClientRect().width * 0.05, y: origin.y });
		await moveTo(pointIn(categoryHeading('Category-2')));
		const expected = ['Deck Master', 'Category-2', 'Category-1', 'Extra Deck', 'Side Deck'];
		await vi.waitFor(() => expect(visibleCategoryOrder()).toEqual(expected));
		await releaseCard();
		await vi.waitFor(() => expect(visibleCategoryOrder()).toEqual(expected));
	});
});

describe('Scrolling while managing a deck', () => {
	it.each(['before pickup', 'while holding', 'after release'])('wheel scrolling works %s', async (phase) => {
		await renderDeck(singleCardDeck());
		cardImage('Card-1').scrollIntoView({ block: 'center', behavior: 'instant' });
		const pointer = phase === 'before pickup' ? pointIn(cardImage('Card-1')) : await pickUp('Card-1');
		await moveTo(pointer);
		if (phase === 'after release') await releaseCard();
		const grab = phase === 'while holding' ? grabPoint('Card-1', pointer) : undefined;
		const before = window.scrollY;
		await commands.pointer({ type: 'wheel', deltaY: innerHeight / 4 });
		await expectScrollStarted(before);
		if (phase === 'while holding') await expectHeldAt('Card-1', pointer, grab!);
	});

	it.each([0.1, 0.5, 0.9])('the pointer at the viewport edge starts scrolling regardless of grab height (%s)', async (grabHeight) => {
		await renderDeck(singleCardDeck());
		const pointer = await pickUp('Card-1', { y: grabHeight });
		const before = window.scrollY;
		await moveTo({ x: pointer.x, y: nearBottom() });
		await expectScrollStarted(before);
	});

	it('the same pointer position has the same scrolling behavior regardless of where the card was grabbed', async () => {
		const scrolling: boolean[] = [];
		// This compares the same user gesture. It does not prescribe the
		// implementation's edge-zone width or scrolling speed.
		for (const grabHeight of [0.5, 0.1]) {
			const view = await renderDeck(singleCardDeck());
			const pointer = await pickUp('Card-1', { y: grabHeight });
			const before = window.scrollY;
			await moveTo({ x: pointer.x, y: innerHeight * 0.9 });
			await pause(250);
			scrolling.push(window.scrollY > before);
			await releaseCard();
			view.unmount();
			window.scrollTo(0, 0);
		}
		expect(scrolling[1]).toBe(scrolling[0]);
	});

	it.each(['top of page', 'already scrolled'])('a card can be placed in the visible category after scrolling from the %s', async (start) => {
		await renderDeck(singleCardDeck());
		if (start === 'top of page') window.scrollTo(0, 0);
		const pointer = await pickUp('Card-1', { reveal: start !== 'top of page' });
		await dragUntilVisible(() => categoryDropPoint('Side Deck'), pointer.x);
		await vi.waitFor(() => expect(categoryCards('Side Deck')).toEqual(['Card-1']));
		await releaseCard();
		await vi.waitFor(() => expect(categoryCards('Side Deck')).toEqual(['Card-1']));
		expect(categoryCards()).toEqual([]);
	});

	it('the preview follows a category that scrolls under a stationary pointer', async () => {
		await renderDeck(singleCardDeck());
		window.scrollTo(0, 0);
		const pointer = await pickUp('Card-1', { reveal: false });
		const edge = { x: pointer.x, y: nearBottom() };
		expect(categoryRegion('Side Deck').getBoundingClientRect().top).toBeGreaterThan(edge.y);
		await moveTo(edge);
		await vi.waitFor(() => {
			const rect = categoryRegion('Side Deck').getBoundingClientRect();
			expect(edge.y).toBeGreaterThan(rect.top + rect.height / 4);
			expect(edge.y).toBeLessThan(rect.bottom - rect.height / 4);
		}, { timeout: 2500 });
		expect(categoryCards('Side Deck')).toEqual(['Card-1']);
	});

	it('a held card can return to the main deck after visiting another category and scrolling back', async () => {
		await renderDeck(singleCardDeck());
		const pointer = await pickUp('Card-1');
		await dragUntilVisible(() => categoryDropPoint('Side Deck'), pointer.x);
		await vi.waitFor(() => expect(categoryCards('Side Deck')).toEqual(['Card-1']));
		await moveTo({ x: pointer.x, y: nearTop() });
		await vi.waitFor(() => expect(window.scrollY).toBe(0), { timeout: 2500 });
		await moveTo(categoryDropPoint('Category-1'));
		await vi.waitFor(() => expect(categoryCards()).toEqual(['Card-1']));
		await releaseCard();
		expect(categoryCards('Side Deck')).toEqual([]);
	});

	it.each(['returning to the middle', 'releasing the card'])('automatic scrolling stops after %s', async (action) => {
		await renderDeck(singleCardDeck());
		const pointer = await pickUp('Card-1');
		const before = window.scrollY;
		await moveTo({ x: pointer.x, y: nearBottom() });
		await expectScrollStarted(before);
		if (action === 'releasing the card') await releaseCard();
		else await moveTo({ x: pointer.x, y: innerHeight / 2 });
		await expectScrollStopped();
		if (action === 'releasing the card') await vi.waitFor(() => expect(heldCard('Card-1')).toBeUndefined());
	});

	it('the held card stays with the pointer while automatic scrolling moves the page', async () => {
		await renderDeck(singleCardDeck());
		const pointer = await pickUp('Card-1');
		const before = window.scrollY;
		const grab = grabPoint('Card-1', pointer);
		const edge = { x: pointer.x, y: nearBottom() };
		await moveTo(edge);
		await expectScrollStarted(before);
		await expectHeldAt('Card-1', edge, grab);
	});
});
