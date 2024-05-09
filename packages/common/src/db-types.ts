import { MetaEvent } from './meta-event'

export interface DbKey {
  npub: string
  nip05?: string
  name?: string
  avatar?: string
  relays?: string[]
  enckey: string
  profile?: MetaEvent | null
  ncryptsec?: string
}

export interface DbApp {
  appNpub: string
  npub: string
  name: string
  icon: string
  url: string
  timestamp: number
  updateTimestamp: number
  permUpdateTimestamp: number
  userAgent?: string
  token?: string
  subNpub?: string
}

export interface DbPerm {
  id: string
  npub: string
  appNpub: string
  perm: string
  value: string
  timestamp: number
}

export interface DbPending {
  id: string
  npub: string
  appNpub: string
  timestamp: number
  method: string
  params: string
  appUrl?: string
  subNpub?: string
}

export interface DbHistory {
  id: string
  npub: string
  appNpub: string
  timestamp: number
  method: string
  params: string
  allowed: boolean
}

export interface DbSyncHistory {
  npub: string
}

export interface DbConnectToken {
  npub: string
  token: string
  timestamp: number
  expiry: number
  subNpub?: string
}
