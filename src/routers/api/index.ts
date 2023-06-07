
import {NextFunction, Request, Response, Router} from 'express'
import StatusCode from './types/StatusCode'
import { acl, Perms } from '../../middleware/acl'
import { Player } from '../../entities/Player'

export const apiRouter = Router()

// Extend Express's Response interface with a custom function we're
// defining below
declare module 'express' {
	interface Response {
		respond( status: StatusCode, body: any ): void
	}
}


/**
 * Create a new utility function for dealing with JSON payloads
 */
apiRouter.use((req, res: Response, next) => {
	
	/**
	 * Responds with a JSON-stringified payload and a status code
	 * 
	 * @param status 
	 * @param payload 
	 */
	res.respond = function( status, payload ) {
		res.statusCode = status

		res.json({
			status,
			success: status < 300,
			payload,
		})

		res.end()
	}
})

/**
 * Global fallback error handler
 */
apiRouter.use((err: Error, req: Request, res: Response, next: NextFunction) => {

	console.error(err)

	return res.respond( StatusCode.INTERNAL_SERVER_ERROR, err )

})

// API Routes

apiRouter.get('/profile', acl<Player>([Perms.IS_LOGGED_IN]), (req, res) => {

})
