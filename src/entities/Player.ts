
import { Entity, Column, OneToMany, PrimaryColumn, Unique } from 'typeorm'
import { Vessel } from './Vessel'
import { OwnedBaseEntity } from './OwnedBaseEntity'

@Entity()
@Unique(['display_name'])
export class Player extends OwnedBaseEntity {

	@PrimaryColumn({ type: 'varchar' })
	id: string

	@Column({ type: 'varchar' })
	name: string

	@Column({ type: 'varchar' })
	display_name: string

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
