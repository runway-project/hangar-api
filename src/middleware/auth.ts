
import { Request, Response, NextFunction } from 'express'
import fetch from 'node-fetch'

import { Player } from '../entities/Player'
import { DataSource } from 'typeorm'

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
export function discordOAuth( config: DiscordOAuthConfig, db: DataSource ) {
	return async function(req: Request, res: Response, next: NextFunction) {
		
		// Skip processing this if we're already logged in
		if( req.session.is_logged_in ) return next()

		// If we haven't received any login info from Discord, continue processing
		if( ! req.query.code || typeof req.query.code !== 'string' )
			return res.redirect(`https://discord.com/api/oauth2/authorize?client_id=${config.client_id}&redirect_uri=${encodeURIComponent( config.redirect_uri )}&response_type=code&scope=identify`)

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

		if( ! user || ! user.id ) throw new Error(`Attempted to authenticate user, but didn't receive a response from the API!`)

		const existing_player = await db.manager.findOneBy(Player, { id: user.id })

		if( ! existing_player ) {
			const player = new Player( user.id )

			player.name = user.username
			player.display_name = user.username
	
			await player.save()
		}
		else {
			// Update the existing user with whatever the player's most recent Discord username is
			existing_player.name = user.username

			await existing_player.save()
		}

		req.session.user = {
			uid: user.id,
			discord_username: user.username
		}
		req.session.is_logged_in = true

		return next()
	}
}
