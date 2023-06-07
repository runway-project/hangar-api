
import { Entity, Column, ManyToOne, PrimaryGeneratedColumn, JoinTable, ManyToMany } from 'typeorm'
import { Player } from './Player'
import { OwnedBaseEntity } from './OwnedBaseEntity'
import { Vessel } from './Vessel'

@Entity()
export class Competition extends OwnedBaseEntity {

	@PrimaryGeneratedColumn()
	id: number

	@Column()
	name: string

	@ManyToMany(() => Player, {
		eager: true,
		cascade: true,
	})
	@JoinTable({ name: 'competition_organizers' })
	organizers: Player[]

	@ManyToMany(() => Vessel)
	@JoinTable({ name: 'competition_entrants' })
	vessels: Promise<Vessel[]>

	async validateOwnership(user: Player): Promise<boolean> {
		const matching_owner = this.organizers.find( organizer => organizer.id === user.id )

		return !! matching_owner
	}

}
