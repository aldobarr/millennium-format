import { afterEach, vi } from 'vitest';
import { cleanup } from '@solidjs/testing-library';
import { commands } from '@vitest/browser/context';
import '../../../../resources/css/app.css';

afterEach(async () => {
	await commands.pointer({ type: 'up' });
	cleanup();
	vi.unstubAllGlobals();
	await commands.pointer({ type: 'move', x: 0, y: 0 });
	window.scrollTo(0, 0);
});
