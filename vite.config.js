import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import solidPlugin from 'vite-plugin-solid';
import suidPlugin from "@suid/vite-plugin";
import devtools from 'solid-devtools/vite'

export default defineConfig(({ mode }) => ({
	plugins: [
		laravel({
			input: ['resources/js/index.tsx'],
			refresh: true,

		}),
		tailwindcss(),
		mode === "development" && devtools({
			autoname: true,
			locator: {
				targetIDE: 'vscode',
				componentLocation: true,
				jsxLocation: true,
			}
		}),
		suidPlugin(),
		solidPlugin()
	],
	build: {
		target: 'esnext',
	}
}));
