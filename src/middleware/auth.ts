
import { Request, Response, NextFunction } from 'express'
import fetch from 'node-fetch'

export interface DiscordOAuthConfig {
	client_id: string,
	client_secret: string,
	redirect_uri: string,
}

export interface DiscordOAuthTokenResp {
	token_type: string,
	access_token: string,
}

/**
 * Adds a basic content security policy header, preventing certain classes of attack
 */
export function discordOAuth( config: DiscordOAuthConfig ) {
	return async function(req: Request, resp: Response, next: NextFunction) {
		
		if( ! req.query.code || typeof req.query.code !== 'string' ) return resp.end('No Discord token sent')

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

		const user = await fetch( 'https://discord.com/api/users/@me', {
			headers: {
				authorization: `${token_response.token_type} ${token_response.access_token}`
			},
		} ).then(res => res.json())

		console.log(user)

		return resp.end('OK!')
	}
}
