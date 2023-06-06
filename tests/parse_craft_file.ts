
import { readFile, writeFile } from 'fs/promises'
import { parseCraftFile } from '../src/utils/craft-file'

async function main() {
	const DEMO_CRAFT_FILE = 'tests/data/Eclipse_S5R9_A.craft'

	console.time('load')
	
	const craft = await readFile(DEMO_CRAFT_FILE, {encoding: 'utf-8'})
	
	console.timeEnd('load')
	
	console.time('parse')
	
	const parsed = parseCraftFile( craft )
	
	console.timeEnd('parse')
	
	console.time('write')
	
	await writeFile( 'tests/parsed_craft.json', JSON.stringify(parsed, null, '\t'), {encoding: 'utf-8'} )
	
	console.timeEnd('write')
}

main()
