
import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { Player } from './Player.js'

/**
 * A generic entity, with created_at and modified_at columns, but no other
 * specific properties.
 */
@Entity()
export abstract class CustomBaseEntity extends BaseEntity {

	@CreateDateColumn()
	created_at: Date

	@UpdateDateColumn()
	updated_at: Date

}
