
import 'dotenv/config'
import 'reflect-metadata'

import { DataSource } from 'typeorm'

import express, { Router } from 'express'
import expressSession from 'express-session'
import compressionMiddlware from 'compression'
import markoPlugin from '@marko/express'

import { discordOAuth } from './middleware/auth'
import { addCSP } from './middleware/csp'

import { Player } from './entities/Player'
import { Vessel } from './entities/Vessel'
import { Competition } from './entities/Competition'

const PORT = 9999
const IS_DEV = process.env.NODE_ENV === 'development'

const db = new DataSource({
	type: 'sqlite',
	database: 'dev.sqlite3',
	entities: [Player, Vessel, Competition],
	logging: true,
	synchronize: IS_DEV,
})

const app = express()

app.use(compressionMiddlware())

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

app.use(markoPlugin())
app.use('/assets', express.static('dist/assets'))



// Set up client-side stuff with Marko
/*if( IS_DEV ) {
	const { createServer } = await import('vite')

	const dev_server = await createServer({
		appType: 'custom',
		server: { middlewareMode: true },
	})

	app.use(dev_server.middlewares)

	const layout = await dev_server.ssrLoadModule('./src/layouts/Base.marko')

	console.dir(layout.default)
	
	app.get('/', (req, res, next) => {
		//@ts-ignore
		res.marko(layout.default, {})
	})

}
else {*/
	app.use('/assets', express.static('dist/assets'))

	//@ts-ignore
	const layout = await import('./layouts/Base.marko')

	app.get('/', (req, res, next) => {
		//@ts-ignore
		res.marko(layout.default, {})
	})
//}

db.initialize()
	.then(() => {
		app.listen(PORT, '127.0.0.1', () => {
			console.log('Online!')
		})
	})
