import { KeyInfo, CreateConnectParams } from '@noauth/backend'
import { DbApp, DbConnectToken, DbHistory, DbKey, DbPending, DbPerm } from '@noauth/common'
import { startClientWebSocket } from './websocket'
import { clientServiceWorker } from './swic'

export interface BackendReply {
  id: number
  result: any
  error: string
  method: string
}

export type AllowType = '1' | '0'

export interface BackendClient {
  // backend has sent some new data an UI needs
  // to re-render
  setOnRender: (onRender: () => void) => void

  // for service-worker only, when new version of
  // sw is ready and we need to show 'Reload' button to user
  setOnReload: (onReload: () => void) => void

  // for websocket only, when connection closed
  setOnClose: (onClose: () => void) => void

  // called by app after it handles the onRender
  // and updates all UI with all new data received
  // from backend, this will deliver all pending
  // method call replies, so that they're delivered
  // after UI has made all updates using the call's
  // side effects
  checkpoint: () => Promise<void>

  connect: () => Promise<boolean>

  addPerm: (appNpub: string, npub: string, permission: string, allow: AllowType) => Promise<void>

  deletePerm: (permId: string) => Promise<void>

  updateApp: (app: DbApp) => Promise<void>

  deleteApp: (appNpub: string, npub: string) => Promise<void>

  connectApp: (appNpub: string, npub: string, appUrl: string, perms: string[]) => Promise<void>

  checkPendingRequest: (npub: string, pendingReqId: string) => Promise<unknown>

  confirmPendingRequest: (id: string, allow: boolean, remember: boolean, options?: any) => Promise<string | undefined>

  fetchPendingRequests: (npub: string) => Promise<void>

  enablePush: () => Promise<boolean>

  redeemToken: (npub: string, token: string) => Promise<void>

  getConnectToken: (npub: string, subNpub?: string) => Promise<DbConnectToken>

  checkName: (name: string) => Promise<string>

  editName: (npub: string, newName: string) => Promise<void>

  transferName: (npub: string, name: string, receiverNpub: string) => Promise<void>

  setPassword: (npub: string, passphrase: string, existingPassphrase?: string) => Promise<void>

  importKey: (name: string, nsec: string, passphrase: string) => Promise<KeyInfo>

  importKeyIframe: (nsec: string, appNpub: string) => Promise<KeyInfo>

  fetchKey: (npub: string, passphrase: string, name: string) => Promise<KeyInfo | undefined>

  fetchKeyByEmail: (email: string, passphrase: string) => Promise<KeyInfo | undefined>

  checkEmailStatus: (npub: string, email: string) => Promise<boolean>

  confirmEmail: (npub: string, email: string, code: string, passphrase: string) => Promise<void>

  setEmail: (npub: string, email: string) => Promise<void>

  exportKey: (npub: string) => Promise<string>

  nostrConnect: (npub: string, nostrconnect: string, options: any) => Promise<string>

  generateKey: (name: string, passphrase: string) => Promise<KeyInfo>

  generateKeyForEmail: (name: string, email: string) => Promise<KeyInfo>

  generateKeyConnect: (params: CreateConnectParams) => Promise<string>

  nip04Decrypt: (npub: string, peerPubkey: string, ciphertext: string) => Promise<string>

  nip44Decrypt: (npub: string, peerPubkey: string, ciphertext: string) => Promise<string>

  getListKeys: () => Promise<DbKey[]>

  getListApps: () => Promise<DbApp[]>

  getListPerms: () => Promise<DbPerm[]>

  getListPendingRequests: () => Promise<DbPending[]>

  getListHistory: (appNpub: string) => Promise<DbHistory[]>

  getAppLastActiveRecord: (app: DbApp) => Promise<number>

  getSynced: (npub: string) => Promise<boolean>

  registerIframeWorker: (port: MessagePort) => Promise<void>

  ping: () => Promise<void>

  rebind: (npub: string, appNpub: string, port: MessagePort) => Promise<void>

  waitKey: (npub: string) => Promise<void>

  deleteKey: (npub: string) => Promise<void>

  getKeyEnclaveInfo: (npub: string) => Promise<any>

  uploadKeyToEnclave: (npub: string) => Promise<void>
}

const defineClient = (): BackendClient => {
  if (process.env.REACT_APP_HOSTED === 'true') return startClientWebSocket()
  return clientServiceWorker
}

export const client = defineClient()
