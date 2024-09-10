import { defineConfig } from 'vite'

export default defineConfig({
	plugins: [],
	build: {
		target: 'es2022',
		sourcemap: true,
		emptyOutDir: false,
		outDir: 'dist/',
	}
})
