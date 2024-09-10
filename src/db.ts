
import 'reflect-metadata'
import { DataSource } from 'typeorm'
import {join} from 'path'

import { Player } from './entities/Player.js'
import { Vessel } from './entities/Vessel.js'
import { Competition } from './entities/Competition.js'
import { Session } from './entities/Session.js'

const DB_PATH = process.env.SQL_DB_PATH ?? '/opt/hangar-api/data'

export const db = new DataSource({
	type: 'sqlite',
	database: join(DB_PATH, 'dev.sqlite3'),
	entities: [Player, Vessel, Competition, Session],
	logging: false,
	//synchronize: IS_DEV,
	synchronize: true,
})
