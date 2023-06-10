
import { DataSource } from 'typeorm'

import { Player } from './entities/Player'
import { Vessel } from './entities/Vessel'
import { Competition } from './entities/Competition'
import { Session } from './entities/Session'

export const db = new DataSource({
	type: 'sqlite',
	database: 'dev.sqlite3',
	entities: [Player, Vessel, Competition, Session],
	logging: true,
	//synchronize: IS_DEV,
	synchronize: true,
})
