import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		name: 'integration',
		environment: 'node',
		include: ['tests/frontend/integration/**/*.test.ts'],
		browser: { enabled: false },
		passWithNoTests: true,
	},
});
