import { defineConfig } from "vite"
import marko from "@marko/vite"
import typescript from '@rollup/plugin-typescript';
import swc from 'rollup-plugin-swc';

const swcPlugin = (() => {
	const plugin = swc.default({
	  test: 'ts',
	  jsc: {
		parser: {
		  syntax: 'typescript',
		  dynamicImport: true,
		  decorators: true,
		},
		target: 'es2021',
		transform: {
		  decoratorMetadata: true,
		},
	  },
	});
  
	const originalTransform = plugin.transform!;
  
	const transform = function (...args: Parameters<typeof originalTransform>) {
	  if (!args[1].endsWith('html')) return originalTransform.apply(this, args);
	};
  
	return { ...plugin, transform };
  })();

export default defineConfig({
	plugins: [
		swcPlugin,
		marko()
	],
	build: {
		target: 'es2022',
		sourcemap: true,
		emptyOutDir: false,
	},
	esbuild: false,
})
