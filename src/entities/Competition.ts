
import { Entity, Column, ManyToOne, PrimaryGeneratedColumn, JoinTable, ManyToMany, Unique } from 'typeorm'
import { Player } from './Player'
import { OwnedBaseEntity } from './OwnedBaseEntity'
import { Vessel } from './Vessel'

/**
 * What stage is the current competition in?
 */
export enum CompetitionState {
	ACCEPTING_SUBMISSIONS = 'accepting_submissions',
	CLOSED = 'closed',
	RUNNING = 'running',
	COMPLETED = 'completed',
}

@Entity()
@Unique(['name'])
export class Competition extends OwnedBaseEntity {

	@PrimaryGeneratedColumn({ type: 'integer' })
	id: number

	@Column({ type: 'varchar' })
	name: string

	@Column({ type: 'text', nullable: true })
	description: string

	@ManyToMany(() => Player, {
		eager: true,
		cascade: true,
	})
	@JoinTable({ name: 'competition_organizers' })
	organizers: Player[]

	@ManyToMany(() => Vessel)
	@JoinTable({ name: 'competition_entrants' })
	vessels: Promise<Vessel[]>

	@Column({ type: 'varchar', enum: Object.values(CompetitionState) })
	status: CompetitionState = CompetitionState.ACCEPTING_SUBMISSIONS

	async validateOwnership(user: Player): Promise<boolean> {
		const matching_owner = this.organizers.find( organizer => organizer.id === user.id )

		return !! matching_owner
	}

}
