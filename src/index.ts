
import 'dotenv/config'

import { MikroORM } from '@mikro-orm/core'
import { SqliteDriver } from '@mikro-orm/sqlite'
import { TsMorphMetadataProvider } from '@mikro-orm/reflection'

import express from 'express'
import expressSession from 'express-session'

import { discordOAuth } from './middleware/auth'
import { addCSP } from './middleware/csp'

const PORT = 9999

const orm = await MikroORM.init<SqliteDriver>({
	metadataProvider: TsMorphMetadataProvider,

	entities: ['./dist/entities/**/*.js'],
	entitiesTs: ['./src/entities/**/*.ts'],
})

const app = express()

app.use(expressSession({
	secret: process.env.COOKIE_SECRET,
	cookie: { secure: process.env.NODE_ENV === 'production' }
}))

app.use(addCSP)
app.use(discordOAuth({
	client_id: process.env.DISCORD_CLIENT_ID,
	client_secret: process.env.DISCORD_CLIENT_SECRET,
	redirect_uri: `http://localhost:${PORT},`
}))

app.listen(PORT, '127.0.0.1', () => {
	console.log('Online!')
})