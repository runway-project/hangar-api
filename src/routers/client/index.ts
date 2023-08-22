
import express, {NextFunction, Request, Response, Router} from 'express'
import markoPlugin from '@marko/express'
import NodeBuffer from 'node:buffer'

import AdmZip from 'adm-zip'

import bodyParser from 'body-parser'
import { body, validationResult } from 'express-validator'
import multer, {memoryStorage} from 'multer'

import { db } from '../../db'
import { Player } from '../../entities/Player'
import { Competition, CompetitionState } from '../../entities/Competition'
import { Vessel } from '../../entities/Vessel'

import { saveCraftFile, loadCraftFile } from '../../utils/craft-file'

import index from '../../pages/index.marko'
import profile from '../../pages/profile.marko'
import competitions from '../../pages/competitions/index.marko'
import competitions_new from '../../pages/competitions/new.marko'
import competition from '../../pages/competitions/id.marko'
import competition_submit_vessel from '../../pages/competitions/id_submit-vessel.marko'
import pizza from '../../pages/pizza.marko'


/** A router which handles rendering HTML with Marko */
export const clientRouter = Router()

// Set up Marko and such
clientRouter.use(markoPlugin())

// Parse request bodies
clientRouter.use(bodyParser.urlencoded({
	limit: '100kb'
}))

const file_parser = multer({
	limits: {
		fileSize: 1024 * 1024, // 1 MB
		files: 1,
		fieldSize: 1024 * 10, // 10 KB
	},
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

	body('display_name', 'must be between 3 and 100 characters').notEmpty().isLength({ min: 3, max: 100 }).trim().escape(),

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

// PIZZA
// ----------------------------------------------------------------------------

clientRouter.get('/pizza', async (req: Request, res: Response) => {
	res.marko(pizza)
})

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

	body('name', 'must be between 2 and 100 characters').notEmpty().isLength({ min: 2, max: 100 }).trim().escape(),
	
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

clientRouter.post(
	'/competitions/:id',

	body('name', 'must be between 2 and 100 characters').isLength({ min: 2, max: 100 }).trim().escape(),
	body('remote_orchestration_password', 'must be between 2 and 200 characters').isLength({ min: 2, max: 200 }),
	body('description', 'must be between 2 and 4096 characters').isLength({ min: 2, max: 4096 }).trim().escape(),

	async (req: Request, res: Response, next) => {
		const comp = await db.manager.findOneBy(Competition, { id: parseInt(req.params.id) })

		if( ! comp ) return res.redirect('/404')
		if( ! comp.validateOwnership( req.player ) ) return next( new Error(`Permission denied`) )

		const result = validationResult(req)

		if( ! result.isEmpty() ) {
			return res.marko(competition, { player: req.player, competition: comp, errors: result.array() })
		}

		comp.name = req.body.name
		comp.description = req.body.description
		comp.remote_orchestration_password = req.body.remote_orchestration_password

		await comp.save()


		res.marko(competition, { player: req.player, competition: comp })
	}
)

clientRouter.post(
	'/competitions/:id/set-stage',

	body('stage').isIn(['closed', 'accepting_submissions']),

	async (req: Request, res: Response, next) => {
		const comp = await db.manager.findOneBy(Competition, { id: parseInt(req.params.id) })

		if( ! comp ) return res.redirect('/404')
		if( ! comp.validateOwnership( req.player ) ) return next( new Error(`Permission denied`) )

		const result = validationResult(req)

		if( ! result.isEmpty() ) {
			return res.marko(competition, { player: req.player, competition: comp, errors: result.array() })
		}

		comp.status = req.body.stage

		await comp.save()

		res.marko(competition, { player: req.player, competition: comp })
	}
)

clientRouter.get('/competitions/:id/submit-vessel', async (req: Request, res: Response, next) => {
	const comp = await db.manager.findOneBy(Competition, { id: parseInt(req.params.id) })

	if( ! comp ) return res.redirect('/404')

	res.marko(competition_submit_vessel, { player: req.player, competition: comp })
})

clientRouter.post(
	'/competitions/:id/submit-vessel',

	file_parser.single('craft_file'),

	body('name')
		.trim()
		.isLength({ min: 2, max: 50 }).withMessage('must be between 2 and 50 characters')
		.not().matches(/^\s+$/).withMessage('cannot only consist of whitespace')
		.not().contains(',').withMessage('cannot contains commas')
		.not().contains(';').withMessage('cannot contain semicolons')
		.escape(),

	async (req: Request, res: Response, next) => {
		const comp = await db.manager.findOneBy(Competition, { id: parseInt(req.params.id) })

		if( ! comp ) return res.redirect('/404')

		if( comp.status !== CompetitionState.ACCEPTING_SUBMISSIONS ) return next( new Error(`Competition is not accepting submissions`) )

		const result = validationResult(req)

		if( ! result.isEmpty() ) {
			return res.marko(competition, { player: req.player, competition: comp, errors: result.array() })
		}

		// Do some validation
		if( ! req.file?.buffer ) return next( new Error(`Craft file must be present`) )
		if( ! NodeBuffer.isUtf8( req.file.buffer ) ) return next( new Error(`Craft file must contain only valid UTF-8 characters`) )

		// Handle craft file stuff
		const original_filename = req.file.originalname
		const craft_file_buffer = req.file.buffer
		const craft_name = req.body.name

		const craft_file = craft_file_buffer.toString('utf-8')

		// Wrap everything in a transaction so we'll be able to roll back if there
		// are any problems
		await db.manager.transaction( async manager => {

			// Check whether another vessel with the specified name exists
			let vessel = await manager.findOneBy(Vessel, { name: craft_name, playerId: req.player.id, competitionId: comp.id })

			// Create a vessel instance if it doesn't exist already
			if( ! vessel ) vessel = new Vessel()

			vessel.name = craft_name

			vessel.player = req.player
			vessel.craft_file = original_filename
			vessel.competition = Promise.resolve(comp)
			vessel.competitionId = comp.id
			
			await vessel.save()

			// Associate the vessel with the comp
			comp.vessels = [...comp.vessels, vessel]

			await comp.save()

			console.log(vessel)

			// Save the craft file to disk only after the above steps have finished
			await saveCraftFile( vessel, craft_file )
		})

		res.redirect(`/competitions/${req.params.id}`)
	}
)

clientRouter.post('/competitions/:id/vessels/:vessel/delete', async (req, res, next) => {

})


clientRouter.get('/competitions/:id/vessels.zip', async (req, res, next) => {
	const comp = await db.manager.findOneBy(Competition, { id: parseInt(req.params.id) })

	if( ! comp ) return res.redirect('/404')

	const vessels = comp.vessels

	// Iterate through the competition's vessels, adding them to a convenient zip file
	const craft_files = await Promise.all(vessels.map(vessel => {
		return new Promise(async resolve => {
			let craft_file = await loadCraftFile(vessel)

			const name = `${vessel.player.display_name}_${vessel.name}`

			craft_file = craft_file
				.replace(/ship = [^\r\n]+/i, `ship = ${name}`)
				.replace(/version = 1[^\r\n]+/i, 'version = 1.12.2')

			resolve({ craft_file, vessel, name })
		})
	})) as {craft_file: string, name: string, vessel: Vessel}[]

	const zip_file = new AdmZip()

	craft_files.forEach(({name, craft_file}) => {
		zip_file.addFile( name + '.craft', Buffer.from(craft_file) )
	})

	const buff = await zip_file.toBufferPromise()

	res.type('application/zip')
	res.setHeader('Content-disposition', `attachment; filename=${comp.id}_vessels.zip`);
	res.end( buff )
})

// MISC
// ----------------------------------------------------------------------------

clientRouter.post('/sign-out', async (req, res, next) => {
	req.session.destroy(() => {
		res.redirect('/')
	})
})


