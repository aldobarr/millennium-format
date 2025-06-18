import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
	plugins: [
		laravel({
			input: ['resources/js/App.tsx'],
			refresh: true,
		}),
		tailwindcss(),
		solidPlugin()
	],
	build: {
		target: 'esnext',
	}
});
