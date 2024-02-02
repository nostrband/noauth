export const NIP46_RELAYS = ['wss://relay.login.nostrapps.org']
export const NOAUTHD_URL = process.env.REACT_APP_NOAUTHD_URL
export const WEB_PUSH_PUBKEY = process.env.REACT_APP_WEB_PUSH_PUBKEY
export const DOMAIN = process.env.REACT_APP_DOMAIN

export enum ACTION_TYPE {
	BASIC = 'basic',
	ADVANCED = 'advanced',
	CUSTOM = 'custom',
}

export const ACTIONS: { [type: string]: string } = {
	get_public_key: 'Get public key',
	sign_event: 'Sign event',
	connect: 'Connect',
	nip04_encrypt: 'Encrypt message',
	nip04_decrypt: 'Decrypt message',
}
