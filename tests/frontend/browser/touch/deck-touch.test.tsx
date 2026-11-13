import { commands } from '@vitest/browser/context';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { card, deck } from '../../fixtures/decks';
import { renderDeck } from '../support/render-deck';
import { cardImage, expectHeldAt, grabPoint, heldCard, pointIn } from '../support/deck-screen';
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
