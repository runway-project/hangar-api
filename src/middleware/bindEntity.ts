
import { Request, Response, NextFunction } from 'express'
import { CustomBaseEntity } from '../entities/CustomBaseEntity'
import { Perms } from './acl'


export function bindEntity( entity: CustomBaseEntity, required_perms: Perms[] = [] ) {

}

export function addCSP( req: Request, resp: Response, next: NextFunction ) {
	resp.setHeader('content-security-policy', `script-src 'self' 'unsafe-inline'; frame-ancestors 'none'; img-src 'self';`)

	next()
}
