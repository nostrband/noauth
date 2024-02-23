import { Event, generatePrivateKey, getPublicKey, nip19, verifySignature } from 'nostr-tools'
import { DbApp, dbi, DbKey, DbPending, DbPerm } from './db'
import { Keys } from './keys'
import NDK, {
  NDKEvent,
  NDKNip46Backend,
  NDKPrivateKeySigner,
  NDKRelaySet,
  NDKSigner,
  NDKSubscription,
  NDKSubscriptionCacheUsage,
  NDKUser,
} from '@nostr-dev-kit/ndk'
import {
  NOAUTHD_URL,
  WEB_PUSH_PUBKEY,
  NIP46_RELAYS,
  MIN_POW,
  MAX_POW,
  KIND_RPC,
  DOMAIN,
  REQ_TTL,
  KIND_DATA,
  OUTBOX_RELAYS,
  BROADCAST_RELAY,
  APP_TAG,
} from '../utils/consts'
// import { Nip04 } from './nip04'
import { fetchNip05, getReqPerm, getShortenNpub, isPackagePerm } from '@/utils/helpers/helpers'
import { NostrPowEvent, minePow } from './pow'
import { encrypt as encryptNip49 } from './nip49'
//import { PrivateKeySigner } from './signer'

//const PERF_TEST = false

enum DECISION {
  ASK = '',
  ALLOW = 'allow',
  DISALLOW = 'disallow',
  IGNORE = 'ignore',
}

export interface KeyInfo {
  npub: string
  nip05?: string
  name?: string
  locked: boolean
}

interface Key {
  npub: string
  ndk: NDK
  backoff: number
  signer: NDKSigner
  backend: NDKNip46Backend
  watcher: Watcher
}

interface Pending {
  req: DbPending
  cb: (allow: DECISION, remember: boolean, options?: any) => void
  notified?: boolean
}

interface IAllowCallbackParams {
  backend: Nip46Backend
  npub: string
  id: string
  method: string
  remotePubkey: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: any
}

class Watcher {
  private ndk: NDK
  private signer: NDKSigner
  private onReply: (id: string) => void
  private sub?: NDKSubscription

  constructor(ndk: NDK, signer: NDKSigner, onReply: (id: string) => void) {
    this.ndk = ndk
    this.signer = signer
    this.onReply = onReply
  }

  async start() {
    this.sub = this.ndk.subscribe(
      {
        kinds: [KIND_RPC],
        authors: [(await this.signer.user()).pubkey],
        since: Math.floor(Date.now() / 1000 - 10),
      },
      {
        closeOnEose: false,
        cacheUsage: NDKSubscriptionCacheUsage.ONLY_RELAY,
      }
    )
    this.sub.on('event', async (e: NDKEvent) => {
      const peer = e.tags.find((t) => t.length >= 2 && t[0] === 'p')
      console.log('watcher got event', { e, peer })
      if (!peer) return
      const decryptedContent = await this.signer.decrypt(new NDKUser({ pubkey: peer[1] }), e.content)
      const parsedContent = JSON.parse(decryptedContent)
      const { id, method, params, result, error } = parsedContent
      console.log('watcher got', { peer, id, method, params, result, error })
      if (method || result === 'auth_url') return
      this.onReply(id)
    })
  }

  stop() {
    this.sub!.stop()
  }
}

class Nip46Backend extends NDKNip46Backend {
  private allowCb: (params: IAllowCallbackParams) => Promise<DECISION>
  private npub: string = ''

  public constructor(ndk: NDK, signer: NDKSigner, allowCb: (params: IAllowCallbackParams) => Promise<DECISION>) {
    super(ndk, signer, () => Promise.resolve(true))
    this.allowCb = allowCb
    signer.user().then((u) => (this.npub = nip19.npubEncode(u.pubkey)))
  }

  public async processEvent(event: NDKEvent) {
    this.handleIncomingEvent(event)
  }

  protected async handleIncomingEvent(event: NDKEvent) {
    const { id, method, params } = (await this.rpc.parseEvent(event)) as any
    const remotePubkey = event.pubkey
    let response: string | undefined

    this.debug('incoming event', { id, method, params })

    // validate signature explicitly
    if (!verifySignature(event.rawEvent() as Event)) {
      this.debug('invalid signature', event.rawEvent())
      return
    }

    const decision = await this.allowCb({
      backend: this,
      npub: this.npub,
      id,
      method,
      remotePubkey,
      params,
    })
    console.log(Date.now(), 'handle', { method, id, decision, remotePubkey, params })
    if (decision === DECISION.IGNORE) return

    const allow = decision === DECISION.ALLOW
    const strategy = this.handlers[method]
    if (allow) {
      if (strategy) {
        try {
          response = await strategy.handle(this, id, remotePubkey, params)
          console.log(Date.now(), 'req', id, 'method', method, 'result', response)
        } catch (e: any) {
          this.debug('error handling event', e, { id, method, params })
          this.rpc.sendResponse(id, remotePubkey, 'error', undefined, e.message)
        }
      } else {
        this.debug('unsupported method', { method, params })
      }
    }

    if (response) {
      this.debug(`sending response to ${remotePubkey}`, response)
      this.rpc.sendResponse(id, remotePubkey, response)
    } else {
      this.rpc.sendResponse(id, remotePubkey, 'error', undefined, 'Not authorized')
    }
  }
}

// class Nip04KeyHandlingStrategy implements IEventHandlingStrategy {
//   private privkey: string
//   private nip04 = new Nip04()

//   constructor(privkey: string) {
//     this.privkey = privkey
//   }

//   private async getKey(backend: NDKNip46Backend, id: string, remotePubkey: string, recipientPubkey: string) {
//     if (
//       !(await backend.pubkeyAllowed({
//         id,
//         pubkey: remotePubkey,
//         // @ts-ignore
//         method: 'get_nip04_key',
//         params: recipientPubkey,
//       }))
//     ) {
//       backend.debug(`get_nip04_key request from ${remotePubkey} rejected`)
//       return undefined
//     }

//     return Buffer.from(this.nip04.createKey(this.privkey, recipientPubkey)).toString('hex')
//   }

//   async handle(backend: NDKNip46Backend, id: string, remotePubkey: string, params: string[]) {
//     const [recipientPubkey] = params
//     return await this.getKey(backend, id, remotePubkey, recipientPubkey)
//   }
// }

// FIXME why  do we need it? Just to print
// class EventHandlingStrategyWrapper implements IEventHandlingStrategy {
//   readonly backend: NDKNip46Backend
//   readonly method: string
//   private body: IEventHandlingStrategy

//   constructor(
//     backend: NDKNip46Backend,
//     method: string,
//     body: IEventHandlingStrategy
//   ) {
//     this.backend = backend
//     this.method = method
//     this.body = body
//   }

//   async handle(
//     backend: NDKNip46Backend,
//     id: string,
//     remotePubkey: string,
//     params: string[]
//   ): Promise<string | undefined> {
//     return this.body.handle(backend, id, remotePubkey, params).then((r) => {
//       console.log(Date.now(), 'req', id, 'method', this.method, 'result', r)
//       return r
//     })
//   }
// }

export class NoauthBackend {
  readonly swg: ServiceWorkerGlobalScope
  private keysModule: Keys
  private enckeys: DbKey[] = []
  private keys: Key[] = []
  private perms: DbPerm[] = []
  private apps: DbApp[] = []
  private doneReqIds: string[] = []
  private confirmBuffer: Pending[] = []
  private accessBuffer: DbPending[] = []
  private notifCallback: (() => void) | null = null
  private pendingNpubEvents = new Map<string, NDKEvent[]>()
  private permSub?: NDKSubscription
  private ndk = new NDK({
    explicitRelayUrls: [...NIP46_RELAYS, ...OUTBOX_RELAYS, BROADCAST_RELAY],
    enableOutboxModel: false,
  })

  public constructor(swg: ServiceWorkerGlobalScope) {
    this.swg = swg
    this.keysModule = new Keys(swg.crypto.subtle)
    this.ndk.connect()

    const self = this
    swg.addEventListener('activate', (event) => {
      console.log('activate new sw worker')
      this.reloadUI()
    })

    swg.addEventListener('push', (event) => {
      console.log('got push', event)
      self.onPush(event)
      event.waitUntil(
        new Promise((ok: any) => {
          self.setNotifCallback(ok)
        })
      )
    })

    swg.addEventListener('message', (event) => {
      self.onMessage(event)
    })

    swg.addEventListener(
      'notificationclick',
      (event) => {
        event.notification.close()
        if (event.action.startsWith('allow:')) {
          self.confirm(event.action.split(':')[1], true, false)
        } else if (event.action.startsWith('allow-remember:')) {
          self.confirm(event.action.split(':')[1], true, true)
        } else if (event.action.startsWith('disallow:')) {
          self.confirm(event.action.split(':')[1], false, false)
        } else {
          event.waitUntil(
            self.swg.clients.matchAll({ type: 'window' }).then((clientList) => {
              console.log('clients', clientList.length)
              // FIXME find a client that has our
              // key page
              for (const client of clientList) {
                console.log('client', client.url)
                if (new URL(client.url).pathname === '/' && 'focus' in client) {
                  client.focus()
                  return
                }
              }

              // confirm screen url
              const req = event.notification.data.req
              console.log('req', req)
              // const url = `${self.swg.location.origin}/key/${req.npub}?confirm-connect=true&appNpub=${req.appNpub}&reqId=${req.id}`
              const url = `${self.swg.location.origin}/key/${req.npub}`
              self.swg.clients.openWindow(url)
            })
          )
        }
      },
      false // ???
    )
  }

  public async start() {
    this.enckeys = await dbi.listKeys()
    console.log('started encKeys', this.listKeys())
    this.perms = await dbi.listPerms()
    console.log('started perms', this.perms)
    this.apps = await dbi.listApps()
    console.log('started apps', this.apps)

    // drop old pending reqs
    const pending = await dbi.listPending()
    for (const p of pending) {
      if (p.timestamp < Date.now() - REQ_TTL) await dbi.removePending(p.id)
    }

    const sub = await this.swg.registration.pushManager.getSubscription()

    for (const k of this.enckeys) {
      await this.unlock(k.npub)

      // ensure we're subscribed on the server
      if (sub) await this.sendSubscriptionToServer(k.npub, sub)
    }

//    this.subscribeToAppPerms()
  }

  private async subscribeToAppPerms() {
    if (this.permSub) {
      this.permSub.stop()
      this.permSub.removeAllListeners()
      this.permSub = undefined
    }

    const authors = this.keys.map((k) => nip19.decode(k.npub).data as string)
    this.permSub = this.ndk.subscribe(
      {
        authors,
        kinds: [KIND_DATA],
        '#t': [APP_TAG],
        limit: 100,
      },
      {
        closeOnEose: false,
        cacheUsage: NDKSubscriptionCacheUsage.ONLY_RELAY,
      },
      NDKRelaySet.fromRelayUrls(OUTBOX_RELAYS, this.ndk),
      true // auto-start
    )
    this.permSub.on('event', async (e) => {
      const npub = nip19.npubEncode(e.pubkey)
      const key = this.keys.find((k) => k.npub === npub)
      if (!key) return

      // parse
      try {
        const payload = await key.signer.decrypt(new NDKUser({ pubkey: e.pubkey }), e.content)
        const data = JSON.parse(payload)
        console.log('Got app perm event', { e, data })
        // FIXME validate first!
        await this.mergeAppPerms(key, data)
      } catch (err) {
        console.log('Bad app perm event', e, err)
      }

      // notify UI
      this.updateUI()
    })
  }

  private async mergeAppPerms(key: Key, data: any) {
    let app = this.apps.find(a => a.appNpub === data.appNpub)
    const appFromData = (): DbApp => {
      return {
        npub: data.npub,
        appNpub: data.appNpub,
        name: data.name,
        icon: data.icon,
        url: data.url,
        // choose older creation timestamp
        timestamp: app ? Math.min(app.timestamp, data.timestamp) : data.timestamp,
        updateTimestamp: data.updateTimestamp
      }
    }
    if (!app) {
      // new app
      app = appFromData()
      console.log("New app from event", { data, app })
      await dbi.addApp(app)
    } else if (app.updateTimestamp < data.updateTimestamp) {
      // update existing app
      app = appFromData()
      await dbi.updateApp(app)
    } else {
      // old data
      console.log("skip old app perms", { data, app })
    }

    // FIXME merge perms
  }

  public setNotifCallback(cb: () => void) {
    if (this.notifCallback) {
      // this.notify()
    }
    this.notifCallback = cb
  }

  public listKeys(): KeyInfo[] {
    return this.enckeys.map<KeyInfo>((k) => this.keyInfo(k))
  }

  public isLocked(npub: string): boolean {
    return !this.keys.find((k) => k.npub === npub)
  }

  public hasKey(npub: string): boolean {
    return !!this.enckeys.find((k) => k.npub === npub)
  }

  private async sha256(s: string) {
    return Buffer.from(await this.swg.crypto.subtle.digest('SHA-256', Buffer.from(s))).toString('hex')
  }

  private async fetchNpubName(npub: string) {
    const url = `${NOAUTHD_URL}/name?npub=${npub}`
    const r = await fetch(url)
    const d = await r.json()
    return d?.names?.length ? (d.names[0] as string) : ''
  }

  private async sendPost({ url, method, headers, body }: { url: string; method: string; headers: any; body: string }) {
    const r = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body,
    })
    if (r.status !== 200 && r.status !== 201) {
      console.log('Fetch error', url, method, r.status)
      const body = await r.json()
      throw new Error('Failed to fetch ' + url, { cause: { body, status: r.status } })
    }

    return await r.json()
  }

  private async sendPostAuthd({
    npub,
    url,
    method = 'GET',
    body = '',
    pow = 0,
  }: {
    npub: string
    url: string
    method: string
    body: string
    pow?: number
  }) {
    const { data: pubkey } = nip19.decode(npub)

    const key = this.keys.find((k) => k.npub === npub)
    if (!key) throw new Error('Unknown key')

    const authEvent = new NDKEvent(key.ndk, {
      pubkey: pubkey as string,
      kind: 27235,
      created_at: Math.floor(Date.now() / 1000),
      content: '',
      tags: [
        ['u', url],
        ['method', method],
      ],
    })
    if (body) authEvent.tags.push(['payload', await this.sha256(body)])

    // generate pow on auth evevnt
    if (pow) {
      const start = Date.now()
      const powEvent: NostrPowEvent = authEvent.rawEvent()
      const minedEvent = minePow(powEvent, pow)
      console.log('mined pow of', pow, 'in', Date.now() - start, 'ms', minedEvent)
      authEvent.tags = minedEvent.tags
    }

    authEvent.sig = await authEvent.sign(key.signer)

    const auth = this.swg.btoa(JSON.stringify(authEvent.rawEvent()))

    return await this.sendPost({
      url,
      method,
      headers: {
        Authorization: `Nostr ${auth}`,
      },
      body,
    })
  }

  private async sendSubscriptionToServer(npub: string, pushSubscription: PushSubscription) {
    const body = JSON.stringify({
      npub,
      relays: NIP46_RELAYS,
      pushSubscription,
    })

    const method = 'POST'
    const url = `${NOAUTHD_URL}/subscribe`

    return this.sendPostAuthd({
      npub,
      url,
      method,
      body,
    })
  }

  private async sendKeyToServer(npub: string, enckey: string, pwh: string) {
    const body = JSON.stringify({
      npub,
      data: enckey,
      pwh,
    })

    const method = 'POST'
    const url = `${NOAUTHD_URL}/put`

    return this.sendPostAuthd({
      npub,
      url,
      method,
      body,
    })
  }

  private async fetchKeyFromServer(npub: string, pwh: string) {
    const body = JSON.stringify({
      npub,
      pwh,
    })

    const method = 'POST'
    const url = `${NOAUTHD_URL}/get`

    return await this.sendPost({
      url,
      method,
      headers: {},
      body,
    })
  }

  private async sendNameToServer(npub: string, name: string) {
    const body = JSON.stringify({
      npub,
      name,
    })

    const method = 'POST'
    const url = `${NOAUTHD_URL}/name`

    // mas pow should be 21 or something like that
    let pow = MIN_POW
    while (pow <= MAX_POW) {
      console.log('Try name', name, 'pow', pow)
      try {
        return await this.sendPostAuthd({
          npub,
          url,
          method,
          body,
          pow,
        })
      } catch (e: any) {
        console.log('error', e.cause)
        if (e.cause && e.cause.body && e.cause.body.minPow > pow) pow = e.cause.body.minPow
        else throw e
      }
    }
    throw new Error('Too many requests, retry later')
  }

  private async sendDeleteNameToServer(npub: string, name: string) {
    const body = JSON.stringify({
      npub,
      name,
    })

    const method = 'DELETE'
    const url = `${NOAUTHD_URL}/name`

    return this.sendPostAuthd({
      npub,
      url,
      method,
      body,
    })
  }

  private async sendTransferNameToServer(npub: string, name: string, newNpub: string) {
    const body = JSON.stringify({
      npub,
      name,
      newNpub,
    })

    const method = 'PUT'
    const url = `${NOAUTHD_URL}/name`

    return this.sendPostAuthd({
      npub,
      url,
      method,
      body,
    })
  }

  private async sendTokenToServer(npub: string, token: string) {
    const body = JSON.stringify({
      npub,
      token,
    })

    const method = 'POST'
    const url = `${NOAUTHD_URL}/created`

    return this.sendPostAuthd({
      npub,
      url,
      method,
      body,
    })
  }

  private notify() {
    // FIXME collect info from accessBuffer and confirmBuffer
    // and update the notifications

    for (const r of this.confirmBuffer) {
      if (r.notified) continue

      const key = this.keys.find((k) => k.npub === r.req.npub)
      if (!key) continue

      const app = this.apps.find((a) => a.appNpub === r.req.appNpub)
      if (r.req.method !== 'connect' && !app) continue

      // FIXME check
      const icon = 'assets/icons/logo.svg'

      const appName = app?.name || getShortenNpub(r.req.appNpub)
      // FIXME load profile?
      const keyName = getShortenNpub(r.req.npub)

      const tag = 'confirm-' + r.req.appNpub
      const allowAction = 'allow:' + r.req.id
      const disallowAction = 'disallow:' + r.req.id
      const data = { req: r.req }

      if (r.req.method === 'connect') {
        const title = `Connect with new app`
        const body = `Allow app "${appName}" to connect to key "${keyName}"`
        this.swg.registration.showNotification(title, {
          body,
          tag,
          icon,
          data,
          actions: [
            {
              action: allowAction,
              title: 'Connect',
            },
            {
              action: disallowAction,
              title: 'Ignore',
            },
          ],
        })
      } else {
        const title = `Permission request`
        const body = `Allow "${r.req.method}" by "${appName}" to "${keyName}"`
        this.swg.registration.showNotification(title, {
          body,
          tag,
          icon,
          data,
          actions: [
            {
              action: allowAction,
              title: 'Yes',
            },
            {
              action: disallowAction,
              title: 'No',
            },
          ],
        })
      }

      // mark
      r.notified = true
    }

    if (this.notifCallback) this.notifCallback()
    this.notifCallback = null
  }

  private keyInfo(k: DbKey): KeyInfo {
    return {
      npub: k.npub,
      nip05: k.nip05,
      name: k.name,
      locked: this.isLocked(k.npub),
    }
  }

  private async generateGoodKey(): Promise<string> {
    return generatePrivateKey()
  }

  public async addKey({
    name,
    nsec,
    existingName,
    passphrase
  }: {
    name: string
    nsec?: string
    existingName?: boolean
    passphrase?: string
  }): Promise<KeyInfo> {
    // lowercase
    name = name.trim().toLocaleLowerCase()

    let sk = ''
    if (nsec) {
      const { type, data } = nip19.decode(nsec)
      if (type !== 'nsec') throw new Error('Bad nsec')
      sk = data
    } else {
      sk = await this.generateGoodKey()
    }
    const pubkey = getPublicKey(sk)
    const npub = nip19.npubEncode(pubkey)

    const localKey = await this.keysModule.generateLocalKey()
    const enckey = await this.keysModule.encryptKeyLocal(sk, localKey)

    // @ts-ignore
    const dbKey: DbKey = { npub, name, enckey, localKey }

    // nip49
    if (passphrase)
      dbKey.ncryptsec = encryptNip49(Buffer.from(sk, 'hex'), passphrase, 16, nsec ? 0x01 : 0x00)

    // FIXME this is all one big complex TX and if something fails
    // we have to gracefully proceed somehow

    await dbi.addKey(dbKey)
    this.enckeys.push(dbKey)
    await this.startKey({ npub, sk })

    if (passphrase)
      await this.saveKey(npub, passphrase)

    // assign nip05 before adding the key
    if (!existingName && name && !name.includes('@')) {
      console.log('adding key', npub, name)
      try {
        await this.sendNameToServer(npub, name)
      } catch (e) {
        console.log('create name failed', e)
        // clear it
        await dbi.editName(npub, '')
        dbKey.name = ''
      }
    }

    const sub = await this.swg.registration.pushManager.getSubscription()
    if (sub) await this.sendSubscriptionToServer(npub, sub)

    return this.keyInfo(dbKey)
  }

  private getDecision(backend: Nip46Backend, req: DbPending): DECISION {
    if (!(req.method in backend.handlers)) return DECISION.IGNORE

    const reqPerm = getReqPerm(req)
    const appPerms = this.perms.filter((p) => p.npub === req.npub && p.appNpub === req.appNpub)

    // exact match first
    let perm = appPerms.find((p) => p.perm === reqPerm)
    // non-exact next
    if (!perm) perm = appPerms.find((p) => isPackagePerm(p.perm, reqPerm))

    if (perm) {
      console.log('req', req, 'perm', reqPerm, 'value', perm, appPerms)
      // connect reqs are always 'ignore' if were disallowed
      if (perm.perm === 'connect' && perm.value === '0') return DECISION.IGNORE

      // all other reqs are not ignored
      return perm.value === '1' ? DECISION.ALLOW : DECISION.DISALLOW
    }

    const conn = appPerms.find((p) => p.perm === 'connect')
    if (conn && conn.value === '0') {
      console.log('req', req, 'perm', reqPerm, 'ignore by connect disallow')
      return DECISION.IGNORE
    }

    return DECISION.ASK
  }

  private async publishAppPerms({ npub, appNpub }: { npub: string; appNpub: string }) {
    const key = this.keys.find((k) => k.npub === npub)
    if (!key) throw new Error('Key not found')
    const app = this.apps.find((a) => a.appNpub === appNpub && a.npub === npub)
    if (!app) throw new Error('App not found')
    const perms = this.perms.filter((p) => p.appNpub === appNpub && p.npub === npub)
    const data = {
      appNpub,
      npub,
      name: app.name,
      icon: app.icon,
      url: app.url,
      timestamp: app.timestamp,
      updateTimestamp: app.updateTimestamp,
      perms,
    }
    const id = await this.sha256(`nsec.app_${npub}_${appNpub}`)
    const { type, data: pubkey } = nip19.decode(npub)
    if (type !== 'npub') throw new Error('Bad npub')
    const content = await key.signer.encrypt(new NDKUser({ pubkey }), JSON.stringify(data))
    const event = new NDKEvent(this.ndk, {
      pubkey,
      kind: KIND_DATA,
      content,
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['d', id],
        ['t', APP_TAG],
      ],
    })
    event.sig = await event.sign(key.signer)
    console.log('app perms event', event.rawEvent(), 'payload', data)
    const relays = await event.publish(NDKRelaySet.fromRelayUrls([...OUTBOX_RELAYS, BROADCAST_RELAY], this.ndk))
    console.log('app perm event published', event.id, 'to', relays)
  }

  private async connectApp({
    npub,
    appNpub,
    appUrl,
    perms,
    appName = '',
    appIcon = '',
  }: {
    npub: string
    appNpub: string
    appUrl: string
    appName?: string
    appIcon?: string
    perms: string[]
  }) {
    await dbi.addApp({
      appNpub: appNpub,
      npub: npub,
      timestamp: Date.now(),
      name: appName,
      icon: appIcon,
      url: appUrl,
      updateTimestamp: Date.now()
    })

    // reload
    this.apps = await dbi.listApps()

    // write new perms confirmed by user
    for (const p of perms) {
      await dbi.addPerm({
        id: Math.random().toString(36).substring(7),
        npub: npub,
        appNpub: appNpub,
        perm: p,
        value: '1',
        timestamp: Date.now(),
      })
    }

    // reload
    this.perms = await dbi.listPerms()

    // async
    this.publishAppPerms({ npub, appNpub })
  }

  private async allowPermitCallback({
    backend,
    npub,
    id,
    method,
    remotePubkey,
    params,
  }: IAllowCallbackParams): Promise<DECISION> {
    // same reqs usually come on reconnects
    if (this.doneReqIds.includes(id)) {
      console.log('request already done', id)
      // FIXME maybe repeat the reply, but without the Notification?
      return DECISION.IGNORE
    }

    const appNpub = nip19.npubEncode(remotePubkey)
    const connected = !!this.apps.find((a) => a.appNpub === appNpub)
    if (!connected && method !== 'connect') {
      console.log('ignoring request before connect', method, id, appNpub, npub)
      return DECISION.IGNORE
    }

    const req: DbPending = {
      id,
      npub,
      appNpub,
      method,
      params: JSON.stringify(params),
      timestamp: Date.now(),
    }

    const self = this
    return new Promise(async (ok) => {
      // called when it's decided whether to allow this or not
      const onAllow = async (manual: boolean, decision: DECISION, remember: boolean, options?: any) => {
        // confirm
        console.log(Date.now(), decision, npub, method, options, params)

        switch (decision) {
          case DECISION.ASK:
            throw new Error('Make a decision!')
          case DECISION.IGNORE:
            return // noop
          case DECISION.ALLOW:
          case DECISION.DISALLOW:
          // fall through
        }

        const allow = decision === DECISION.ALLOW

        if (manual) {
          await dbi.confirmPending(id, allow)

          // add app on 'allow connect'
          if (method === 'connect' && allow) {
            // if (!(await dbi.getApp(req.appNpub))) {
            await dbi.addApp({
              appNpub: req.appNpub,
              npub: req.npub,
              timestamp: Date.now(),
              name: '',
              icon: '',
              url: options.appUrl || '',
              updateTimestamp: Date.now()
            })

            // reload
            self.apps = await dbi.listApps()
          }
        } else {
          // just send to db w/o waiting for it
          dbi.addConfirmed({
            ...req,
            allowed: allow,
          })
        }

        // for notifications
        self.accessBuffer.push(req)

        // clear from pending
        const index = self.confirmBuffer.findIndex((r) => r.req.id === id)
        if (index >= 0) self.confirmBuffer.splice(index, 1)

        if (remember) {
          let newPerms = [getReqPerm(req)]
          if (allow && options && options.perms) newPerms = options.perms

          // write new perms confirmed by user
          for (const p of newPerms) {
            await dbi.addPerm({
              id: req.id,
              npub: req.npub,
              appNpub: req.appNpub,
              perm: p,
              value: allow ? '1' : '0',
              timestamp: Date.now(),
            })
          }

          // reload
          this.perms = await dbi.listPerms()
        }

        // release this promise to send reply
        // to this req
        ok(decision)

        // async
        this.publishAppPerms({ npub: req.npub, appNpub: req.appNpub })

        // notify UI that it was confirmed
        // if (!PERF_TEST)
        this.updateUI()

        // after replying to this req check pending
        // reqs maybe they can be replied right away
        if (remember) {
          // confirm pending requests that might now have
          // the proper perms
          const otherReqs = self.confirmBuffer.filter((r) => r.req.appNpub === req.appNpub)
          console.log('updated perms', this.perms, 'otherReqs', otherReqs, 'connected', connected)
          for (const r of otherReqs) {
            const dec = this.getDecision(backend, r.req)
            if (dec !== DECISION.ASK) {
              r.cb(dec, false)
            }
          }
        }
      }

      // check perms
      const dec = this.getDecision(backend, req)
      console.log(Date.now(), 'decision', req.id, dec)

      // have perm?
      if (dec !== DECISION.ASK) {
        // reply immediately
        onAllow(false, dec, false)
      } else {
        // put pending req to db
        await dbi.addPending(req)

        // need manual confirmation
        console.log('need confirm', req)

        // put to a list of pending requests
        this.confirmBuffer.push({
          req,
          cb: (decision, remember, options) => onAllow(true, decision, remember, options),
        })

        // OAuth flow
        const isConnect = method === 'connect'
        const confirmMethod = isConnect ? 'confirm-connect' : 'confirm-event'
        const authUrl = `${self.swg.location.origin}/key/${npub}?${confirmMethod}=true&appNpub=${appNpub}&reqId=${id}&popup=true`
        console.log('sending authUrl', authUrl, 'for', req)

        // NOTE: don't send auth_url immediately, wait some time
        // to make sure other bunkers aren't replying
        setTimeout(() => {
          // request still there? (not dropped by the watcher)
          if (self.confirmBuffer.find((r) => r.req.id === id)) {
            // NOTE: if you set 'Update on reload' in the Chrome SW console
            // then this message will cause a new tab opened by the peer,
            // which will cause SW (this code) to reload, to fetch
            // the pending requests and to re-send this event,
            // looping for 10 seconds (our request age threshold)
            backend.rpc.sendResponse(id, remotePubkey, 'auth_url', KIND_RPC, authUrl)
          } else {
            console.log('skip sending auth_url')
          }
        }, 500)

        // show notifs
        // this.notify()

        // notify main thread to ask for user concent
        this.updateUI()
      }
    })
  }

  private async startKey({ npub, sk, backoff = 1000 }: { npub: string; sk: string; backoff?: number }) {
    const ndk = new NDK({
      explicitRelayUrls: NIP46_RELAYS,
    })

    // init relay objects but dont wait until we connect
    ndk.connect()

    const signer = new NDKPrivateKeySigner(sk) // PrivateKeySigner
    const backend = new Nip46Backend(ndk, signer, this.allowPermitCallback.bind(this)) // , () => Promise.resolve(true)
    const watcher = new Watcher(ndk, signer, (id) => {
      // drop pending request
      const index = self.confirmBuffer.findIndex((r) => r.req.id === id)
      if (index >= 0) self.confirmBuffer.splice(index, 1)
      dbi.removePending(id).then(() => this.updateUI())
    })
    this.keys.push({ npub, backend, signer, ndk, backoff, watcher })

    // new method
    // backend.handlers['get_nip04_key'] = new Nip04KeyHandlingStrategy(sk)

    // // assign our own permission callback
    // for (const method in backend.handlers) {
    //   backend.handlers[method] = new EventHandlingStrategyWrapper(
    //     backend,
    //     method,
    //     backend.handlers[method]
    //   )
    // }

    // start
    backend.start()
    watcher.start()
    console.log('started', npub)

    // backoff reset on successfull connection
    const self = this
    const onConnect = () => {
      // reset backoff
      const key = self.keys.find((k) => k.npub === npub)
      if (key) key.backoff = 0
      console.log('reset backoff for', npub)
    }

    // reconnect handling
    let reconnected = false
    const onDisconnect = () => {
      if (reconnected) return
      if (ndk.pool.connectedRelays().length > 0) return
      reconnected = true
      console.log(new Date(), 'all relays are down for key', npub)

      // run full restart after a pause
      const bo = self.keys.find((k) => k.npub === npub)?.backoff || 1000
      setTimeout(() => {
        console.log(new Date(), 'reconnect relays for key', npub, 'backoff', bo)
        for (const r of ndk.pool.relays.values()) r.disconnect()
        // make sure it no longer activates
        backend.handlers = {}

        // stop watching
        watcher.stop()

        self.keys = self.keys.filter((k) => k.npub !== npub)
        self.startKey({ npub, sk, backoff: Math.min(bo * 2, 60000) })
      }, bo)
    }

    // @ts-ignore
    for (const r of ndk.pool.relays.values()) {
      r.on('connect', onConnect)
      r.on('disconnect', onDisconnect)
    }

    const pendingEvents = this.pendingNpubEvents.get(npub)
    if (pendingEvents) {
      this.pendingNpubEvents.delete(npub)
      for (const e of pendingEvents) {
        backend.processEvent(e)
      }
    }
  }

  private async fetchPendingRequests(npub: string, appNpub: string) {
    const { data: pubkey } = nip19.decode(npub)
    const { data: appPubkey } = nip19.decode(appNpub)

    const events = await this.ndk.fetchEvents(
      {
        kinds: [KIND_RPC],
        '#p': [pubkey as string],
        authors: [appPubkey as string],
      },
      undefined,
      NDKRelaySet.fromRelayUrls(NIP46_RELAYS, this.ndk)
    )
    console.log('fetched pending for', npub, events.size)
    this.pendingNpubEvents.set(npub, [...events.values()])
  }

  public async unlock(npub: string) {
    console.log('unlocking', npub)
    if (!this.isLocked(npub)) throw new Error(`Key ${npub} already unlocked`)
    const info = this.enckeys.find((k) => k.npub === npub)
    if (!info) throw new Error(`Key ${npub} not found`)
    const { type } = nip19.decode(npub)
    if (type !== 'npub') throw new Error(`Invalid npub ${npub}`)
    const sk = await this.keysModule.decryptKeyLocal({
      enckey: info.enckey,
      // @ts-ignore
      localKey: info.localKey,
    })
    await this.startKey({ npub, sk })
  }

  private async generateKey(name: string, passphrase: string) {
    const k = await this.addKey({ name, passphrase })
    this.updateUI()
    return k
  }

  private async redeemToken(npub: string, token: string) {
    console.log('redeeming token', npub, token)
    await this.sendTokenToServer(npub, token)
  }

  private async importKey(name: string, nsec: string, passphrase: string) {
    const k = await this.addKey({ name, nsec, passphrase })
    this.updateUI()
    return k
  }

  private async saveKey(npub: string, passphrase: string) {
    const info = this.enckeys.find((k) => k.npub === npub)
    if (!info) throw new Error(`Key ${npub} not found`)
    const sk = await this.keysModule.decryptKeyLocal({
      enckey: info.enckey,
      // @ts-ignore
      localKey: info.localKey,
    })
    const { enckey, pwh } = await this.keysModule.encryptKeyPass({
      key: sk,
      passphrase,
    })
    await this.sendKeyToServer(npub, enckey, pwh)
  }

  private async fetchKey(npub: string, passphrase: string, nip05: string) {
    const { type, data: pubkey } = nip19.decode(npub)
    if (type !== 'npub') throw new Error(`Invalid npub ${npub}`)
    const { pwh } = await this.keysModule.generatePassKey(pubkey, passphrase)
    const { data: enckey } = await this.fetchKeyFromServer(npub, pwh)

    // key already exists?
    const key = this.enckeys.find((k) => k.npub === npub)
    if (key) return this.keyInfo(key)

    let name = ''
    let existingName = true
    // check name - user might have provided external nip05,
    // or just his npub - we must fetch their name from our
    // server, and if not exists - try to assign one
    const npubName = await this.fetchNpubName(npub)
    if (npubName) {
      // already have name for this npub
      console.log('existing npub name', npub, npubName)
      name = npubName
    } else if (nip05.includes('@')) {
      // no name for them?
      const [nip05name, domain] = nip05.split('@')
      if (domain === DOMAIN) {
        // wtf? how did we learn their npub if
        // it's the name on our server but we can't fetch it?
        console.log('existing name', nip05name)
        name = nip05name
      } else {
        // try to take same name on our domain
        existingName = false
        name = nip05name
        let takenName = await fetchNip05(`${name}@${DOMAIN}`)
        if (takenName) {
          // already taken? try name_domain as name
          name = `${nip05name}_${domain}`
          takenName = await fetchNip05(`${name}@${DOMAIN}`)
        }
        if (takenName) {
          console.log('All names taken, leave without a name?')
          name = ''
        }
      }
    }

    console.log('fetch', { name, existingName })

    // add new key
    const nsec = await this.keysModule.decryptKeyPass({
      pubkey,
      enckey,
      passphrase,
    })
    const k = await this.addKey({ name, nsec, existingName, passphrase })
    this.updateUI()
    return k
  }

  private async confirm(id: string, allow: boolean, remember: boolean, options?: any) {
    const req = this.confirmBuffer.find((r) => r.req.id === id)
    if (!req) {
      console.log('req ', id, 'not found')

      await dbi.removePending(id)
      this.updateUI()
    } else {
      console.log('confirming req', id, allow, remember, options)
      req.cb(allow ? DECISION.ALLOW : DECISION.DISALLOW, remember, options)
    }
  }

  private async deleteApp(appNpub: string) {
    this.apps = this.apps.filter((a) => a.appNpub !== appNpub)
    this.perms = this.perms.filter((p) => p.appNpub !== appNpub)
    await dbi.removeApp(appNpub)
    await dbi.removeAppPerms(appNpub)
    this.updateUI()
  }

  private async deletePerm(id: string) {
    this.perms = this.perms.filter((p) => p.id !== id)
    await dbi.removePerm(id)
    this.updateUI()
  }

  private async editName(npub: string, name: string) {
    const key = this.enckeys.find((k) => k.npub === npub)
    if (!key) throw new Error('Npub not found')
    if (key.name) {
      try {
        await this.sendDeleteNameToServer(npub, key.name)
      } catch (e: any) {
        if (e.cause && e.cause.status !== 404) throw e
        console.log("Deleted name didn't exist")
      }
    }
    if (name) {
      await this.sendNameToServer(npub, name)
    }
    await dbi.editName(npub, name)
    key.name = name
    this.updateUI()
  }

  private async transferName(npub: string, name: string, newNpub: string) {
    const key = this.enckeys.find((k) => k.npub === npub)
    if (!key) throw new Error('Npub not found')
    if (!name) throw new Error('Empty name')
    if (key.name !== name) throw new Error('Name changed, please reload')
    await this.sendTransferNameToServer(npub, key.name, newNpub)
    await dbi.editName(npub, '')
    key.name = ''
    this.updateUI()
  }

  private async enablePush(): Promise<boolean> {
    const options = {
      userVisibleOnly: true,
      applicationServerKey: WEB_PUSH_PUBKEY,
    }

    const pushSubscription = await this.swg.registration.pushManager.subscribe(options)
    console.log('push endpoint', JSON.stringify(pushSubscription))

    if (!pushSubscription) {
      console.log('failed to enable push subscription')
      return false
    }

    // subscribe to all pubkeys
    for (const k of this.keys) {
      await this.sendSubscriptionToServer(k.npub, pushSubscription)
    }
    console.log('push enabled')

    return true
  }

  private async exportKey(npub: string): Promise<string> {
    const dbKey = await dbi.getKey(npub)
    if (!dbKey) throw new Error("Key not found")
    return dbKey.ncryptsec || ''
  }

  public async onMessage(event: any) {
    const { id, method, args } = event.data
    try {
      //console.log("UI message", id, method, args)
      let result = undefined
      if (method === 'generateKey') {
        result = await this.generateKey(args[0], args[1])
      } else if (method === 'redeemToken') {
        result = await this.redeemToken(args[0], args[1])
      } else if (method === 'importKey') {
        result = await this.importKey(args[0], args[1], args[2])
      } else if (method === 'saveKey') {
        result = await this.saveKey(args[0], args[1])
      } else if (method === 'fetchKey') {
        result = await this.fetchKey(args[0], args[1], args[2])
      } else if (method === 'confirm') {
        result = await this.confirm(args[0], args[1], args[2], args[3])
      } else if (method === 'connectApp') {
        result = await this.connectApp(args[0])
      } else if (method === 'deleteApp') {
        result = await this.deleteApp(args[0])
      } else if (method === 'deletePerm') {
        result = await this.deletePerm(args[0])
      } else if (method === 'editName') {
        result = await this.editName(args[0], args[1])
      } else if (method === 'transferName') {
        result = await this.transferName(args[0], args[1], args[2])
      } else if (method === 'enablePush') {
        result = await this.enablePush()
      } else if (method === 'fetchPendingRequests') {
        result = await this.fetchPendingRequests(args[0], args[1])
      } else if (method === 'exportKey') {
        result = await this.exportKey(args[0])
      } else {
        console.log('unknown method from UI ', method)
      }
      event.source.postMessage({
        id,
        result,
      })
    } catch (e: any) {
      console.log('backend error', e)
      event.source.postMessage({
        id,
        error: e.toString(),
      })
    }
  }

  private async updateUI() {
    const clients = await this.swg.clients.matchAll({
      includeUncontrolled: true,
    })
    console.log('updateUI clients', clients.length)
    for (const client of clients) {
      client.postMessage({})
    }
  }

  private async reloadUI() {
    const clients = await this.swg.clients.matchAll({
      includeUncontrolled: true,
    })
    console.log('reloadUI clients', clients.length)
    for (const client of clients) {
      client.postMessage({ result: 'reload' })
    }
  }

  public async onPush(event: any) {
    console.log('push', { data: event.data })
    // noop - we just need browser to launch this worker
    // FIXME use event.waitUntil and and unblock after we
    // show a notification to avoid annoying the browser
  }
}
