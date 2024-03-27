import { IKind } from '@/types/general'

export const NOAUTHD_URL = process.env.REACT_APP_NOAUTHD_URL
export const WEB_PUSH_PUBKEY = process.env.REACT_APP_WEB_PUSH_PUBKEY
export const DOMAIN = process.env.REACT_APP_DOMAIN
export const RELAY = process.env.REACT_APP_RELAY || 'wss://relay.nsec.app'
export const NIP46_RELAYS = [RELAY]
export const OUTBOX_RELAYS = ['wss://relay.nostr.band', 'wss://nos.lol', 'wss://purplepag.es']
export const SEED_RELAYS = ['wss://relay.damus.io', 'wss://nostr.mom', 'wss://relay.primal.net']
export const BROADCAST_RELAY = 'wss://nostr.mutinywallet.com'
export const NSEC_APP_NPUB = process.env.REACT_APP_NSEC_APP_NPUB

export const APP_TAG = 'nsec.app/perm'

export const MIN_POW = 14
export const MAX_POW = 19

export const KIND_RPC = 24133
export const KIND_DATA = 30078

export const RELOAD_STORAGE_KEY = 'reload'

export const REQ_TTL = 60000 // 1 min

export const TOKEN_SIZE = 16
export const TOKEN_TTL = 600000 // 10 minutes

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
  nip44_encrypt: 'Encrypt message (NIP-44)',
  nip44_decrypt: 'Decrypt message (NIP-44)',
}

export const APP_NSEC_SIZE = {
  BIG: 'big',
  LARGE: 'large',
  MEDIUM: 'medium',
  SMALL: 'small',
  EXTRA_SMALL: 'extra-small',
} as const

export const KINDS: IKind[] = [
  {
    kind: 0,
    name: 'Update your profile',
  },
  {
    kind: 1,
    name: 'Publish note',
  },
  {
    kind: 3,
    name: 'Update your contact list',
  },
  {
    kind: 4,
    name: 'Send direct message',
  },
  {
    kind: 5,
    name: 'Delete event',
  },
  {
    kind: 6,
    name: 'Publish repost',
  },
  {
    kind: 7,
    name: 'Publish reaction',
  },
  {
    kind: 10002,
    name: 'Update your relay list',
  },
]
