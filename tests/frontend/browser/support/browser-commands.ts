/// <reference types="@vitest/browser/providers/playwright" />
import type { BrowserCommand, BrowserCommandContext } from 'vitest/node';
import type { CDPSession, Page } from 'playwright';

export type PointerAction
	= | { type: 'move'; x: number; y: number; steps?: number }
		| { type: 'down' | 'up' }
		| { type: 'wheel'; deltaY: number };

export type TouchAction
	= | { type: 'touchStart' | 'touchMove'; x: number; y: number }
		| { type: 'touchEnd' | 'touchCancel' };

async function browserPoint(context: BrowserCommandContext, x: number, y: number) {
	if (context.provider.name !== 'playwright') throw new Error('Playwright is required');
	const frame = await context.frame();
	const frameElement = await frame.frameElement();
	const bounds = await frameElement.boundingBox();
	if (!bounds) throw new Error('Test frame is not visible');
	const viewport = await frame.evaluate(() => ({ width: innerWidth, height: innerHeight }));
	// Vitest can scale its iframe to fit the runner window.
	return {
		x: bounds.x + x * bounds.width / viewport.width,
		y: bounds.y + y * bounds.height / viewport.height,
	};
}

// Drive genuine browser input without calling the application's drag handlers.
export const pointer: BrowserCommand<[PointerAction]> = async (context, action) => {
	if (action.type === 'move') {
		const point = await browserPoint(context, action.x, action.y);
		await context.page.mouse.move(point.x, point.y, { steps: action.steps ?? 1 });
	} else if (action.type === 'down') {
		await context.page.mouse.down();
	} else if (action.type === 'up') {
		await context.page.mouse.up();
	} else if (action.type === 'wheel') {
		await context.page.mouse.wheel(0, action.deltaY);
	}
};

const touchSessions = new WeakMap<Page, CDPSession>();

export const touch: BrowserCommand<[TouchAction]> = async (context, action) => {
	let session = touchSessions.get(context.page);
	if (!session) {
		session = await context.context.newCDPSession(context.page);
		touchSessions.set(context.page, session);
	}
	const point = 'x' in action ? await browserPoint(context, action.x, action.y) : undefined;
	await session.send('Input.dispatchTouchEvent', {
		type: action.type,
		touchPoints: point ? [{ ...point, id: 1, radiusX: 1, radiusY: 1, force: 1 }] : [],
	});
};

declare module '@vitest/browser/context' {
	interface BrowserCommands {
		pointer: (action: PointerAction) => Promise<void>;
		touch: (action: TouchAction) => Promise<void>;
	}
}
