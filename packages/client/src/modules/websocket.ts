import { AllowType, BackendClient, BackendReply } from './client'
import { CreateConnectParams, KeyInfo } from '@noauth/backend'
import { DbApp, DbConnectToken, DbHistory, DbKey, DbPending, DbPerm } from '@noauth/common'
import { NostrEvent } from '@nostr-dev-kit/ndk'

const DB_METHODS = [
  'listKeys',
  'listApps',
  'listPerms',
  'listPending',
  'listHistory',
  'getAppLastActiveRecord',
  'getSynced',
]

export class ClientWebSocket implements BackendClient {
  private ws: WebSocket
  private reqs: Map<number, { ok: (value: any) => void; rej: (reason?: any) => void }> = new Map()
  private messageId: number = 1
  private isConnected: boolean = false
  private onRender: (() => void) | null = null
  private onReload: (() => void) | null = null
  private onClose: (() => void) | null = null
  private queue: (() => Promise<void> | void)[] = []
  private checkpointQueue: (() => Promise<void> | void)[] = []

  constructor(url: string) {
    this.ws = new WebSocket(url)

    this.ws.onmessage = (event: MessageEvent) => {
      this.onMessage(event.data)
    }
    this.ws.onopen = () => {
      this.onStarted()
    }
    this.ws.onerror = (error: Event) => {
      console.log('WS error:', error)
    }
    this.ws.onclose = (event: CloseEvent) => {
      this.isConnected = false
      console.log('WS closed:', event.code, event.reason)
    }
  }

  public async connect(): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.isConnected) return resolve(true)

      this.ws.onopen = () => {
        this.onStarted()
        if (this.ws.readyState === WebSocket.OPEN) resolve(true)
        else resolve(false)
      }

      this.ws.onerror = (error: Event) => {
        console.log('WebSocket connection error:', error)
        resolve(false)
        this.onClose && this.onClose()
      }
    })
  }

  private async onStarted() {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.isConnected = true
      console.log('WS started, queue', this.queue.length)
      while (this.queue.length) await this.queue.shift()!()
    }
  }

  private callWhenStarted(cb: () => void) {
    if (this.isConnected) cb()
    else this.queue.push(cb)
  }

  private async waitStarted() {
    return new Promise<void>((ok) => this.callWhenStarted(ok))
  }

  private async call<T = void>(method: string, ...args: any[]): Promise<T> {
    await this.waitStarted()

    const id = this.messageId
    this.messageId++

    return new Promise((ok, rej) => {
      if (DB_METHODS.includes(method)) {
        const msg = {
          id,
          method,
          args: [...args],
        }
        this.ws.send(JSON.stringify(msg))
        this.reqs.set(id, { ok, rej })
        return
      }

      const call = async () => {
        if (!this.isConnected) {
          rej(new Error('No WS connection!'))
          return
        }

        this.reqs.set(id, { ok, rej })
        const msg = {
          id,
          method,
          args: [...args],
        }
        console.log('sending to WS', msg)
        this.ws.send(JSON.stringify(msg))
      }
      this.callWhenStarted(call)
    })
  }

  public async checkpoint() {
    console.log('backend client checkpoint queue', this.checkpointQueue.length)
    // take existing callbacks
    const cbs = this.checkpointQueue.splice(0, this.checkpointQueue.length)
    for (const cb of cbs) await cb()
  }

  private onMessage(data: string) {
    const response: BackendReply = JSON.parse(data)
    const { id, result, error, method = '' } = response

    if (!id) {
      if (result === 'reload') {
        if (this.onReload) this.onReload()
      } else {
        if (this.onRender) this.onRender()
      }
      return
    }

    console.log('receive from WS => ', { id, result, error, method })
    const req = this.reqs.get(id)

    if (!req) {
      console.log('Unexpected message', data)
      return
    }

    this.reqs.delete(id)

    if (DB_METHODS.includes(method)) {
      if (error) req.rej(error)
      else req.ok(result)
    } else {
      this.checkpointQueue.push(() => {
        // a hacky way to let App handle onRender first
        // to update redux and only then we deliver the
        // reply
        if (error) req.rej(error)
        else req.ok(result)
      })
    }
  }

  public setOnRender(onRender: () => void) {
    this.onRender = onRender
  }

  public setOnReload(onReload: () => void) {
    this.onReload = onReload
  }

  public setOnClose(onClose: () => void) {
    this.onClose = onClose
  }

  public async addPerm(appNpub: string, npub: string, permission: string, allow: AllowType) {
    return this.call('addPerm', appNpub, npub, permission, allow)
  }

  public async deletePerm(permId: string) {
    return this.call('deletePerm', permId)
  }

  public async updateApp(app: DbApp) {
    return this.call('updateApp', app)
  }

  public async connectApp(appNpub: string, npub: string, appUrl: string, perms: string[]) {
    return this.call('connectApp', { npub, appNpub, appUrl, perms })
  }

  public async deleteApp(appNpub: string, npub: string) {
    return this.call('deleteApp', appNpub, npub)
  }

  public async checkPendingRequest(npub: string, pendingReqId: string) {
    return this.call('checkPendingRequest', npub, pendingReqId)
  }

  public async confirmPendingRequest(id: string, allow: boolean, remember: boolean, options?: any) {
    return this.call<string | undefined>('confirm', id, allow, remember, options)
  }

  public async fetchPendingRequests(npub: string) {
    return this.call('fetchPendingRequests', npub)
  }

  public async enablePush() {
    return this.call<boolean>('enablePush')
  }

  public async redeemToken(npub: string, token: string) {
    return this.call('redeemToken', npub, token)
  }

  public async getConnectToken(npub: string, subNpub?: string) {
    return this.call<DbConnectToken>('getConnectToken', npub, subNpub)
  }

  public async editName(npub: string, newName: string) {
    return this.call('editName', npub, newName)
  }

  public async transferName(npub: string, name: string, receiverNpub: string) {
    return this.call('transferName', npub, name, receiverNpub)
  }

  public async setPassword(npub: string, passphrase: string, existingPassphrase?: string) {
    return this.call('setPassword', npub, passphrase, existingPassphrase)
  }

  public async importKey(name: string, nsec: string, passphrase: string) {
    return this.call<KeyInfo>('importKey', name, nsec, passphrase)
  }

  public async importKeyIframe(nsec: string, appNpub: string): Promise<KeyInfo> {
    throw new Error('Not supported')
  }

  public async fetchKey(npub: string, passphrase: string, name: string) {
    return this.call<KeyInfo>('fetchKey', npub, passphrase, name)
  }

  public async nostrConnect(npub: string, nostrconnect: string, options: any) {
    return this.call<string>('nostrConnect', npub, nostrconnect, options)
  }

  public async exportKey(npub: string) {
    return this.call<string>('exportKey', npub)
  }

  public async generateKey(name: string, passphrase: string) {
    return this.call<KeyInfo>('generateKey', name, passphrase)
  }

  public async generateKeyConnect(params: CreateConnectParams) {
    return this.call<string>('generateKeyConnect', params)
  }

  public async nip04Decrypt(npub: string, peerPubkey: string, ciphertext: string) {
    return this.call<string>('nip04Decrypt', npub, peerPubkey, ciphertext)
  }

  public async nip44Decrypt(npub: string, peerPubkey: string, ciphertext: string) {
    return this.call<string>('nip44Decrypt', npub, peerPubkey, ciphertext)
  }

  public async getListKeys() {
    return this.call<DbKey[]>('listKeys')
  }

  public async getListApps() {
    return this.call<DbApp[]>('listApps')
  }

  public async getListPerms() {
    return this.call<DbPerm[]>('listPerms')
  }

  public async getListPendingRequests() {
    return this.call<DbPending[]>('listPending')
  }

  public async getListHistory(appNpub: string) {
    return this.call<DbHistory[]>('listHistory', appNpub)
  }

  public async getAppLastActiveRecord(app: DbApp) {
    return this.call<number>('getAppLastActiveRecord', app)
  }

  public async getSynced(npub: string) {
    return this.call<boolean>('getSynced', npub)
  }

  public async rebind(npub: string, appNpub: string, port: MessagePort) {
    throw new Error('rebind not implemented')
  }

  public async registerIframeWorker(port: MessagePort) {
    throw new Error('registerIframeWorker not implemented')
  }

  public async waitKey(npub: string) {
    throw new Error('waitKey not implemented')
  }

  public async ping() {
    // noop
  }
}

export const startClientWebSocket = () => new ClientWebSocket(`ws://${document.location.hostname}:8080`)
