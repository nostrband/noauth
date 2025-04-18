import { dbi } from '@noauth/common/dist/dbi-client'
import { AllowType, BackendClient, BackendReply } from './client'
import { NativeBackend } from './native-backend'
import { DbApp, DbConnectToken } from '@noauth/common'
import { CreateConnectParams, KeyInfo } from '@noauth/backend'
import { Event } from 'nostr-tools'

class NativeClient implements BackendClient {
  private backend: NativeBackend
  private reqs = new Map<number, { ok: (r: any) => void; rej: (r: any) => void }>()
  private nextReqId = 1
  private onRender: (() => void) | null = null
  private onReload: (() => void) | null = null
  private onClose: (() => void) | null = null
  // private queue: (() => Promise<void> | void)[] = []
  private checkpointQueue: (() => Promise<void> | void)[] = []

  constructor() {
    this.backend = new NativeBackend()
    this.backend.setOnUIUpdate(() => this.onMessage({} as BackendReply))
    this.backend.start()
  }

  public async connect(): Promise<boolean> {
    return true
  }

  // send an RPC to the backend
  private async call<T = void>(method: string, transfer: any[], ...args: any[]): Promise<T> {
    const id = this.nextReqId
    this.nextReqId++

    return new Promise((ok, rej) => {
      const call = async () => {
        const msg = {
          id,
          method,
          args: [...args],
        }

        this.reqs.set(id, { ok, rej })

        // don't print this one
        if (method !== 'importKeyIframe') console.log('sending to SW', msg)
        await this.backend.onMessageEvent(msg, this.onMessage.bind(this))
      }
      call()
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

  public onMessage(data: BackendReply) {
    const { id, result, error } = data
    console.log('BACKEND message', id, result, error)

    if (!id) {
      if (result === 'reload') {
        if (this.onReload) this.onReload()
      } else {
        if (this.onRender) this.onRender()
      }
      return
    }

    const r = this.reqs.get(id)
    if (!r) {
      console.log('Unexpected message from service worker', data)
      return
    }

    this.reqs.delete(id)
    this.checkpointQueue.push(() => {
      // a hacky way to let App handle onRender first
      // to update redux and only then we deliver the
      // reply
      if (error) r.rej(error)
      else r.ok(result)
    })
  }

  public async addPerm(appNpub: string, npub: string, permission: string, allow: AllowType) {
    return this.call('addPerm', [], appNpub, npub, permission, allow)
  }

  public async deletePerm(permId: string) {
    return this.call('deletePerm', [], permId)
  }

  public async updateApp(app: DbApp) {
    return this.call('updateApp', [], app)
  }

  public async connectApp(appNpub: string, npub: string, appUrl: string, perms: string[]) {
    return this.call('connectApp', [], { npub, appNpub, appUrl, perms })
  }

  public async deleteApp(appNpub: string, npub: string) {
    return this.call('deleteApp', [], appNpub, npub)
  }

  public async checkPendingRequest(npub: string, pendingReqId: string) {
    return this.call('checkPendingRequest', [], npub, pendingReqId)
  }

  public async confirmPendingRequest(id: string, allow: boolean, remember: boolean, options?: any) {
    const transfer = options && options.port ? [options.port] : []
    return this.call<string | undefined>('confirm', transfer, id, allow, remember, options)
  }

  public async fetchPendingRequests(npub: string) {
    return this.call('fetchPendingRequests', [], npub)
  }

  public async enablePush() {
    return this.call<boolean>('enablePush', [])
  }

  public async redeemToken(npub: string, token: string) {
    return this.call('redeemToken', [], npub, token)
  }

  public async getConnectToken(npub: string, subNpub?: string) {
    return this.call<DbConnectToken>('getConnectToken', [], npub, subNpub)
  }

  public async editName(npub: string, newName: string) {
    return this.call('editName', [], npub, newName)
  }

  public async transferName(npub: string, name: string, receiverNpub: string) {
    return this.call('transferName', [], npub, name, receiverNpub)
  }

  public async setPassword(npub: string, passphrase: string, existingPassphrase?: string) {
    return this.call('setPassword', [], npub, passphrase, existingPassphrase)
  }

  public async importKey(name: string, nsec: string, passphrase: string) {
    return this.call<KeyInfo>('importKey', [], name, nsec, passphrase)
  }

  public async importKeyIframe(nsec: string, appNpub: string) {
    return this.call<KeyInfo>('importKeyIframe', [], nsec, appNpub)
  }

  public async fetchKey(npub: string, passphrase: string, name: string) {
    return this.call<KeyInfo>('fetchKey', [], npub, passphrase, name)
  }

  public async exportKey(npub: string) {
    return this.call<string>('exportKey', [], npub)
  }

  public async generateKey(name: string, passphrase: string) {
    return this.call<KeyInfo>('generateKey', [], name, passphrase)
  }

  public async nostrConnect(npub: string, nostrconnect: string, options: any) {
    return this.call<string>('nostrConnect', [], npub, nostrconnect, options)
  }

  public async generateKeyConnect(params: CreateConnectParams) {
    const transfer = params.port ? [params.port] : []
    return this.call<string>('generateKeyConnect', transfer, params)
  }

  public async nip04Decrypt(npub: string, peerPubkey: string, ciphertext: string) {
    return this.call<string>('nip04Decrypt', [], npub, peerPubkey, ciphertext)
  }

  public async nip44Decrypt(npub: string, peerPubkey: string, ciphertext: string) {
    return this.call<string>('nip44Decrypt', [], npub, peerPubkey, ciphertext)
  }

  public async rebind(npub: string, appNpub: string, port: MessagePort) {
    const transfer = [port]
    return this.call<void>('rebind', transfer, npub, appNpub, port)
  }

  public async registerIframeWorker(port: MessagePort) {
    const transfer = [port]
    return this.call<void>('registerIframeWorker', transfer, port)
  }

  public async waitKey(npub: string) {
    return this.call<void>('waitKey', [], npub)
  }

  public async ping() {
    return this.call<void>('ping', [])
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

  public async checkEmailStatus(npub: string, email: string) {
    return this.call<boolean>('checkEmailStatus', [], npub, email)
  }

  public async checkName(name: string) {
    return this.call<string>('checkName', [], name)
  }

  public async confirmEmail(npub: string, email: string, code: string, passphrase: string) {
    return this.call('confirmEmail', [], npub, email, code, passphrase)
  }

  public async deleteKey(npub: string) {
    return this.call<void>('deleteKey', [], npub)
  }

  public async deleteKeyFromEnclave(npub: string, enclavePubkey: string) {
    return this.call<any>('deleteKeyFromEnclave', [], npub, enclavePubkey)
  }

  public async fetchKeyByEmail(email: string, passphrase: string) {
    return this.call<KeyInfo | undefined>('fetchKeyByEmail', [], email, passphrase)
  }

  public async generateKeyForEmail(name: string, email: string) {
    return this.call<KeyInfo>('generateKeyForEmail', [], name, email)
  }

  public async getKeyEnclaveInfo(npub: string) {
    return this.call<any>('getKeyEnclaveInfo', [], npub)
  }

  public async listEnclaves() {
    return this.call<Event[]>('listEnclaves', [])
  }

  public async setEmail(npub: string, email: string) {
    return this.call('setEmail', [], npub, email)
  }

  public async uploadKeyToEnclave(npub: string, enclavePubkey: string) {
    return this.call<any>('uploadKeyToEnclave', [], npub, enclavePubkey)
  }
}

export const nativeClient = new NativeClient()
