
import { Entity, Column, ManyToOne, OneToMany, PrimaryGeneratedColumn, JoinTable, ManyToMany, Unique, AfterLoad } from 'typeorm'
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

	@ManyToMany(() => Player, { eager: true })
	@JoinTable()
	organizers: Player[]

	@OneToMany(() => Vessel, vessel => vessel.competition, { eager: true })
	vessels: Vessel[]

	@Column({ type: 'varchar', enum: Object.values(CompetitionState) })
	status: CompetitionState = CompetitionState.ACCEPTING_SUBMISSIONS

	async validateOwnership(user: Player): Promise<boolean> {
		const matching_owner = this.organizers.find( organizer => organizer.id === user.id )

		return !! matching_owner
	}

}
