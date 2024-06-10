export const NOAUTHD_URL = process.env.SERVER_APP_NOAUTHD_URL
export const WEB_PUSH_PUBKEY = process.env.SERVER_APP_WEB_PUSH_PUBKEY
export const DOMAIN = process.env.SERVER_APP_DOMAIN
export const RELAY = process.env.SERVER_APP_RELAY || 'wss://relay.nsec.app'
export const ORIGIN = process.env.SERVER_APP_ORIGIN || 'https://use.nsec.app'
export const NIP46_RELAYS = [RELAY]
export const NSEC_APP_NPUB = process.env.SERVER_APP_NSEC_APP_NPUB
