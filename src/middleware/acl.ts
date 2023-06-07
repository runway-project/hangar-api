
import {NextFunction, Request, Response, Router} from 'express'
import { OwnedBaseEntity } from '../entities/OwnedBaseEntity'

/**
 * Permissions which can be required for a given route. Different entities
 * can expose validation functions which check for ownership for the current
 * user.
 * 
 * Note that all permissions *other* than IS_LOGGED_IN assume that the user
 * is logged in, and will bounce them if they are not.
 */
export enum Perms {
	IS_LOGGED_IN,
	IS_ADMIN,
	OWNS_RESOURCE,
	MANAGES_RESOURCE,
} 

/**
 * Validates a set of permissions for a given route.
 * 
 * @param perms The required permissions for the route
 */
export function acl<T extends OwnedBaseEntity>(perms: Perms[]) {

	return async function(req: Request, res: Response, next: NextFunction) {

	}

}