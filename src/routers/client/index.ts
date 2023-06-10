
import express, {NextFunction, Request, Response, Router} from 'express'
import markoPlugin from '@marko/express'
import bodyParser from 'body-parser'
import { body, validationResult } from 'express-validator'

import { db } from '../../db'
import { Player } from '../../entities/Player'

import index from '../../pages/index.marko'
import profile from '../../pages/profile.marko'

/** A router which handles rendering HTML with Marko */
export const clientRouter = Router()

// Set up Marko and such
clientRouter.use(markoPlugin())
clientRouter.use('/assets', express.static('dist/assets'))

declare module 'express' {
	interface Request {
		player: Player,
	}
}

clientRouter.use(bodyParser.urlencoded({
	limit: '500kb'
}))

clientRouter.use( async (req: Request, res, next) => {
	const player = await db.manager.findOneBy(Player, { id: req.session.user.uid })

	if( ! player ) return next( new Error(`Unable to find current logged in player!`) )

	req.player = player

	next()
})

// Home Page
clientRouter.get('/', async (req: Request, res: Response, next) => {
	res.marko(index, { player: req.player })
})

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
