import { defineConfig } from 'astro/config'
import node from '@astrojs/node'

import vue from '@astrojs/vue';

// https://astro.build/config
export default defineConfig({
	output: 'server',

	adapter: node({
		mode: 'middleware'
	}),

	integrations: [vue()],
	outDir: './dist/astro',
	site: 'https://hangar-api.space',

	build: {
		server: './dist/astro/server',
		client: './dist/astro/client',
	}
});
