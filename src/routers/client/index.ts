
import express, {NextFunction, Request, Response, Router} from 'express'
import markoPlugin from '@marko/express'
import sirv from 'sirv'

import bodyParser from 'body-parser'
import { body, validationResult } from 'express-validator'
import multer, {memoryStorage} from 'multer'

import { db } from '../../db'
import { Player } from '../../entities/Player'
import { Competition } from '../../entities/Competition'

import index from '../../pages/index.marko'
import profile from '../../pages/profile.marko'
import competitions from '../../pages/competitions/index.marko'
import competitions_new from '../../pages/competitions/new.marko'
import competition from '../../pages/competitions/id.marko'
import competition_submit_vessel from '../../pages/competitions/id_submit-vessel.marko'


/** A router which handles rendering HTML with Marko */
export const clientRouter = Router()

// Set up Marko and such
clientRouter.use(markoPlugin())

clientRouter.use('/assets', sirv('dist/assets'))

// Parse request bodies
clientRouter.use(bodyParser.urlencoded({
	limit: '100kb'
}))

const file_parser = multer({
	storage: memoryStorage(),
})

// We're creating middlware which will automatically fetch the current
// player from the DB on each request, so this indicates to TypeScript
// that this is a valid property, which will be present on requests
declare module 'express' {
	interface Request {
		player: Player,
	}
}

// Automatically load the current user's profile on request
clientRouter.use( async (req: Request, res, next) => {
	const player = await db.manager.findOneBy(Player, { id: req.session.user.uid })

	if( ! player ) return next( new Error(`Unable to find current logged in player!`) )

	req.player = player

	next()
})

// HOME
// ----------------------------------------------------------------------------

// Home Page
clientRouter.get('/', async (req: Request, res: Response, next) => {
	res.marko(index, { player: req.player })
})

// PROFILE
// ----------------------------------------------------------------------------

// Profile Page
clientRouter.get('/profile', async (req: Request, res: Response, next) => {
	res.marko(profile, { player: req.player })
})

clientRouter.post(
	'/profile',

	body('display_name').notEmpty().isLength({ min: 3, max: 100 }).trim().escape(),

	async (req: Request, res: Response, next) => {
		const result = validationResult(req)

		if( ! result.isEmpty() ) {
			return res.marko(profile, { player: req.player, errors: result.array() })
		}

		const {display_name} = req.body

		req.player.display_name = display_name

		await req.player.save()

		res.marko(profile, { player: req.player })
	}
)

// COMPETITIONS
// ----------------------------------------------------------------------------

clientRouter.get('/competitions', async (req: Request, res: Response, next) => {
	const comps = await db.manager.find(Competition)

	res.marko(competitions, { player: req.player, competitions: comps })
})

clientRouter.get('/competitions/new', async (req: Request, res: Response, next) => {
	res.marko(competitions_new, { player: req.player })
})

clientRouter.post(
	'/competitions/new',

	body('name').notEmpty().isLength({ min: 2, max: 100 }).trim().escape(),
	
	async (req: Request, res: Response, next) => {
		const result = validationResult(req)

		if( ! result.isEmpty() ) {
			return res.marko(competitions_new, { player: req.player, errors: result.array() })
		}

		// Create a new competition with the specified params, fill in some defaults, and redirect
		// the player to it.

		const comp = new Competition()

		comp.name = req.body.name
		comp.organizers = [req.player]
		
		await comp.save()

		res.redirect(`/competitions/${comp.id}`)
	}
)

clientRouter.get('/competitions/:id', async (req: Request, res: Response, next) => {
	const comp = await db.manager.findOneBy(Competition, { id: parseInt(req.params.id) })

	if( ! comp ) return res.redirect('/404')

	res.marko(competition, { player: req.player, competition: comp })
})

clientRouter.get('/competitions/:id/submit-vessel', async (req: Request, res: Response, next) => {
	const comp = await db.manager.findOneBy(Competition, { id: parseInt(req.params.id) })

	if( ! comp ) return res.redirect('/404')

	res.marko(competition_submit_vessel, { player: req.player, competition: comp })
})

clientRouter.post(
	'/competitions/:id/submit-vessel',

	body('name').isLength({ min: 2, max: 50 }).trim().escape(),

	file_parser.single('craft_file'),

	async (req: Request, res: Response, next) => {
		const comp = await db.manager.findOneBy(Competition, { id: parseInt(req.params.id) })

		if( ! comp ) return res.redirect('/404')

		const result = validationResult(req)

		if( ! result.isEmpty() ) {
			return res.marko(competition_submit_vessel, { player: req.player, errors: result.array() })
		}

		// Handle craft file stuff
		const raw_craft_file = req.file

		console.log({ raw_craft_file })

		res.marko(competition_submit_vessel, { player: req.player, competition: comp })
	}
)


// MISC
// ----------------------------------------------------------------------------

clientRouter.post('/sign-out', async (req, res, next) => {
	req.session.destroy(() => {
		res.redirect('/')
	})
})


