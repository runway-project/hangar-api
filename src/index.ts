
import 'dotenv/config'
import 'reflect-metadata'

import { DataSource } from 'typeorm'

import express from 'express'
import expressSession from 'express-session'

import { discordOAuth } from './middleware/auth'
import { addCSP } from './middleware/csp'

import { Player } from './entities/Player'
import { Vessel } from './entities/Vessel'
import { Competition } from './entities/Competition'

const db = new DataSource({
	type: 'sqlite',
	database: 'dev.sqlite3',
	entities: [Player, Vessel, Competition],
	logging: true,
	synchronize: process.env.NODE_ENV === 'development',
})

const PORT = 9999

const app = express()

app.use(expressSession({
	secret: process.env.COOKIE_SECRET,
	cookie: { secure: process.env.NODE_ENV === 'production' }
}))

app.use(addCSP)
app.use(discordOAuth({
	client_id: process.env.DISCORD_CLIENT_ID,
	client_secret: process.env.DISCORD_CLIENT_SECRET,
	redirect_uri: `http://localhost:${PORT}`,
}))


db.initialize()
	.then(() => {
		app.listen(PORT, '127.0.0.1', () => {
			console.log('Online!')
		})
	})
