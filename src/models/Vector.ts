
export type Vec3 {
	x: number,
	y: number,
	z: number,
}

export class Vec3 {

	x: number
	y: number
	z: number

	constructor( x: number, y: number, z: number ) {
		this.x = x
		this.y = y
		this.z = z
	}

}

export class Quaternion {

	w: number
	x: number
	y: number
	z: number

}