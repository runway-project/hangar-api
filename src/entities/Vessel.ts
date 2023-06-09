
import { Entity, Column, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Player } from './Player'
import { OwnedBaseEntity } from './OwnedBaseEntity'

@Entity()
export class Vessel extends OwnedBaseEntity {

	@PrimaryGeneratedColumn({ type: 'integer' })
	id: number

	@ManyToOne(() => Player, player => player.vessels)
	player: Promise<Player>

	@Column({ nullable: true, type: 'varchar' })
    playerId: string

	@Column({ type: 'varchar' })
	name: string

	@Column({ type: 'varchar' })
	craft_file: string

	async validateOwnership(user: Player): Promise<boolean> {
		return this.playerId === user.id
	}

}
