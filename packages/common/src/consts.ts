export const KIND_RPC = 24133

export const MIN_POW = 11
export const MAX_POW = 17

export const OUTBOX_RELAYS = ['wss://relay.nos.social', 'wss://nos.lol', 'wss://purplepag.es', 'wss://relay.nostr.band']
export const SEED_RELAYS = ['wss://relay.damus.io', 'wss://nostr.mom', 'wss://relay.primal.net']
export const BROADCAST_RELAYS = [...OUTBOX_RELAYS, ...SEED_RELAYS]

export const REQ_TTL = 60000 // 1 min

export const KIND_DATA = 30078

export enum ACTION_TYPE {
  BASIC = 'basic',
  ADVANCED = 'advanced',
  CUSTOM = 'custom',
  REQUESTED = 'requested',
  REUSE = 'reuse',
}
