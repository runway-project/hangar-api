
import { Entity, Column } from 'typeorm'
import {CustomBaseEntity} from './Base'

@Entity()
export class Player extends CustomBaseEntity {

	@Column()
	discord_id: string

	@Column()
	name: string

	constructor( discord_id: string ) {
		super()

		this.discord_id = discord_id
	}

}
