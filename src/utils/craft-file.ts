
import { Vec3 } from '../models/Vector'
import { Vector3, Quaternion } from 'three'

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

export type KSPPartModule = {
	name: string,
	[attr: string]: string,
}

export type KSPPart = {
	id: string,
	name: string,
	pos: Vector3,
	rot: Quaternion,

	modules: {
		[name: string]: KSPPartModule,
	},
}

export type KSPCraft = {
	name: string | null,
	version: string | null,
	size: Vec3,
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

function parseStringlike( obj: any, key: string ): string | null {
	if( obj[key] && typeof obj[key] === 'string' ) return obj[key]

	return null
}

function parseNumber( obj: any, key: string ): number {
	if( ! obj[key] ) return 0

	const parsed = parseFloat( obj[key] )

	if( Number.isNaN( parsed ) ) return 0

	return parsed
}

function parseVec3( obj: any, key: string ): Vector3 {
	if( ! obj[key] ) return 0
}

function parseQuat( obj: any, key: string ): Quaternion {

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
		name: typeof root.attrs.ship === 'string' ? root.attrs.ship : null,
		version: typeof root.attrs.version === 'string' ? root.attrs.version : null
	}
}