import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		name: 'unit',
		environment: 'node',
		include: ['tests/frontend/unit/**/*.test.ts'],
		browser: { enabled: false },
		passWithNoTests: true,
	},
});
