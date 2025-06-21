import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import solidPlugin from 'vite-plugin-solid';
import suidPlugin from "@suid/vite-plugin";
import devtools from 'solid-devtools/vite'

export default defineConfig(({ mode }) => {
	const plugins = [
		laravel({
			input: ['resources/js/index.tsx'],
			refresh: true,
		}),
		tailwindcss(),
	];

	const build = {
		target: 'esnext'
	};

	if (mode === "development") {
		plugins.push(
			devtools({
				autoname: true,
				locator: {
					targetIDE: 'vscode',
					componentLocation: true,
					jsxLocation: true,
				}
			})
		);

		build.sourcemap = true;
	}

	plugins.push(
		suidPlugin(),
		solidPlugin()
	);

	return {
		plugins: plugins,
		build: build
	};
});
