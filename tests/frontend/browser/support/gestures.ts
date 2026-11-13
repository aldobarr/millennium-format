import { commands } from '@vitest/browser/context';
import { expect, vi } from 'vitest';
import { cardImage, heldCard, pointIn, type Point } from './deck-screen';

export const pause = (milliseconds: number) => new Promise(resolve => setTimeout(resolve, milliseconds));
export const nearBottom = () => innerHeight * 0.99;
export const nearTop = () => innerHeight * 0.01;

export async function pickUp(name: string, options: { x?: number; y?: number; reveal?: boolean } = {}): Promise<Point> {
	const image = cardImage(name);
	if (options.reveal !== false) image.scrollIntoView({ block: 'center', behavior: 'instant' });
	const origin = pointIn(image, options.x ?? 0.5, options.y ?? 0.5);
	await commands.pointer({ type: 'move', ...origin });
	await commands.pointer({ type: 'down' });
	// Move within the same card to distinguish a drag from a click. The input
	// scales with the card; it does not duplicate the sensor's pixel threshold.
	const pointer = { x: origin.x + image.getBoundingClientRect().width * 0.15, y: origin.y };
	await commands.pointer({ type: 'move', ...pointer });
	await vi.waitFor(() => expect(heldCard(name)).toBeDefined());
	return pointer;
}

export async function moveTo(point: Point) {
	await commands.pointer({ type: 'move', ...point });
}

export async function releaseCard() {
	await commands.pointer({ type: 'up' });
}

export async function expectScrollStarted(before: number, direction = 1) {
	await vi.waitFor(() => expect((window.scrollY - before) * direction).toBeGreaterThan(0), { timeout: 2000 });
}

export async function expectScrollStopped() {
	// Permit a finishing animation, then require a quiet interval. No frame
	// count, refresh rate, speed, or exact release coordinate is prescribed.
	await vi.waitFor(async () => {
		const before = window.scrollY;
		await pause(120);
		expect(window.scrollY).toBe(before);
	}, { timeout: 1500, interval: 30 });
	// A runaway loop reaching the end of the page is not a successful stop.
	expect(window.scrollY + innerHeight).toBeLessThan(document.documentElement.scrollHeight);
}

export async function dragUntilVisible(point: () => Point, x: number) {
	const destination = point();
	if (destination.y >= innerHeight * 0.8) await moveTo({ x, y: nearBottom() });
	else if (destination.y <= innerHeight * 0.15) await moveTo({ x, y: nearTop() });
	await vi.waitFor(() => {
		expect(point().y).toBeGreaterThan(innerHeight * 0.15);
		expect(point().y).toBeLessThan(innerHeight * 0.8);
	}, { timeout: 2500 });
	await moveTo(point());
}
