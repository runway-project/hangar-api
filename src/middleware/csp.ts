
import { Request, Response, NextFunction } from 'express'

/**
 * Adds a basic content security policy header, preventing certain classes of attack
 */
export function addCSP( req: Request, resp: Response, next: NextFunction ) {
	resp.setHeader('content-security-policy', `script-src 'self'; frame-ancestors 'none'; img-src 'self';`)

	next()
}
