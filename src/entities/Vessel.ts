
import { Entity, Column, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Player } from './Player'
import { OwnedBaseEntity } from './OwnedBaseEntity'

@Entity()
export class Vessel extends OwnedBaseEntity {

	@PrimaryGeneratedColumn()
	id: number

	@ManyToOne(() => Player, player => player.vessels)
	player: Promise<Player>

	@Column({ nullable: true })
    playerId: string

	@Column()
	name: string

	@Column()
	craft_file: string

	async validateOwnership(user: Player): Promise<boolean> {
		return this.playerId === user.id
	}

}
