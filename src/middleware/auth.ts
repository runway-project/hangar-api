
import { Request, Response, NextFunction } from 'express'
import fetch from 'node-fetch'

import { Player } from '../entities/Player'

export interface UserSession {
	uid: string,
	discord_username: string,
}

declare module 'express-session' {
	interface SessionData {
		user?: UserSession,
		is_logged_in?: boolean,
	}
}

export interface DiscordOAuthConfig {
	client_id: string,
	client_secret: string,
	redirect_uri: string,
}

export interface DiscordOAuthTokenResp {
	token_type: string,
	access_token: string,
}

export interface DiscordProfileResp {
	id: string,
	username: string,
}

/**
 * Adds a basic content security policy header, preventing certain classes of attack
 */
export function discordOAuth( config: DiscordOAuthConfig ) {
	return async function(req: Request, resp: Response, next: NextFunction) {
		
		// Skip processing this if we're already logged in
		if( req.session.is_logged_in ) return next()

		// If we haven't received any login info from Discord, continue processing
		if( ! req.query.code || typeof req.query.code !== 'string' ) return next()

		// Authenticate the code we received with Discord to log the user in
		const token_response = await fetch( 'https://discord.com/api/oauth2/token', {
			method: 'POST',
			body: new URLSearchParams({
				code: req.query.code,
				grant_type: 'authorization_code',
				scope: 'identify',
				...config
			}).toString(),
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			}
		}).then(res => res.json() as any as DiscordOAuthTokenResp)

		// Fetch the user's profile info from Discord
		const user = await fetch( 'https://discord.com/api/users/@me', {
			headers: {
				authorization: `${token_response.token_type} ${token_response.access_token}`
			},
		} ).then(res => res.json() as any as DiscordProfileResp)

		// Ensure we have the user saved in the DB

		const player = new Player( user.id )

		player.name = user.username

		await player.save()

		req.session.user = {
			uid: user.id,
			discord_username: user.username
		}

		return next()
	}
}
