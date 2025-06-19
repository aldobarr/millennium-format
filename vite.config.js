import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import solidPlugin from 'vite-plugin-solid';
import devtools from 'solid-devtools/vite'

export default defineConfig({
	plugins: [
		laravel({
			input: ['resources/js/App.tsx'],
			refresh: true,
		}),
		tailwindcss(),
		devtools({
			autoname: true,
			locator: {
				targetIDE: 'vscode',
				componentLocation: true,
				jsxLocation: true,
			}
		}),
		solidPlugin()
	],
	build: {
		target: 'esnext',
	}
});
