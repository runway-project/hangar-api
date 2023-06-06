
import { Entity, PrimaryKey, Property } from '@mikro-orm/core'

@Entity()
export class Player {

	@PrimaryKey()
	_id: number

	@Property()
	created_at = new Date()

	@Property({ onUpdate: () => new Date() })
	updated_at = new Date()

	@Property()
	name: string

}
