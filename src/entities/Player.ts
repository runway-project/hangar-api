
import { Entity, Column, OneToMany, PrimaryColumn } from 'typeorm'
import { Vessel } from './Vessel'
import { OwnedBaseEntity } from './OwnedBaseEntity'

@Entity()
export class Player extends OwnedBaseEntity {

	@PrimaryColumn()
	id: string

	@Column()
	name: string

	@OneToMany(() => Vessel, vessel => vessel.player)
	vessels: Vessel[]

	constructor( discord_id: string ) {
		super()

		this.id = discord_id
	}

	async validateOwnership( player: Player ): Promise<boolean> {
		return player.id === this.id
	}

}
