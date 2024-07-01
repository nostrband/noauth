export const KIND_RPC = 24133

export const MIN_POW = 11
export const MAX_POW = 17

export const OUTBOX_RELAYS = ['wss://relay.nostr.band', 'wss://nos.lol', 'wss://purplepag.es']
export const SEED_RELAYS = ['wss://relay.damus.io', 'wss://nostr.mom', 'wss://relay.primal.net']
export const BROADCAST_RELAY = 'wss://nostr.mutinywallet.com'

export const REQ_TTL = 60000 // 1 min

export const KIND_DATA = 30078

export enum ACTION_TYPE {
  BASIC = 'basic',
  ADVANCED = 'advanced',
  CUSTOM = 'custom',
  REQUESTED = 'requested',
  REUSE = 'reuse',
}
