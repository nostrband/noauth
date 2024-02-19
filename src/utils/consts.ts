export const NOAUTHD_URL = process.env.REACT_APP_NOAUTHD_URL
export const WEB_PUSH_PUBKEY = process.env.REACT_APP_WEB_PUSH_PUBKEY
export const DOMAIN = process.env.REACT_APP_DOMAIN
export const RELAY = process.env.REACT_APP_RELAY || 'wss://relay.nsec.app'
export const NIP46_RELAYS = [RELAY]

export const MIN_POW = 14
export const MAX_POW = 19

export const KIND_RPC = 24133

export enum ACTION_TYPE {
  BASIC = 'basic',
  ADVANCED = 'advanced',
  CUSTOM = 'custom',
}

export const ACTIONS: { [type: string]: string } = {
  basic: 'Basic permissions',
  get_public_key: 'Get public key',
  sign_event: 'Sign event',
  connect: 'Connect',
  nip04_encrypt: 'Encrypt message',
  nip04_decrypt: 'Decrypt message',
}
