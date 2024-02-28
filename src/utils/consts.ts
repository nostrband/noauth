export const NOAUTHD_URL = process.env.REACT_APP_NOAUTHD_URL
export const WEB_PUSH_PUBKEY = process.env.REACT_APP_WEB_PUSH_PUBKEY
export const DOMAIN = process.env.REACT_APP_DOMAIN
export const RELAY = process.env.REACT_APP_RELAY || 'wss://relay.nsec.app'
export const NIP46_RELAYS = [RELAY]
export const OUTBOX_RELAYS = ['wss://relay.nostr.band', 'wss://nos.lol', 'wss://purplepag.es']
export const BROADCAST_RELAY = 'wss://nostr.mutinywallet.com'

export const APP_TAG = 'nsec.app/perm'

export const MIN_POW = 14
export const MAX_POW = 19

export const KIND_RPC = 24133
export const KIND_DATA = 30078

export const RELOAD_STORAGE_KEY = 'reload'

export const REQ_TTL = 60000 // 1 min

export enum ACTION_TYPE {
  BASIC = 'basic',
  ADVANCED = 'advanced',
  CUSTOM = 'custom',
  REQUESTED = 'requested',
}

export const ACTIONS: { [type: string]: string } = {
  basic: 'Basic permissions',
  get_public_key: 'Get public key',
  sign_event: 'Sign event',
  connect: 'Connect',
  nip04_encrypt: 'Encrypt message',
  nip04_decrypt: 'Decrypt message',
}

export const APP_NSEC_SIZE = {
  BIG: 'big',
  LARGE: 'large',
  MEDIUM: 'medium',
  SMALL: 'small',
  EXTRA_SMALL: 'extra-small',
} as const
