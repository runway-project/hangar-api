/// <reference path="../env.d.ts"/>

import 'dotenv/config'
//import 'reflect-metadata'

import express, {Request, Response, NextFunction} from 'express'
import expressSession from 'express-session'
import compressionMiddlware from 'compression'
import rateLimit from 'express-rate-limit'
import { TypeormStore } from 'connect-typeorm'
import sirv from 'sirv'

import { discordOAuth } from './middleware/auth'
import { addCSP } from './middleware/csp'

import { db } from './db'
import { Session } from './entities/Session'

import { clientRouter } from './routers/client'
import StatusCode from './routers/api/StatusCode'

console.log(`Starting hangar-api...`)
console.time('startup')

const PORT = process.env.PORT ?? 9999
const IS_DEV = process.env.NODE_ENV === 'development'

const app = express()

app.set('trust proxy', true)

// Gzip response bodies
app.use(compressionMiddlware())

// Set up basic, global rate limiting.
// TODO: Set up something like Redis to track this info
app.use(rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 100,
	standardHeaders: false,
	legacyHeaders: false,
	message: `Too many requests in too short a timeframe.`
}))

clientRouter.use('/assets', sirv('dist/assets'))

// Cookie-based session middleware
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
		ttl: 30 * 60 * 60 * 24
	}).connect( db.getRepository(Session) ),
}))

// Set up content-security-policy headers, to mitigate some types of attack
app.use(addCSP)

// Require that all users accessing the site be authenticated with Discord.
// TODO: Refactor this to allow some public routes, while still login-gating
// stuff like forms.
app.use(discordOAuth({
	client_id: process.env.DISCORD_CLIENT_ID,
	client_secret: process.env.DISCORD_CLIENT_SECRET,
	redirect_uri: process.env.SITE_URL,
}, db))

// Client routes
app.use(clientRouter)


/**
 * Global fallback error handler, if no other route has provided a valid error
 * handler.
 */
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {

	console.error(err)

	res.statusCode = StatusCode.INTERNAL_SERVER_ERROR

	res.send( err )
})

// Wait for the DB connection to complete before accepting connections
db.initialize()
	.then(async () => {
		app.listen(PORT as number, '127.0.0.1', () => {
			console.timeEnd('startup')
		})
	})
	.catch(ex => {
		console.error(ex)

		throw ex
	})
