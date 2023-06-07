
import { Entity, Column } from 'typeorm'
import {CustomBaseEntity} from './Base'
import { Player } from './Player'

import { compress, decompress } from '../utils/compression'

@Entity()
export class Vessel extends CustomBaseEntity {

	@Column()
	player: Player

	@Column()
	name: string

}
