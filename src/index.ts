
import 'dotenv/config'
//import 'reflect-metadata'

import express, {Request, Response, NextFunction} from 'express'
import expressSession from 'express-session'
import compressionMiddlware from 'compression'
import { TypeormStore } from 'connect-typeorm'

import { discordOAuth } from './middleware/auth'
import { addCSP } from './middleware/csp'

import { db } from './db'
import { Session } from './entities/Session'

import { clientRouter } from './routers/client'
import type StatusCode from './routers/api/types/StatusCode'

console.log(`Starting hangar-api...`)
console.time('startup')

const PORT = 9999
const IS_DEV = process.env.NODE_ENV === 'development'

const app = express()

app.use(compressionMiddlware())

app.use(expressSession({
	secret: process.env.COOKIE_SECRET,
	cookie: {
		secure: process.env.NODE_ENV === 'production',
		sameSite: true,
	},
	resave: false,
	saveUninitialized: false,
	store: new TypeormStore({
		cleanupLimit: 2,
		ttl: 7 * 60 * 60
	}).connect( db.getRepository(Session) ),
}))

app.use(addCSP)
app.use(discordOAuth({
	client_id: process.env.DISCORD_CLIENT_ID,
	client_secret: process.env.DISCORD_CLIENT_SECRET,
	redirect_uri: `http://localhost:${PORT}`,
}, db))

// Client
app.use(clientRouter)


/**
 * Global fallback error handler
 */
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {

	console.error(err)

	res.statusCode = StatusCode.INTERNAL_SERVER_ERROR

	res.send( err )
})

db.initialize()
	.then(async () => {
		app.listen(PORT, '127.0.0.1', () => {
			console.timeEnd('startup')
		})
	})
	.catch(ex => {
		console.error(ex)

		throw ex
	})
