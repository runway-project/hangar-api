
import { Entity, Column, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Player } from './Player'
import { OwnedBaseEntity } from './OwnedBaseEntity'
import { Competition } from './Competition'

@Entity()
export class Vessel extends OwnedBaseEntity {

	@PrimaryGeneratedColumn({ type: 'integer' })
	id: number

	@ManyToOne(() => Player, player => player.vessels, {eager: true})
	player: Player

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
