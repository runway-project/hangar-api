
import { Entity, Column, ManyToOne, PrimaryGeneratedColumn, Relation } from 'typeorm'
import { Player } from './Player.js'
import { OwnedBaseEntity } from './OwnedBaseEntity.js'
import { Competition } from './Competition.js'

@Entity()
export class Vessel extends OwnedBaseEntity {

	@PrimaryGeneratedColumn({ type: 'integer' })
	id: number

	@ManyToOne(() => Player, player => player.vessels, {eager: true})
	player: Relation<Player>

	@ManyToOne(() => Competition)
	competition: Promise<Competition>

	@Column({ nullable: true, type: 'integer' })
    competitionId: number

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
