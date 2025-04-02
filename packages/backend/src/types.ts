import NDK, { NDKNip46Backend } from '@nostr-dev-kit/ndk'
import { Watcher } from './watcher'
import { Signer } from './signer'

export enum DECISION {
  ASK = '',
  ALLOW = 'allow',
  DISALLOW = 'disallow',
  IGNORE = 'ignore',
}

export interface IAllowCallbackParams {
  backend: NDKNip46Backend
  npub: string
  id: string
  method: string
  remotePubkey: string
  // provided by peers
  params?: any
  // used for internal options
  options?: any
}

export interface Key {
  npub: string
  pubkey: string
  ndk: NDK
  backoff: number
  signer: Signer
  backend: NDKNip46Backend
  watcher: Watcher
}

export interface CreateConnectParams {
  name: string
  password?: string
  appNpub: string
  perms: string
  appUrl: string
  port?: MessagePort
  email?: string
}

export interface BackendRequest {
  id: number
  method: string
  args: any[]
}

export interface KeyInfo {
  npub: string
  nip05?: string
  name?: string
  email?: string
  locked: boolean
}

export interface EnclaveData {
  pubkey: string
  relays: string[]
  pcrs: string[][]
  builder?: string
  launcher?: string
}

export interface KeyEnclaveData {
  enclaves: EnclaveData[]
}
