
import { Entity, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { Player } from './Player.js'
import { CustomBaseEntity } from './CustomBaseEntity.js'

/**
 * An entity which can be "owned" by a player or group of players, allowing
 * them to edit its parameters in some way. This class should only be used
 * for entities which are meant to be directly modified via an associated
 * API route (e.g. vessels, competitions).
 */
@Entity()
export abstract class OwnedBaseEntity extends CustomBaseEntity {

	/**
	 * A method which models can use to confirm whether a given user
	 * has permission to modify them.
	 */
	abstract validateOwnership( user: Player ): Promise<boolean>
}
