import { BeforeUpdate, Entity, ManyToOne, OnLoad, PrimaryKey, Property } from "@mikro-orm/core"

import { Player } from './Player'

import { compress, decompress } from '../utils/compression'

@Entity()
export class Vessel {

	@PrimaryKey()
	_id: number

	@Property()
	created_at = new Date()

	@Property({ onUpdate: () => new Date() })
	updated_at = new Date()

	@ManyToOne()
	player: Player

	@Property()
	name: string

	@Property()
	protected serialized_craft_file: Buffer

	craft_file: string

	@OnLoad()
	async init() {
		this.craft_file = await decompress(this.serialized_craft_file)
	}

	@BeforeUpdate()
	async serialize() {
		this.serialized_craft_file = await compress(this.craft_file)
	}

}
