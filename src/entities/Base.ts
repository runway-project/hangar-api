
import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity()
export class CustomBaseEntity extends BaseEntity {

	@PrimaryGeneratedColumn()
	_id: number

	@CreateDateColumn()
	created_at: Date

	@UpdateDateColumn()
	updated_at: Date

}
