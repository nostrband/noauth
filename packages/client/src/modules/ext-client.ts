import { DbApp, DbConnectToken } from '@noauth/common'
import { AllowType, BackendClient, BackendReply } from './client'
import { CreateConnectParams, KeyInfo } from '@noauth/backend'
import { NostrEvent } from '@nostr-dev-kit/ndk'
import { dbi } from '@noauth/common/dist/dbi-client'
import browser from 'webextension-polyfill'

export class ClientExtension implements BackendClient {
  private messageId: number = 1
  private reqs: Map<number, { ok: (value: any) => void; rej: (reason?: any) => void }> = new Map()
  private onRender: (() => void) | null = null
  private onReload: (() => void) | null = null
  private onClose: (() => void) | null = null
  private queue: (() => Promise<void> | void)[] = []
  private checkpointQueue: (() => Promise<void> | void)[] = []
  private isConnected: boolean = true

  public async connect(): Promise<boolean> {
    return true
  }

  private async onStarted() {
    console.log('[onStarted]:works')
    this.isConnected = true
    while (this.queue.length) await this.queue.shift()!()
  }

  private callWhenStarted(cb: () => void) {
    console.log('[callWhenStarted]:works', cb, { connected: this.isConnected })
    if (this.isConnected) cb()
    else this.queue.push(cb)
  }

  private async waitStarted() {
    console.log('[waitStarted]:works')
    return new Promise<void>((ok) => this.callWhenStarted(ok))
  }

  public async onMessage(data: BackendReply) {
    const { id, result, error, method = '' } = data
    console.log('receive from Background => ', { id, result, error, method })
    if (!id) {
      if (result === 'reload') {
        if (this.onReload) this.onReload()
      } else {
        if (this.onRender) this.onRender()
      }
      return
    }
    const req = this.reqs.get(id)
    if (!req) {
      console.log('Unexpected message', data)
      return
    }
    this.reqs.delete(id)
    this.checkpointQueue.push(() => {
      // a hacky way to let App handle onRender first
      // to update redux and only then we deliver the
      // reply
      if (error) req.rej(error)
      else req.ok(result)
    })
  }

  private async call<T = void>(method: string, ...args: any[]): Promise<T> {
    await this.waitStarted()
    console.log('[waitStarted]:worked')

    const id = this.messageId
    this.messageId++

    return new Promise((ok, rej) => {
      const call = () => {
        if (!this.isConnected) {
          rej(new Error('No background service worker'))
          return
        }
        this.reqs.set(id, { ok, rej })
        const msg = {
          id,
          method,
          args: [...args],
        }
        console.log('sending to background', msg)
        browser.runtime.sendMessage(msg)
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

  public async processRequest(event: NostrEvent) {
    return this.call<NostrEvent>('processRequest', event)
  }

  public getListKeys() {
    return dbi.listKeys()
  }

  public getListApps() {
    return dbi.listApps()
  }

  public getListPerms() {
    return dbi.listPerms()
  }

  public getListPendingRequests() {
    return dbi.listPending()
  }

  public getListHistory(appNpub: string) {
    return dbi.listHistory(appNpub)
  }

  public getAppLastActiveRecord(app: DbApp) {
    return dbi.getAppLastActiveRecord(app)
  }
  public async getSynced(npub: string) {
    return await dbi.getSynced(npub)
  }
}

export const clientExtension = new ClientExtension()

browser.runtime.onMessage.addListener((message: any) => {
  console.log('[HISH]: Receive message on client')
  return clientExtension.onMessage(message)
})
