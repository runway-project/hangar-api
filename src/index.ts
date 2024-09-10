
import 'dotenv/config'

import express, {Request, Response, NextFunction} from 'express'
import expressSession from 'express-session'
import compressionMiddleware from 'compression'
import rateLimit from 'express-rate-limit'
import { TypeormStore } from 'connect-typeorm'

import { discordOAuth } from './middleware/auth.js'
import { addCSP } from './middleware/csp.js'

import { db } from './db.js'
import { Session } from './entities/Session.js'

import StatusCode from './routers/api/StatusCode.js'

//@ts-ignore - No typings for this yet
import { handler as ssrHandler } from '../dist/astro/server/entry.mjs'

console.log(`Starting hangar-api...`)
console.time('startup')

const PORT = process.env.PORT ?? 9999
const IS_DEV = process.env.NODE_ENV === 'development'

const app = express()

app.set('trust proxy', true)

// Gzip response bodies
app.use(compressionMiddleware())

// Astro static assets
app.use('/', express.static('astro/client/'))

// Astro client middleware
app.use(ssrHandler)

// Set up basic, global rate limiting.
// TODO: Set up something like Redis to track this info
app.use(rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 100,
	standardHeaders: false,
	legacyHeaders: false,
	message: `Too many requests in too short a timeframe.`,
	validate: false,
}))

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
			console.log(`Listening on localhost:${PORT}`)
		})
	})
	.catch(ex => {
		console.error(ex)

		throw ex
	})
