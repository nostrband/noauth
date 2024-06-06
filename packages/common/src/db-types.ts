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
  localKey?: CryptoKey
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

export interface DbInterface {
  addKey: (key: DbKey) => Promise<void>
  getKey: (npub: string) => Promise<DbKey | undefined>
  listKeys: () => Promise<DbKey[]>
  editName: (npub: string, name: string) => Promise<void>
  editNcryptsec: (npub: string, ncryptsec: string) => Promise<void>

  addApp: (app: DbApp) => Promise<void>
  getApp: (appNpub: string) => Promise<DbApp | undefined>
  listApps: () => Promise<DbApp[]>
  updateApp: (app: DbApp) => Promise<void>
  removeApp: (appNpub: string, npub: string) => Promise<void>
  updateAppPermTimestamp: (appNpub: string, npub: string, timestamp: number) => Promise<number>
  getAppLastActiveRecord: (app: DbApp) => Promise<number>

  addPerm: (perm: DbPerm) => Promise<void>
  listPerms: () => Promise<DbPerm[]>
  removePerm: (id: string) => Promise<void>
  removeAppPerms: (appNpub: string, npub: string) => Promise<void>

  addPending: (pending: DbPending) => Promise<boolean>
  listPending: () => Promise<DbPending[]>
  removePending: (id: string) => Promise<void>
  confirmPending: (id: string, allowed: boolean) => Promise<void>
  addConfirmed: (r: DbHistory) => Promise<boolean | undefined>

  getSynced: (npub: string) => Promise<boolean>
  setSynced: (npub: string) => Promise<void>

  addConnectToken: (token: DbConnectToken) => Promise<boolean | undefined>
  getConnectToken: (npub: string, subNpub?: string) => Promise<DbConnectToken | undefined>
  listConnectTokens: () => Promise<DbConnectToken[]>
  removeConnectToken: (token: string) => Promise<void>

  listHistory: (appNpub: string) => Promise<DbHistory[]>
}
