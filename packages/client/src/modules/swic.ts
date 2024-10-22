// service-worker client interface,
// works on the frontend, not sw
import * as serviceWorkerRegistration from '../serviceWorkerRegistration'
import { KeyInfo, CreateConnectParams } from '@noauth/backend'
import { DbApp, DbConnectToken } from '@noauth/common'
import { dbi } from '@noauth/common/dist/dbi-client'
import { AllowType, BackendClient, BackendReply } from './client'
import { NostrEvent } from '@nostr-dev-kit/ndk'

export let swr: ServiceWorkerRegistration | null = null

// eslint-disable-next-line
class ClientServiceWorker implements BackendClient {
  private reqs = new Map<number, { ok: (r: any) => void; rej: (r: any) => void }>()
  private nextReqId = 1
  private onRender: (() => void) | null = null
  private onReload: (() => void) | null = null
  private onClose: (() => void) | null = null
  private queue: (() => Promise<void> | void)[] = []
  private checkpointQueue: (() => Promise<void> | void)[] = []

  public async connect(): Promise<boolean> {
    await navigator.serviceWorker.ready
    return true;
  }

  public async onStarted() {
    console.log('sw ready, queue', this.queue.length)
    while (this.queue.length) await this.queue.shift()!()
  }

  private callWhenStarted(cb: () => void) {
    if (swr && swr.active) cb()
    else this.queue.push(cb)
  }

  private async waitStarted() {
    return new Promise<void>((ok) => this.callWhenStarted(ok))
  }

  // send an RPC to the backend
  private async call<T = void>(method: string, transfer: any[], ...args: any[]): Promise<T> {
    await this.waitStarted()

    const id = this.nextReqId
    this.nextReqId++

    return new Promise((ok, rej) => {
      const call = async () => {
        if (!swr || !swr.active) {
          rej(new Error('No active service worker'))
          return
        }

        this.reqs.set(id, { ok, rej })
        const msg = {
          id,
          method,
          args: [...args],
        }
        // don't print this one
        if (method !== 'importKeyIframe') console.log('sending to SW', msg)
        swr.active.postMessage(msg, transfer)
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

  public onMessage(data: BackendReply) {
    const { id, result, error } = data
    console.log('SW message', id, result, error)

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

  public async processRequest(request: NostrEvent) {
    return this.call<NostrEvent>('processRequest', [], request)
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

export const clientServiceWorker = new ClientServiceWorker()

export async function swicRegister() {
  serviceWorkerRegistration.register({
    onSuccess(registration) {
      console.log('sw registered')
      swr = registration
    },
    onError(e) {
      console.log('sw error', e)
    },
    onUpdate() {
      // tell new SW that it should activate immediately
      swr?.waiting?.postMessage({ type: 'SKIP_WAITING' })
    },
  })
  navigator.serviceWorker.ready.then(async (r) => {
    swr = r
    if (navigator.serviceWorker.controller) {
      console.log(`This page is currently controlled by: ${navigator.serviceWorker.controller}`)
    } else {
      console.log('This page is not currently controlled by a service worker.')
    }
    clientServiceWorker.onStarted()
  })
  navigator.serviceWorker.addEventListener('message', (event) => {
    clientServiceWorker.onMessage((event as MessageEvent).data)
  })
}
