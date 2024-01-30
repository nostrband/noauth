export const NIP46_RELAYS = ['wss://relay.login.nostrapps.org']
export const NOAUTHD_URL = process.env.REACT_APP_NOAUTHD_URL
export const WEB_PUSH_PUBKEY = process.env.REACT_APP_WEB_PUSH_PUBKEY

export enum ACTION_TYPE {
	BASIC = 'basic',
	ADVANCED = 'advanced',
	CUSTOM = 'custom',
}