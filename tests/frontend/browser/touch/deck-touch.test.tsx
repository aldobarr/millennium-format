import { commands } from '@vitest/browser/context';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { card, deck } from '../../fixtures/decks';
import { renderDeck } from '../support/render-deck';
import { cardImage, categoryCards, categoryImages, categoryRegion, expectHeldAt, grabPoint, heldCard, pointIn } from '../support/deck-screen';
import { expectScrollStarted, expectScrollStopped, nearBottom } from '../support/gestures';

let fingerIsDown = false;

async function touchStart(x: number, y: number) {
	await commands.touch({ type: 'touchStart', x, y });
	fingerIsDown = true;
}

async function touchEnd() {
	await commands.touch({ type: 'touchEnd' });
	fingerIsDown = false;
}

afterEach(async () => {
	if (fingerIsDown) {
		await commands.touch({ type: 'touchCancel' });
		fingerIsDown = false;
	}
});

async function prepareCard() {
	const fixture = deck([card(1)]);
	fixture.categories = fixture.categories.filter(category => category.id !== 'category-2');
	await renderDeck(fixture);
	const source = cardImage('Card-1');
	source.scrollIntoView({ block: 'center', behavior: 'instant' });
	return pointIn(source);
}

async function holdCard() {
	const origin = await prepareCard();
	await touchStart(origin.x, origin.y);
	await vi.waitFor(() => expect(heldCard('Card-1')).toBeDefined(), { timeout: 2000 });
	return { ...origin, grab: grabPoint('Card-1', origin) };
}

describe('Managing decks by touch', () => {
	it('a short tap does not leave a held card', async () => {
		const origin = await prepareCard();
		await touchStart(origin.x, origin.y);
		await touchEnd();
		await vi.waitFor(() => expect(heldCard('Card-1')).toBeUndefined());
	});

	it('after a long press the card follows the finger throughout the gesture', async () => {
		const origin = await holdCard();
		const distance = cardImage('Card-1', 'Category-1').getBoundingClientRect().height * 0.6;
		for (const fraction of [0.2, 0.4, 0.6, 0.8, 1]) {
			await commands.touch({ type: 'touchMove', x: origin.x, y: origin.y + distance * fraction });
		}
		await expectHeldAt('Card-1', { x: origin.x, y: origin.y + distance }, origin.grab);
	});

	it('touch placement follows the held card overlap even when the finger is in a neighboring slot', async () => {
		await renderDeck(deck([card(1), card(2), card(3)]));
		cardImage('Card-2').scrollIntoView({ block: 'center', behavior: 'instant' });
		const first = pointIn(cardImage('Card-1'));
		const second = pointIn(cardImage('Card-2'));
		// Follow the responsive layout rather than requiring a particular column count.
		const horizontal = Math.abs(second.x - first.x) > Math.abs(second.y - first.y);
		const origin = pointIn(cardImage('Card-3'), horizontal ? 0.9 : 0.5, horizontal ? 0.5 : 0.9);
		await touchStart(origin.x, origin.y);
		await vi.waitFor(() => expect(heldCard('Card-3')).toBeDefined());
		const destination = pointIn(cardImage('Card-2', 'Category-1'), horizontal ? 0.1 : 0.5, horizontal ? 0.5 : 0.1);
		await commands.touch({ type: 'touchMove', ...destination });
		const expected = ['Card-3', 'Card-1', 'Card-2'];
		await vi.waitFor(() => expect(categoryCards()).toEqual(expected));
		await touchEnd();
		await vi.waitFor(() => {
			expect(heldCard('Card-3')).toBeUndefined();
			expect(categoryCards()).toEqual(expected);
		});
	});

	it('moving a card forward by touch previews and commits the next displayed slot', async () => {
		await renderDeck(deck([card(1), card(2), card(3)]));
		cardImage('Card-2').scrollIntoView({ block: 'center', behavior: 'instant' });
		const origin = pointIn(cardImage('Card-1'));
		await touchStart(origin.x, origin.y);
		await vi.waitFor(() => expect(heldCard('Card-1')).toBeDefined());
		await commands.touch({ type: 'touchMove', ...pointIn(cardImage('Card-2', 'Category-1')) });
		const expected = ['Card-2', 'Card-1', 'Card-3'];
		await vi.waitFor(() => expect(categoryCards()).toEqual(expected));
		await touchEnd();
		await vi.waitFor(() => {
			expect(heldCard('Card-1')).toBeUndefined();
			expect(categoryCards()).toEqual(expected);
		});
	});

	it('a continuous touch drag can reverse through the same slots and drop at the chosen slot', async () => {
		await renderDeck(deck([card(1), card(2)]));
		cardImage('Card-2').scrollIntoView({ block: 'center', behavior: 'instant' });
		const slots = categoryImages().map(image => pointIn(image));
		let finger = slots[1];
		await touchStart(finger.x, finger.y);
		await vi.waitFor(() => expect(heldCard('Card-2')).toBeDefined());
		for (const { slot, expected } of [
			{ slot: 0, expected: ['Card-2', 'Card-1'] },
			{ slot: 1, expected: ['Card-1', 'Card-2'] },
			{ slot: 0, expected: ['Card-2', 'Card-1'] },
		]) {
			const start = finger;
			const destination = slots[slot];
			for (const fraction of [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]) {
				finger = { x: start.x + (destination.x - start.x) * fraction, y: start.y + (destination.y - start.y) * fraction };
				await commands.touch({ type: 'touchMove', ...finger });
			}
			await vi.waitFor(() => expect(categoryCards()).toEqual(expected));
		}
		await touchEnd();
		await vi.waitFor(() => {
			expect(heldCard('Card-2')).toBeUndefined();
			expect(categoryCards()).toEqual(['Card-2', 'Card-1']);
		});
	});

	it('lifting the finger ends the drag', async () => {
		const origin = await holdCard();
		const distance = cardImage('Card-1', 'Category-1').getBoundingClientRect().height / 2;
		await commands.touch({ type: 'touchMove', x: origin.x, y: origin.y + distance });
		await touchEnd();
		await vi.waitFor(() => expect(heldCard('Card-1')).toBeUndefined(), { timeout: 2000 });
	});

	it('an interrupted touch gesture ends cleanly and allows a new drag', async () => {
		const origin = await holdCard();
		await commands.touch({ type: 'touchCancel' });
		fingerIsDown = false;
		await vi.waitFor(() => expect(heldCard('Card-1')).toBeUndefined(), { timeout: 2000 });
		// Ordinary pointer movement must not revive the cancelled gesture.
		await commands.pointer({ type: 'move', x: origin.x, y: origin.y + cardImage('Card-1').getBoundingClientRect().height / 2 });
		expect(heldCard('Card-1')).toBeUndefined();
		const nextOrigin = pointIn(cardImage('Card-1'));
		await touchStart(nextOrigin.x, nextOrigin.y);
		await vi.waitFor(() => expect(heldCard('Card-1')).toBeDefined());
		await touchEnd();
		await vi.waitFor(() => expect(heldCard('Card-1')).toBeUndefined());
	});

	it('a stationary finger previews and drops in a category as it scrolls underneath', async () => {
		const origin = await holdCard();
		const edge = { x: origin.x, y: nearBottom() };
		expect(categoryRegion('Side Deck').getBoundingClientRect().top).toBeGreaterThan(edge.y);
		await commands.touch({ type: 'touchMove', ...edge });
		// Keep the finger still while the destination scrolls beneath the held card.
		await vi.waitFor(() => {
			const destination = categoryRegion('Side Deck').getBoundingClientRect();
			expect(edge.y).toBeGreaterThan(destination.top + destination.height / 4);
			expect(edge.y).toBeLessThan(destination.bottom - destination.height / 4);
		}, { timeout: 2500 });
		expect(categoryCards('Side Deck')).toEqual(['Card-1']);
		await touchEnd();
		await vi.waitFor(() => {
			expect(heldCard('Card-1')).toBeUndefined();
			expect(categoryCards('Side Deck')).toEqual(['Card-1']);
			expect(categoryCards()).toEqual([]);
		});
		await expectScrollStopped();
	});

	it('an interrupted touch gesture stops automatic edge scrolling', async () => {
		const origin = await holdCard();
		const before = window.scrollY;
		await commands.touch({ type: 'touchMove', x: origin.x, y: nearBottom() });
		await expectScrollStarted(before);
		await commands.touch({ type: 'touchCancel' });
		fingerIsDown = false;
		await expectScrollStopped();
		await vi.waitFor(() => expect(heldCard('Card-1')).toBeUndefined());
	});

	it('lifting the finger stops automatic edge scrolling', async () => {
		const origin = await holdCard();
		const before = window.scrollY;
		await commands.touch({ type: 'touchMove', x: origin.x, y: nearBottom() });
		await expectScrollStarted(before);
		await touchEnd();
		await expectScrollStopped();
		await vi.waitFor(() => expect(heldCard('Card-1')).toBeUndefined(), { timeout: 2000 });
	});
});
