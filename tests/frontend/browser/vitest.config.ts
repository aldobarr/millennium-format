/// <reference types="@vitest/browser/providers/playwright" />
import { defineConfig } from 'vitest/config';
import solid from 'vite-plugin-solid';
import tailwindcss from '@tailwindcss/vite';
import { pointer, touch } from './support/browser-commands';

export default defineConfig({
	plugins: [tailwindcss(), solid()],
	define: { 'import.meta.env.VITE_API_URL': JSON.stringify('http://deck-fixture.test/api') },
	test: {
		environment: 'node',
		include: ['tests/frontend/browser/**/*.test.tsx'],
		setupFiles: ['tests/frontend/browser/support/setup.ts'],
		fileParallelism: false,
		testTimeout: 10000,
		browser: {
			enabled: true,
			provider: 'playwright',
			headless: true,
			instances: [
				{
					browser: 'chromium',
					name: 'desktop',
					exclude: ['tests/frontend/browser/touch/**'],
				},
				{
					browser: 'chromium',
					name: 'touch',
					exclude: ['tests/frontend/browser/desktop/**'],
					viewport: { width: 390, height: 844 },
					context: { hasTouch: true, isMobile: true },
				},
			],
			viewport: { width: 1440, height: 1000 },
			screenshotFailures: false,
			commands: { pointer, touch },
		},
	},
});
