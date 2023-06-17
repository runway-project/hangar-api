
import { Entity, Column, ManyToOne, OneToMany, PrimaryGeneratedColumn, JoinTable, ManyToMany, Unique, AfterLoad } from 'typeorm'
import { Player } from './Player'
import { OwnedBaseEntity } from './OwnedBaseEntity'
import { Vessel } from './Vessel'
import { generatePassphrase } from '../utils/passphrase'

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

	@Column({ type: 'varchar' })
	remote_orchestration_password: string

	constructor() {
		super()

		// Set a default password if none is specified
		if( ! this.remote_orchestration_password )
			this.remote_orchestration_password = generatePassphrase(2)
	}

	async validateOwnership(user: Player): Promise<boolean> {
		const matching_owner = this.organizers.find( organizer => organizer.id === user.id )

		return !! matching_owner
	}
}
