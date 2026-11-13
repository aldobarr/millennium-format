import { defineConfig } from 'vitest/config';

// Run all frontend suites. Each suite also has a standalone npm command.
export default defineConfig({
	test: {
		projects: [
			{ extends: './tests/frontend/unit/vitest.config.ts' },
			{ extends: './tests/frontend/integration/vitest.config.ts' },
			{ extends: './tests/frontend/browser/vitest.config.ts' },
		],
	},
});
