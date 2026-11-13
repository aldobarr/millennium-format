import { screen, within } from '@solidjs/testing-library';
import { expect, vi } from 'vitest';
import { deckCategoryNames, deckEditor } from './render-deck';

export type Point = { x: number; y: number };

export function pointIn(element: Element, x = 0.5, y = 0.5): Point {
	const rect = element.getBoundingClientRect();
	return { x: rect.left + rect.width * x, y: rect.top + rect.height * y };
}

export function cardImage(name: string, category?: string): HTMLElement {
	return (category ? within(categoryRegion(category)) : screen).getByRole('img', { name });
}

export function categoryHeading(name: string): HTMLElement {
	return within(deckEditor()).getByRole('heading', { name });
}

// Categories currently have headings but no named region/list roles.
// Resolve the group by its heading, without depending on tags, CSS classes,
// wrapper count, or grid implementation. This is the only markup adapter.
export function categoryRegion(name: string): HTMLElement {
	let group = categoryHeading(name);
	while (group.parentElement && group.parentElement !== deckEditor()) {
		const parent = group.parentElement;
		const headings = within(parent).queryAllByRole('heading');
		if (headings.filter(heading => deckCategoryNames().includes(heading.textContent?.trim() ?? '')).length !== 1) break;
		group = parent;
	}
	return group;
}

function searchRegion(): HTMLElement {
	let group = within(deckEditor()).getByRole('button', { name: 'Search' });
	while (group.parentElement && group.parentElement !== deckEditor()) {
		const parent = group.parentElement;
		if (within(parent).queryAllByRole('heading').some(heading => deckCategoryNames().includes(heading.textContent?.trim() ?? ''))) break;
		group = parent;
	}
	return group;
}

export function heldCard(name: string): HTMLElement | undefined {
	const groups = [...deckCategoryNames().map(categoryRegion), searchRegion()];
	return screen.queryAllByRole('img', { name })
		.find(image => !groups.some(group => group.contains(image)));
}

export function categoryImages(name = 'Category-1'): HTMLElement[] {
	const images = within(categoryRegion(name)).queryAllByRole('img');
	// Assert the order the user sees, including CSS layout/transforms, rather
	// than requiring the implementation to reorder its DOM during a preview.
	return images.sort((a, b) => {
		const first = a.getBoundingClientRect();
		const second = b.getBoundingClientRect();
		const sameRow = Math.abs(first.top - second.top) < Math.min(first.height, second.height) / 2;
		return sameRow ? first.left - second.left : first.top - second.top;
	});
}

export function categoryCards(name = 'Category-1'): string[] {
	return categoryImages(name).map(image => image.getAttribute('alt')!);
}

export function visibleCategoryOrder(): string[] {
	return [...deckCategoryNames()].sort((a, b) => categoryHeading(a).getBoundingClientRect().top - categoryHeading(b).getBoundingClientRect().top);
}

export function categoryDropPoint(name: string): Point {
	const cards = categoryImages(name);
	if (cards.length) return pointIn(cards[0]);
	const group = categoryRegion(name).getBoundingClientRect();
	const heading = categoryHeading(name).getBoundingClientRect();
	return { x: group.left + group.width / 2, y: (heading.bottom + group.bottom) / 2 };
}

export function grabPoint(name: string, pointer: Point): Point {
	const image = heldCard(name);
	expect(image, 'the user should see the held card').toBeDefined();
	const rect = image!.getBoundingClientRect();
	return { x: (pointer.x - rect.left) / rect.width, y: (pointer.y - rect.top) / rect.height };
}

export async function expectHeldAt(name: string, point: Point, grab: Point) {
	await vi.waitFor(() => {
		const image = heldCard(name);
		expect(image, 'the user should see the held card').toBeDefined();
		const rect = image!.getBoundingClientRect();
		// A small fraction of the rendered card tolerates rounding, padding,
		// and settling animations without accepting a card left behind.
		expect(Math.abs(pointIn(image!, grab.x, grab.y).x - point.x) / rect.width).toBeLessThan(0.05);
		expect(Math.abs(pointIn(image!, grab.x, grab.y).y - point.y) / rect.height).toBeLessThan(0.05);
	}, { timeout: 2000 });
}
