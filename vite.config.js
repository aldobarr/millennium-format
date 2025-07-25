import tailwindcss from '@tailwindcss/vite';
import laravel from 'laravel-vite-plugin';
import devtools from 'solid-devtools/vite';
import { defineConfig } from 'vite';
import lucidePreprocess from 'vite-plugin-lucide-preprocess';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig(({ mode }) => {
	const plugins = [
		lucidePreprocess(),
		laravel({
			input: ['resources/js/index.tsx'],
			refresh: true,
		}),
		tailwindcss(),
	];

	const build = {
		target: 'esnext',
	};

	if (mode === 'development') {
		plugins.push(
			devtools({
				autoname: true,
				locator: {
					targetIDE: 'vscode',
					componentLocation: true,
					jsxLocation: true,
				},
			}),
		);

		build.sourcemap = true;
	}

	plugins.push(
		solidPlugin(),
	);

	return {
		plugins: plugins,
		build: build,
	};
});
