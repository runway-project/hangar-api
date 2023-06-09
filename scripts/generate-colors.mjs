//@see https://github.com/k-vyn/coloralgorithm

import c from "@k-vyn/coloralgorithm"
import base_colors from './color-system.mjs'

for( const {properties, options} of base_colors ) {
	const {colors, name} = c.generate( properties, options )[0]

	/*for( const color of colors ) {
		console.log(`$color-${name}-${color.step * 10}: ${color.hex};`)
	}*/

	for( const color of colors ) {
		console.log(`--color-${name}-${color.step * 10}: ${color.hex};`)
	}
}