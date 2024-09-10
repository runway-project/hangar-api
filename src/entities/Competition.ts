
import { Entity, Column, ManyToOne, OneToMany, PrimaryGeneratedColumn, JoinTable, ManyToMany, Unique, AfterLoad } from 'typeorm'
import { Player } from './Player.js'
import { OwnedBaseEntity } from './OwnedBaseEntity.js'
import { Vessel } from './Vessel.js'
import { generatePassphrase } from '../utils/passphrase.js'

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

	@Column({ type: 'int', default: () => 1 })
	max_submissions: number

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

	/**
	 * Check how many vessels the specified player has submitted to the competition
	 * 
	 * @param player The player to check
	 * @returns Vessel submission count
	 */
	getPlayerSubmissionCount( player: Player ): number {
		return this.vessels.filter(vessel => vessel.playerId === player.id).length
	}
}
