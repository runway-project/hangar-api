
import { readFile, writeFile, mkdir, stat } from 'fs/promises'
import { join } from 'path'

import { Vessel } from '../entities/Vessel'

import { Vector3, Quaternion } from 'three'

const CRAFT_STORAGE_PATH = process.env.CRAFT_STORAGE_PATH ?? '/tmp/vessels'

/**
 * A node within a KSP craft file
 */
export type CraftFileNode = {
	type: 'ROOT' | 'PART' | 'MODULE' | 'UNKNOWN',
	attrs: {
		[key: string]: string | number | null,
	},
	children: CraftFileNode[],
}

export type KSPField = string | number | Vector3 | Quaternion | boolean | null

/**
 * A module attached to a KSP part
 */
export type KSPPartModule = {
	name: string,
	[attr: string]: KSPField,
}

/**
 * A part of a KSP craft
 */
export type KSPPart = {
	id: string,
	pos: Vector3,
	rot: Quaternion,

	modules: {
		[name: string]: KSPPartModule,
	},
}

/**
 * A complete(ish) KSP craft, with the parameters and modules we care
 * about extracted into a convenient format
 */
export type KSPCraft = {
	name: string | null,
	version: string | null,
	size: Vector3,
	parts: KSPPart[],
}


/**
 * Parses a KSP craft file, returning a single CraftFileNode containing various
 * child PART nodes
 * 
 * @param file A string representation of the file
 */
export function parseCraftFile( file: string ) {

	/** A tree containing nodes from a craft file */
	const stack: CraftFileNode[] = [{
		type: 'ROOT',
		attrs: {},
		children: []
	}]

	let next_node_type: CraftFileNode['type']

	for( let line of file.split('\n') ) {
		line = line.trim()
		let match: RegExpExecArray | null

		// Skip blank lines
		if( ! line ) continue

		// Match attributes (property=value)
		if( match = /^([^=]+)=(.*)$/.exec(line) ) {
			stack.at(-1).attrs[ match[1].trim() ] = match[2].trim()
		}
		// Match node identifiers
		else if( match = /^[A-Za-z]+$/.exec(line) ) {
			next_node_type = match[0] as CraftFileNode['type']
		}

		// Match node openings
		else if( line === '{' ) {
			if( !next_node_type) throw new Error(`KSP craft file contains node with no title!` )

			const new_node: CraftFileNode = {
				type: next_node_type,
				attrs: {},
				children: [],
			}

			stack.at(-1).children.push( new_node )

			stack.push( new_node )

			next_node_type = null
		}

		else if( line === '}' ) {
			stack.pop()

			if( ! stack.length ) throw new Error(`KSP craft file closed a section which was not open`)
		}
	}

	return stack[0]
}


/**
 * Parsed a property of a craft file which may be a string, returning null
 * if it cannot be resolved
 */
function parseStringlike( obj: any, key: string ): string | null {
	if( obj[key] && typeof obj[key] === 'string' ) return obj[key]

	return null
}

/**
 * Parsed a property of a craft file which may be a boolean, returning null
 * if it doesn't match the string literals 'True' or 'False'
 */
function parseBoolean( obj: any, key: string ): boolean | null {
	if( ! obj[key] ) return null

	if( obj[key] === 'True' ) return true
	if( obj[key] === 'False' ) return false

	return null
}

/**
 * Parsed a property of a craft file which may be a number, returning NaN
 * if it can't be parsed
 */
function parseNumber( obj: any, key: string ): number {
	if( ! obj[key] ) return NaN

	return parseFloat( obj[key] )
}


/**
 * Parsed a property of a craft file which may be a Vector3 (any three numbers
 * separated by commas), returning null if it can't be parsed
 */
function parseVec3( obj: any, key: string ): Vector3 {
	if( ! obj[key] ) return null

	const parts = obj[key].split(',')

	if( parts.length !== 3 ) return null

	const mapped_parts = parts.map( (p: string) => parseFloat(p) ) as number[]

	if( mapped_parts.find( i => Number.isNaN(i) ) ) return null

	return new Vector3( mapped_parts[0], mapped_parts[1], mapped_parts[2] )
}

/**
 * Parsed a property of a craft file which may be a Quaternion (any four numbers
 * separated by commas), returning null if it can't be parsed
 */
function parseQuat( obj: any, key: string ): Quaternion {
	if( ! obj[key] ) return null

	const parts = obj[key].split(',')

	if( parts.length !== 4 ) return null

	const mapped_parts = parts.map( (p: string) => parseFloat(p) ) as number[]
	
	if( mapped_parts.find( i => Number.isNaN(i) ) ) return null

	return new Quaternion( mapped_parts[0], mapped_parts[1], mapped_parts[2], mapped_parts[3] )
}

/**
 * Parsed a property of a craft file which has an unknown type (basically
 * anything in a MODULE node, because we won't know these at parsing time,
 * and they can contain arbitrary data).
 */
function parseUnknown( obj: any, key: string ): string | number | Vector3 | Quaternion | boolean {
	let value

	if( ! Number.isNaN( value = parseNumber( obj, key ) ) ) return value
	if( ( value = parseVec3( obj, key ) ) !== null ) return value
	if( ( value = parseQuat( obj, key ) ) !== null ) return value
	if( ( value = parseBoolean( obj, key ) ) !== null ) return value

	return parseStringlike( obj, key )
}


/**
 * Simplifies a craft file's node hierarchy into a more convenient format, making
 * some assumptions about how it's organized (a root node, containing parts, containing
 * modules)
 * 
 * @param root A ROOT node
 */
export function simplifyCraftNodetree( root: CraftFileNode ) {
	if( root.type !== 'ROOT' ) throw new Error(`Tried to simplify a CraftFileNode of type other than ROOT`)

	const craft: KSPCraft = {
	
		// Grab some core properties from the top-level ROOT node
		name: parseStringlike(root.attrs, 'ship'),
		version: parseStringlike(root.attrs, 'version'),
		size: parseVec3(root.attrs, 'size'),

		// Iterate through all of the PART nodes, extracting their modules
		parts: root.children.map( p => {
			if( p.type !== 'PART' ) throw new Error(`Encountered unexpected node ${p.type} when parsing craft parts!`)

			const part: KSPPart = {
				// Capture location and such
				id:  parseStringlike(p.attrs, 'part'),
				pos: parseVec3(p.attrs, 'pos'),
				rot: parseQuat(p.attrs, 'rot'),

				modules: Object.fromEntries( p.children.map( module => {
					// Skip non-modules
					if( module.type !== 'MODULE' ) return null

					const name = parseStringlike(module.attrs, 'name')

					// Parse everything we can into a JS type rather than a string
					const values = Object.fromEntries( Object.keys(module.attrs).map( (key) => {
						return [key, parseUnknown(module.attrs, key)]
					} ) )

					return [name, values]
				}).filter( i => !!i ) )
			}

			return part
		} ),
	}

	return craft
}


/**
 * Queries a value within a KSPCraft's modules. A few simplifying assumptions:
 * this matches module IDs and field names in a case-insensitive way, with some
 * error tolerance.
 * 
 * @param craft The craft to query
 * @param part_id The part to check
 * @param module_id A (potentially partial) module ID to check
 * @param field The name of a field to extract
 */
export function queryField( craft: KSPCraft, part_id: string, module_id: string, field: string ): KSPField {

	// Get the matching part
	const matching_part = craft.parts.find( part => {
		// So, the KSP craft file generally separates part names with '.', but they're referred to with underscores
		// in config files, which is confusing. We're therefore replacing everything with underscores so that
		// both will work.
		return part.id.toLowerCase().replace(/\./g, '_').startsWith( part_id.toLowerCase().replace(/\./g, '_') )
	})

	if( ! matching_part ) return null

	// Get the matching module
	const matching_module_key = Object.keys(matching_part.modules).find( key => {
		return key.toLowerCase() === module_id.toLowerCase()
	})

	if( ! matching_module_key ) return null

	// Get the requested field
	const matching_field_key = Object.keys( matching_part.modules[matching_module_key] ).find( key => {
		return key.toLowerCase() === field.toLowerCase()
	} )

	if( ! matching_field_key ) return null

	return matching_part.modules[matching_module_key][matching_field_key] ?? null
}


/**
 * Get a unique, safe path to save the specified craft file at. This is URL-encoded to prevent any funny business
 * with paths, and has some prefixes appended to distinguish this particular craft file from others.
 * 
 * @param craft_name The user-supplied name of the craft
 * @param competition The competition the craft has been submitted to
 * @param player The player who submitted the craft
 * @returns A safe filename for the craft
 */
export function getSafeCraftFileName( craft: Vessel ) {
	const base = encodeURIComponent( craft.name )
	const player_name = encodeURIComponent( craft.player.display_name )

	return `${craft.playerId}_${craft.id}_${player_name}_${base}.craft`
}

/**
 * Saves a specified craft file
 */
export async function saveCraftFile( craft: Vessel, craft_file: string ) {
	const filename = getSafeCraftFileName( craft )

	// Ensure the craft file storage path exists
	await mkdir( CRAFT_STORAGE_PATH, { recursive: true } )

	await writeFile( join(CRAFT_STORAGE_PATH, filename), craft_file, { encoding: 'utf-8' } )
}

/**
 * Loads a specified craft file
 */
export async function loadCraftFile( craft: Vessel ) {
	const filename = getSafeCraftFileName( craft )

	if( ! (await stat( join( CRAFT_STORAGE_PATH, filename ) )).isFile() ) throw new Error(`Unable to find craft file ${filename}`)

	return await readFile( join( CRAFT_STORAGE_PATH, filename ), {encoding: 'utf-8'} )
}
