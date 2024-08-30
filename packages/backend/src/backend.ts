import { generatePrivateKey, getPublicKey, nip19 } from 'nostr-tools'
import {
  DbApp,
  DbConnectToken,
  DbKey,
  DbPending,
  DbPerm,
  Keys,
  fetchNip05,
  getReqPerm,
  isPackagePerm,
  packageToPerms,
  ACTION_TYPE,
  BROADCAST_RELAY,
  KIND_DATA,
  KIND_RPC,
  OUTBOX_RELAYS,
  REQ_TTL,
  SEED_RELAYS,
  getShortenNpub,
  DbInterface,
} from '@noauth/common'
import NDK, {
  NDKEvent,
  NDKNip46Backend,
  NDKRelaySet,
  NDKSubscription,
  NDKSubscriptionCacheUsage,
  NDKUser,
} from '@nostr-dev-kit/ndk'
import { encrypt as encryptNip49, decrypt as decryptNip49 } from './nip49'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils'
import { sha256 } from '@noble/hashes/sha256'
import { EventEmitter } from 'tseep'
import { Watcher } from './watcher'
import { BackendRequest, CreateConnectParams, DECISION, IAllowCallbackParams, Key, KeyInfo } from './types'
import { Nip46Backend } from './nip46'
import { Api } from './api'
import { PrivateKeySigner } from './signer'
import { randomBytes } from 'crypto'
import { GlobalContext } from './global'
import { APP_TAG, TOKEN_SIZE, TOKEN_TTL } from './const'

interface Pending {
  req: DbPending
  cb: (allow: DECISION, remember: boolean, options?: any) => Promise<string | undefined>
  notified?: boolean
}

export class NoauthBackend extends EventEmitter {
  readonly global: GlobalContext
  private keysModule: Keys
  private ndk: NDK
  private api: Api

  private enckeys: DbKey[] = []
  private keys: Key[] = []
  private perms: DbPerm[] = []
  private apps: DbApp[] = []
  private connectTokens: DbConnectToken[] = []
  private doneReqIds: string[] = []
  protected confirmBuffer: Pending[] = []
  private accessBuffer: DbPending[] = []
  private pendingNpubEvents = new Map<string, NDKEvent[]>()
  private permSub?: NDKSubscription
  private pushNpubs: string[] = []

  private dbi: DbInterface

  public constructor(global: GlobalContext, api: Api, dbi: DbInterface) {
    super()
    this.global = global
    this.api = api
    this.keysModule = new Keys(global.getCryptoSubtle())
    this.dbi = dbi
    // global ndk is needed to pre-fetch pending requests while we haven't
    // yet unlocked a key and created a separate ndk for it

    this.ndk = new NDK({
      explicitRelayUrls: [...global.getNip46Relays(), ...OUTBOX_RELAYS, BROADCAST_RELAY],
      enableOutboxModel: false,
    })

    this.ndk.connect()
  }

  public async start() {
    console.log(Date.now(), 'starting')
    this.enckeys = await this.dbi.listKeys()
    console.log('started encKeys', this.listKeys())
    this.perms = await this.dbi.listPerms()
    console.log('started perms', this.perms)
    this.apps = await this.dbi.listApps()
    console.log('started apps', this.apps)

    const tokens = await this.dbi.listConnectTokens()
    for (const t of tokens) {
      if (t.timestamp < Date.now() - TOKEN_TTL) await this.dbi.removeConnectToken(t.token)
    }
    this.connectTokens = await this.dbi.listConnectTokens()
    console.log('started connect tokens', this.connectTokens)

    // drop old pending reqs
    const pending = await this.dbi.listPending()
    for (const p of pending) {
      if (p.timestamp < Date.now() - REQ_TTL) await this.dbi.removePending(p.id)
    }

    // start keys, only pushed ones, or all of them if
    // there was no push
    console.log('pushNpubs', JSON.stringify(this.pushNpubs))
    for (const k of this.enckeys) {
      if (!this.pushNpubs.length || this.pushNpubs.find((n) => n === k.npub)) {
        await this.unlock(k.npub)
        this.notifyNpub(k.npub)
      }
    }

    // pause to let SW processing pushed pubkey's incoming requests
    setTimeout(async () => {
      // unlock the rest of keys
      if (this.pushNpubs.length > 0) {
        for (const k of this.enckeys) {
          if (!this.pushNpubs.find((n) => n === k.npub)) await this.unlock(k.npub)
        }
      }

      // ensure we're subscribed on the server, re-create the
      // subscription endpoint if we have permissions granted
      await this.subscribeAllKeys()

      // sync app perms
      this.subscribeToAppPerms()
    }, 3000)

    this.emit(`start`)
    console.log(Date.now(), 'started')
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
    let count = 0
    this.permSub.on('event', async (e) => {
      count++
      const npub = nip19.npubEncode(e.pubkey)
      const key = this.keys.find((k) => k.npub === npub)
      if (!key) return

      // parse
      try {
        const payload = await key.signer.decrypt(new NDKUser({ pubkey: e.pubkey }), e.content)
        const data = JSON.parse(payload)
        console.log('Got app perm event', { e, data })
        // validate first
        if (this.isValidAppPerms(data)) await this.mergeAppPerms(data)
        else console.log('Skip invalid app perms', data)
      } catch (err) {
        console.log('Bad app perm event', e, err)
      }

      // notify UI
      this.updateUI()
    })

    // wait for eose before proceeding
    await new Promise((ok) => this.permSub!.on('eose', ok))

    console.log('processed app perm events', count)
  }

  private isValidAppPerms(d: any) {
    if (d.npub && d.appNpub && d.updateTimestamp && d.deleted) return true

    if (!d.npub || !d.appNpub || !d.timestamp || !d.updateTimestamp || !d.permUpdateTimestamp) return false

    for (const p of d.perms) {
      if (!p.id || !p.npub || !p.appNpub || !p.perm || !p.timestamp) return false
    }

    return true
  }

  private async updateAppPermTimestamp(appNpub: string, npub: string, timestamp = 0) {
    // write to db then update our cache
    const tm = await this.dbi.updateAppPermTimestamp(appNpub, npub, timestamp)
    const app = this.apps.find((a) => a.appNpub === appNpub && a.npub === npub)
    if (app) app.permUpdateTimestamp = tm
  }

  private async mergeAppPerms(data: any) {
    const app = this.apps.find((a) => a.appNpub === data.appNpub && a.npub === data.npub)

    const newAppInfo = !app || app.updateTimestamp < data.updateTimestamp
    const newPerms = !app || app.permUpdateTimestamp < data.permUpdateTimestamp

    const appFromData = (): DbApp => {
      return {
        npub: data.npub,
        appNpub: data.appNpub,
        name: data.name || '',
        icon: data.icon || '',
        url: data.url || '',
        userAgent: data.userAgent || '',
        token: data.token || '',
        // choose older creation timestamp
        timestamp: app ? Math.min(app.timestamp, data.timestamp) : data.timestamp,
        updateTimestamp: data.updateTimestamp,
        // choose newer perm update timestamp
        permUpdateTimestamp: app
          ? Math.min(app.permUpdateTimestamp, data.permUpdateTimestamp)
          : data.permUpdateTimestamp,
      }
    }
    if (!app && data.deleted) {
      // already deleted
      console.log('App already deleted', { data })
    } else if (!app) {
      // new app
      const newApp = appFromData()
      await this.dbi.addApp(newApp)
      console.log('New app from event', { data, newApp })
    } else if (newAppInfo) {
      // update existing app
      if (data.deleted) {
        await this.dbi.removeApp(data.appNpub, data.npub)
        await this.dbi.removeAppPerms(data.appNpub, data.npub)
        console.log('Delete app from event', { data })
      } else {
        const appUpdate = appFromData()
        await this.dbi.updateApp(appUpdate)
        console.log('Update app from event', { data, appUpdate })
      }
    } else {
      // old data
      console.log('Skip old app info from event', { data, app })
    }

    // merge perms
    // instead of doing diffs etc we could just assume that:
    // 1. peers publish updated events as soon as updates are made
    // 2. so each peer always has the latest info from other peers
    // 3. so we can just use the latest perms object
    // should be good enough for now, we just use perms with newest
    // update... hm but if we delete some perm then there's no
    // update timestamp! maybe we should just put permUpdateTimestamp
    // to the App object and update it on perm updates?
    // sounds fine and simple enough!
    if (newPerms && !data.deleted) {
      // drop all existing perms
      await this.dbi.removeAppPerms(data.appNpub, data.npub)

      // set timestamp from the peer
      await this.updateAppPermTimestamp(data.appNpub, data.npub, data.permUpdateTimestamp)

      // add all perms from peer
      for (const p of data.perms) {
        const perm = {
          id: p.id,
          npub: p.npub,
          appNpub: p.appNpub,
          perm: p.perm,
          value: p.value,
          timestamp: p.timestamp,
        }
        await this.dbi.addPerm(perm)
      }

      console.log('updated perms from data', data)
    }

    // reload from db
    this.perms = await this.dbi.listPerms()
    console.log('updated perms', this.perms)
    this.apps = await this.dbi.listApps()
    console.log('updated apps', this.apps)
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

  public getKey(npub: string) {
    const key = this.keys.find((k) => k.npub === npub)
    if (!key) throw new Error('Key not found')
    return key
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
    passphrase,
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
    if (passphrase) dbKey.ncryptsec = encryptNip49(hexToBytes(sk), passphrase, 16, nsec ? 0x01 : 0x00)

    // FIXME this is all one big complex TX and if something fails
    // we have to gracefully proceed somehow

    await this.dbi.addKey(dbKey)

    this.enckeys.push(dbKey)
    await this.startKey({ npub, sk })

    if (passphrase) await this.uploadKey(npub, passphrase)

    // assign nip05 before adding the key
    if (!existingName && name && !name.includes('@')) {
      console.log('adding key', npub, name)
      try {
        await this.api.sendNameToServer(npub, name)
      } catch (e) {
        console.log('create name failed', e)
        // clear it
        await this.dbi.editName(npub, '')
        dbKey.name = ''
      }
    }

    await this.subscribeNpub(npub)

    // async fetching of perms from relays
    this.subscribeToAppPerms()
    console.log('synched apps', npub)

    // seed new key with profile, relays etc
    if (!nsec) {
      this.publishNewKeyInfo(npub)
      console.log('published profile', npub)
    }

    return this.keyInfo(dbKey)
  }

  private async publishNewKeyInfo(npub: string) {
    const { type, data: pubkey } = nip19.decode(npub)
    if (type !== 'npub') throw new Error('Bad npub')

    const signer = this.keys.find((k) => k.npub === npub)?.signer
    const key = this.enckeys.find((k) => k.npub === npub)
    if (!key || !signer) throw new Error('Key not found')
    const name = key.name?.split('@')[0]
    const nip05 = name?.includes('@') ? name : `${name}@${this.global.getDomain()}`

    // profile
    const profile = new NDKEvent(this.ndk, {
      pubkey,
      kind: 0,
      content: JSON.stringify({
        name,
        nip05,
      }),
      tags: [],
      created_at: Math.floor(Date.now() / 1000),
    })
    profile.sig = await profile.sign(signer)

    // contact list
    const contacts = new NDKEvent(this.ndk, {
      pubkey,
      kind: 3,
      content: '',
      tags: [],
      created_at: Math.floor(Date.now() / 1000),
    })
    if (this.global.getNsecAppNpub()) {
      try {
        const { type, data: nsecAppNpub } = nip19.decode(this.global.getNsecAppNpub())
        if (type === 'npub') contacts.tags.push(['p', nsecAppNpub])
      } catch {}
    }
    const relays: any = {}
    for (const r of [...OUTBOX_RELAYS, ...SEED_RELAYS]) {
      relays[r] = { read: true, write: true }
    }
    contacts.content = JSON.stringify(relays)
    contacts.sig = await contacts.sign(signer)

    // nip65
    const nip65 = new NDKEvent(this.ndk, {
      pubkey,
      kind: 10002,
      content: '',
      tags: [],
      created_at: Math.floor(Date.now() / 1000),
    })
    for (const r of [...OUTBOX_RELAYS, ...SEED_RELAYS]) nip65.tags.push(['r', r])
    nip65.sig = await nip65.sign(signer)

    console.log('seed key events', { profile, contacts, nip65 })

    // publish in background
    const relayset = NDKRelaySet.fromRelayUrls([...OUTBOX_RELAYS, BROADCAST_RELAY], this.ndk)
    try {
      await profile.publish(relayset)
    } catch (e) {
      console.log('failed to publish profile', e)
    }
    try {
      await contacts.publish(relayset)
    } catch (e) {
      console.log('failed to publish contacts', e)
    }
    try {
      await nip65.publish(relayset)
    } catch (e) {
      console.log('failed to publish relays', e)
    }
  }

  private getDecision(backend: NDKNip46Backend, req: DbPending): DECISION {
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

  private async publishAppPerms({ npub, appNpub, deleted }: { npub: string; appNpub: string; deleted?: boolean }) {
    const key = this.keys.find((k) => k.npub === npub)
    if (!key) throw new Error('Key not found')
    const app = this.apps.find((a) => a.appNpub === appNpub && a.npub === npub)
    if (!app && !deleted) throw new Error('App not found')

    const id = bytesToHex(sha256(`nsec.app_${npub}_${appNpub}`))
    let data
    if (app) {
      const perms = this.perms.filter((p) => p.appNpub === appNpub && p.npub === npub)
      data = {
        appNpub,
        npub,
        name: app.name,
        icon: app.icon,
        url: app.url,
        timestamp: app.timestamp,
        updateTimestamp: app.updateTimestamp,
        permUpdateTimestamp: app.permUpdateTimestamp,
        userAgent: app.userAgent,
        token: app.token,
        perms,
      }
    } else {
      data = {
        appNpub,
        npub,
        updateTimestamp: Date.now(),
        deleted: true,
      }
    }
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
    // used by create_account flow after keys are generated

    await this.dbi.addApp({
      appNpub: appNpub,
      npub: npub,
      timestamp: Date.now(),
      name: appName,
      icon: appIcon,
      url: appUrl,
      updateTimestamp: Date.now(),
      permUpdateTimestamp: Date.now(),
      userAgent: globalThis?.navigator?.userAgent || '',
    })

    // reload
    this.apps = await this.dbi.listApps()

    // write new perms confirmed by user
    for (const p of perms) {
      await this.dbi.addPerm({
        id: Math.random().toString(36).substring(7),
        npub: npub,
        appNpub: appNpub,
        perm: p,
        value: '1',
        timestamp: Date.now(),
      })
    }

    // perm update timestamp
    await this.updateAppPermTimestamp(appNpub, npub)

    // reload
    this.perms = await this.dbi.listPerms()

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
    options: reqOptions,
  }: IAllowCallbackParams): Promise<[DECISION, ((result: string | undefined) => void) | undefined]> {
    // same reqs usually come on reconnects
    if (this.doneReqIds.includes(id)) {
      console.log('request already done', id)
      // FIXME maybe repeat the reply, but without the Notification?
      return [DECISION.IGNORE, undefined]
    }

    const appNpub = nip19.npubEncode(remotePubkey)
    const connected = !!this.apps.find((a) => a.appNpub === appNpub)
    if (!connected && method !== 'connect') {
      console.log('ignoring request before connect', method, id, appNpub, npub)
      return [DECISION.IGNORE, undefined]
    }

    // check token
    let subNpub: string | undefined = undefined
    if (method === 'connect') {
      if (params && params.length >= 2 && params[1]) {
        const secret = params[1]
        const token = this.connectTokens.find((t) => t.token === secret)
        if (!token || token.expiry < Date.now() || token.npub !== npub) {
          console.log('unknown token', secret)
          return [DECISION.IGNORE, undefined]
        }

        subNpub = token.subNpub
      }
    }

    const req: DbPending = {
      id,
      npub,
      appNpub,
      method,
      subNpub,
      params: JSON.stringify(params),
      timestamp: Date.now(),
    }
    if (reqOptions) {
      if (reqOptions.appUrl) req.appUrl = reqOptions.appUrl
      if (reqOptions.appName) req.appName = reqOptions.appName
      if (reqOptions.appIcon) req.appIcon = reqOptions.appIcon
    }

    const self = this
    return new Promise(async (ok) => {
      // called when it's decided whether to allow this or not
      const onAllow = async (
        manual: boolean,
        decision: DECISION,
        remember: boolean,
        options?: any,
        resultCb?: (result: string | undefined) => void
      ) => {
        // confirm
        console.log(Date.now(), decision, npub, method, options, params)

        // consume the token
        if (method === 'connect') {
          const token = params && params.length >= 2 ? params[1] : ''

          // consume the token even if app not allowed, reload
          console.log('consume connect token', token)
          if (token) {
            await this.dbi.removeConnectToken(token)
            self.connectTokens = await this.dbi.listConnectTokens()
          }
        }

        // decision enum handling for TS checks,
        // only ALLOW/DISALLOW fall through
        switch (decision) {
          case DECISION.ASK:
            throw new Error('Make a decision!')
          case DECISION.IGNORE:
            // don't store this any longer!
            if (manual) await this.dbi.removePending(id)
            return // noop
          case DECISION.ALLOW:
          case DECISION.DISALLOW:
          // fall through
        }

        // runtime check that stuff
        if (decision !== DECISION.ALLOW && decision !== DECISION.DISALLOW) throw new Error('Unknown decision')

        const allow = decision === DECISION.ALLOW

        if (manual) {
          await this.dbi.confirmPending(id, allow)

          // add app on 'allow connect'
          if (method === 'connect' && allow) {
            // save connect token that was used
            const token = params && params.length >= 2 ? params[1] : ''

            // add app if it's allowed
            await this.dbi.addApp({
              appNpub: req.appNpub,
              npub: req.npub,
              timestamp: Date.now(),
              name: '',
              icon: '',
              url: options.appUrl || '',
              updateTimestamp: Date.now(),
              permUpdateTimestamp: Date.now(),
              userAgent: globalThis?.navigator?.userAgent || '',
              token: token || '',
              subNpub,
            })

            // reload
            self.apps = await this.dbi.listApps()
          }
        } else {
          // just send to db w/o waiting for it
          this.dbi.addConfirmed({
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
            await this.dbi.addPerm({
              id: `${req.id}-${p}`,
              npub: req.npub,
              appNpub: req.appNpub,
              perm: p,
              value: allow ? '1' : '0',
              timestamp: Date.now(),
            })
          }

          // reload
          this.perms = await this.dbi.listPerms()

          // publish updated apps if app is added
          if (this.apps.find((a) => a.appNpub === req.appNpub && a.npub === req.npub)) {
            await this.updateAppPermTimestamp(req.appNpub, req.npub)

            // if remembering - publish
            this.publishAppPerms({
              npub: req.npub,
              appNpub: req.appNpub,
            })
          }
        }

        // release this promise to send reply
        // to this req
        ok([decision, resultCb])

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
        onAllow(false, dec, false, {})

        // notify
        this.emit(`done-${req.id}`, req)
      } else {
        // put pending req to db
        await this.dbi.addPending(req)

        // need manual confirmation
        console.log('need confirm', req)

        // put to a list of pending requests
        this.confirmBuffer.push({
          req,
          cb: (decision, remember, options) =>
            new Promise((ok) => {
              onAllow(true, decision, remember, options, ok)
            }),
        })

        // notify those who are waiting for this req
        this.emit(`pending-${req.id}`, req)

        // OAuth flow
        const isConnect = method === 'connect'
        const confirmMethod = isConnect ? 'confirm-connect' : 'confirm-event'
        const authUrl = `${self.global.getOrigin()}/key/${npub}?${confirmMethod}=true&reqId=${id}&popup=true`
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
        }, 300)

        // show notifs
        this.notifyConfirm()

        // notify main thread to ask for user concent
        this.updateUI()
      }
    })
  }

  private async startKey({ npub, sk, backoff = 1000 }: { npub: string; sk: string; backoff?: number }) {
    const ndk = new NDK({
      explicitRelayUrls: this.global.getNip46Relays(),
    })

    // init relay objects but dont wait until we connect
    ndk.connect()

    const signer = new PrivateKeySigner(sk)
    const backend = new Nip46Backend(ndk, signer, this.allowPermitCallback.bind(this)) // , () => Promise.resolve(true)
    const watcher = new Watcher(ndk, signer, (id) => {
      // drop pending request
      const index = self.confirmBuffer.findIndex((r) => r.req.id === id)
      if (index >= 0) self.confirmBuffer.splice(index, 1)
      this.dbi.removePending(id).then(() => this.updateUI())
    })
    this.keys.push({ npub, backend, signer, ndk, backoff, watcher })

    // new method
    // backend.handlers['get_nip04_key'] = new Nip04KeyHandlingStrategy(sk)

    // start
    backend.start()
    watcher.start()
    console.log(Date.now(), 'started', npub)

    // backoff reset on successfull connection
    const self = this
    const onConnect = () => {
      // reset backoff
      const key = self.keys.find((k) => k.npub === npub)
      if (key) key.backoff = 0
      console.log(Date.now(), 'reset backoff for', npub)
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

    this.emit(`start-key-${npub}`)
  }

  private async fetchPendingRequests(npub: string) {
    const { data: pubkey } = nip19.decode(npub)

    const events = await this.ndk.fetchEvents(
      {
        kinds: [KIND_RPC],
        '#p': [pubkey as string],
        since: Math.floor(Date.now() / 1000 - 10),
      },
      undefined,
      NDKRelaySet.fromRelayUrls(this.global.getNip46Relays(), this.ndk)
    )
    console.log('fetched pending for', npub, events.size)
    this.pendingNpubEvents.set(npub, [...events.values()])
  }

  private async waitKey(npub: string): Promise<Key | undefined> {
    const key = this.keys.find((k) => k.npub === npub)
    if (key) return key
    return new Promise((ok) => {
      // start-key will be called before start if key exists
      this.once(`start-key-${npub}`, () => ok(this.keys.find((k) => k.npub === npub)))
      this.once(`start`, () => ok(undefined))
    })
  }

  private async checkPendingRequest(npub: string, reqId: string) {
    console.log('checkPendingRequest', {
      npub,
      reqId,
      buffer: this.confirmBuffer,
    })
    // already there - return immediately
    const req = this.confirmBuffer.find((r) => r.req.id === reqId)
    if (req) return true

    return new Promise(async (ok, rej) => {
      // FIXME what if key wasn't loaded yet?
      const key = await this.waitKey(npub)
      if (!key) return rej(new Error('Key not found'))

      // to avoid races, add onEvent handlers before checking relays
      const pendingEventName = `pending-${reqId}`
      const doneEventName = `done-${reqId}`
      const listener = () => {
        ok(true)
      }
      this.once(pendingEventName, listener)
      this.once(doneEventName, listener)

      // if not found on relay release the event handlers
      const notFound = () => {
        // don't leak memory if events aren't on relays
        // and these handlers won't ever be called
        this.removeListener(pendingEventName, listener)
        this.removeListener(doneEventName, listener)
        ok(false)
      }

      // check relay
      await this.fetchPendingRequests(npub)
      const reqs = this.pendingNpubEvents.get(npub)
      console.log('checkPendingRequest', { npub, reqId, reqs })
      if (!reqs || !reqs.length) return notFound()
      this.pendingNpubEvents.delete(npub)

      // parse reqs and find by id
      for (const r of reqs) {
        try {
          const appUser = new NDKUser({ pubkey: r.pubkey })
          const payload = await key.signer.decrypt(appUser, r.content)
          const data = JSON.parse(payload)

          // found on relay, promise will be resolved by an
          // event handler above
          if (data.id === reqId && data.method) return
        } catch {}
      }

      // not found on relay
      notFound()
    })
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

  private async generateKeyConnect(params: CreateConnectParams) {
    const k = await this.addKey({
      name: params.name,
      passphrase: params.password,
    })

    const perms = ['connect', 'get_public_key']
    const allowedPerms = packageToPerms(ACTION_TYPE.BASIC)
    perms.push(...params.perms.split(',').filter((p) => allowedPerms?.includes(p)))

    await this.connectApp({
      npub: k.npub,
      appNpub: params.appNpub,
      appUrl: params.appUrl,
      perms,
    })

    this.updateUI()

    return k.npub
  }

  private async redeemToken(npub: string, token: string) {
    console.log('redeeming token', npub, token)
    await this.api.sendTokenToServer(npub, token)
  }

  private async importKey(name: string, nsec: string, passphrase: string) {
    const k = await this.addKey({ name, nsec, passphrase })
    this.updateUI()
    return k
  }

  private async uploadKey(npub: string, passphrase: string) {
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
    await this.api.sendKeyToServer(npub, enckey, pwh)
    await this.dbi.setSynced(npub)
  }

  private async setPassword(npub: string, passphrase: string, existingPassphrase: string) {
    const info = this.enckeys.find((k) => k.npub === npub)
    if (!info) throw new Error(`Key ${npub} not found`)

    // check existing password locally
    if (info.ncryptsec) {
      try {
        const sk = decryptNip49(info.ncryptsec, existingPassphrase)
        const decNpub = nip19.npubEncode(getPublicKey(bytesToHex(sk)))
        sk.fill(0) // clear
        if (decNpub !== npub) throw new Error('Wrong password')
      } catch {
        throw new Error('Wrong password')
      }
    }

    // decrypt sk
    const sk = await this.keysModule.decryptKeyLocal({
      enckey: info.enckey,
      // @ts-ignore
      localKey: info.localKey,
    })

    // encrypt with new password
    info.ncryptsec = encryptNip49(hexToBytes(sk), passphrase, 16, 0x01)
    await this.dbi.editNcryptsec(npub, info.ncryptsec)

    // upload key to server using new password
    await this.uploadKey(npub, passphrase)
  }

  private async fetchKey(npub: string, passphrase: string, nip05: string) {
    const { type, data: pubkey } = nip19.decode(npub)
    if (type !== 'npub') throw new Error(`Invalid npub ${npub}`)
    const { pwh } = await this.keysModule.generatePassKey(pubkey, passphrase)
    const { data: enckey } = await this.api.fetchKeyFromServer(npub, pwh)

    // key already exists?
    const key = this.enckeys.find((k) => k.npub === npub)
    if (key) return this.keyInfo(key)

    let name = ''
    let existingName = true
    // check name - user might have provided external nip05,
    // or just his npub - we must fetch their name from our
    // server, and if not exists - try to assign one
    const npubName = await this.api.fetchNpubName(npub)
    if (npubName) {
      // already have name for this npub
      console.log('existing npub name', npub, npubName)
      name = npubName
    } else if (nip05.includes('@')) {
      // no name for them?
      const [nip05name, domain] = nip05.split('@')
      if (domain === this.global.getDomain()) {
        // wtf? how did we learn their npub if
        // it's the name on our server but we can't fetch it?
        console.log('existing name', nip05name)
        name = nip05name
      } else {
        // try to take same name on our domain
        existingName = false
        name = nip05name
        let takenName = await fetchNip05(`${name}@${this.global.getDomain()}`)
        if (takenName) {
          // already taken? try name_domain as name
          name = `${nip05name}_${domain}`
          takenName = await fetchNip05(`${name}@${this.global.getDomain()}`)
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

  protected async confirm(id: string, allow: boolean, remember: boolean, options?: any) {
    const req = this.confirmBuffer.find((r) => r.req.id === id)
    if (!req) {
      console.log('req ', id, 'not found')
      await this.dbi.removePending(id)
      this.updateUI()
      return undefined
    } else {
      console.log('confirming req', id, allow, remember, options)
      return req.cb(allow ? DECISION.ALLOW : DECISION.DISALLOW, remember, options)
    }
  }

  private async updateApp(app: DbApp) {
    await this.dbi.updateApp(app)
    this.apps = await this.dbi.listApps()
    console.log('updated app', app)
    this.publishAppPerms({ appNpub: app.appNpub, npub: app.npub })
    this.updateUI()
  }

  private async deleteApp(appNpub: string, npub: string) {
    this.apps = this.apps.filter((a) => a.appNpub !== appNpub || a.npub !== npub)
    this.perms = this.perms.filter((p) => p.appNpub !== appNpub || p.npub !== npub)
    await this.dbi.removeApp(appNpub, npub)
    await this.dbi.removeAppPerms(appNpub, npub)
    this.publishAppPerms({ appNpub, npub, deleted: true })
    this.updateUI()
  }

  private async deletePerm(id: string) {
    const perm = this.perms.find((p) => p.id === id)
    if (!perm) throw new Error('Perm not found')
    this.perms = this.perms.filter((p) => p.id !== id)
    await this.dbi.removePerm(id)
    await this.updateAppPermTimestamp(perm.appNpub, perm.npub)
    this.publishAppPerms({ appNpub: perm.appNpub, npub: perm.npub })
    this.updateUI()
  }

  private async addPerm(appNpub: string, npub: string, perm: string, allow: string) {
    const p: DbPerm = {
      id: Math.random().toString(36).substring(7),
      npub: npub,
      appNpub: appNpub,
      perm,
      value: '1',
      timestamp: Date.now(),
    }

    this.perms.push(p)
    await this.dbi.addPerm(p)
    await this.updateAppPermTimestamp(appNpub, npub)
    this.publishAppPerms({ appNpub, npub })
    this.updateUI()
  }

  private async editName(npub: string, name: string) {
    const key = this.enckeys.find((k) => k.npub === npub)
    if (!key) throw new Error('Npub not found')
    if (key.name) {
      try {
        await this.api.sendDeleteNameToServer(npub, key.name)
      } catch (e: any) {
        if (e.cause && e.cause.status !== 404) throw e
        console.log("Deleted name didn't exist")
      }
    }

    name = name.trim().toLocaleLowerCase()
    if (name) {
      await this.api.sendNameToServer(npub, name)
    }
    await this.dbi.editName(npub, name)
    key.name = name
    this.updateUI()
  }

  private async transferName(npub: string, name: string, newNpub: string) {
    const key = this.enckeys.find((k) => k.npub === npub)
    if (!key) throw new Error('Npub not found')
    if (!name) throw new Error('Empty name')
    if (key.name !== name) throw new Error('Name changed, please reload')
    await this.api.sendTransferNameToServer(npub, key.name, newNpub)
    await this.dbi.editName(npub, '')
    key.name = ''
    this.updateUI()
  }

  private async exportKey(npub: string): Promise<string> {
    const dbKey = await this.dbi.getKey(npub)
    if (!dbKey) throw new Error('Key not found')
    return dbKey.ncryptsec || ''
  }

  private async nip04Decrypt(npub: string, peerPubkey: string, ciphertext: string) {
    const key = this.keys.find((k) => k.npub === npub)
    if (!key) throw new Error('Npub not found')
    return key.signer.decrypt(new NDKUser({ pubkey: peerPubkey }), ciphertext)
  }

  private async nip44Decrypt(npub: string, peerPubkey: string, ciphertext: string) {
    const key = this.keys.find((k) => k.npub === npub)
    if (!key) throw new Error('Npub not found')
    return key.signer.decryptNip44(new NDKUser({ pubkey: peerPubkey }), ciphertext)
  }

  private async getConnectToken(npub: string, subNpub?: string) {
    let t: DbConnectToken | undefined = await this.dbi.getConnectToken(npub, subNpub)
    if (t) return t
    t = {
      npub,
      subNpub,
      timestamp: Date.now(),
      expiry: Date.now() + TOKEN_TTL,
      token: bytesToHex(randomBytes(TOKEN_SIZE)),
    }
    await this.dbi.addConnectToken(t)
    // update
    this.connectTokens = await this.dbi.listConnectTokens()
    return t
  }

  private async nostrConnect(npub: string, nostrconnect: string, options: any) {
    const key = this.keys.find((k) => k.npub === npub)
    if (!key) throw new Error('Npub not found')
    const id = 'nostr-connect-' + Date.now()
    const url = new URL(nostrconnect)
    const pubkey = url.hostname || url.pathname.replace('//', '')
    console.log('nostrconnect url', url, pubkey)

    // returns request id if pending, or empty string if done
    return new Promise<string>((ok) => {
      // set request listeners first
      const pendingEventName = `pending-${id}`
      const doneEventName = `done-${id}`
      this.once(pendingEventName, () => {
        ok(id) // need confirm
      })

      this.once(doneEventName, () => {
        ok('') // processed
      })

      // post a synthetic request as if it's coming from
      // the client, when req is confirmed the backend
      // will reply properly
      const be = key.backend as Nip46Backend
      be.handleRequest({
        id,
        method: 'connect',
        remotePubkey: pubkey,
        params: [pubkey, '', options?.perms || ''],
        options,
      })
    })
  }

  public async onMessage(data: BackendRequest) {
    const { method, args } = data

    const start = Date.now()
    //console.log("UI message", id, method, args)
    let result = undefined
    if (method === 'generateKey') {
      result = await this.generateKey(args[0], args[1])
    } else if (method === 'generateKeyConnect') {
      result = await this.generateKeyConnect(args[0])
    } else if (method === 'redeemToken') {
      result = await this.redeemToken(args[0], args[1])
    } else if (method === 'importKey') {
      result = await this.importKey(args[0], args[1], args[2])
    } else if (method === 'setPassword') {
      result = await this.setPassword(args[0], args[1], args[2])
    } else if (method === 'fetchKey') {
      result = await this.fetchKey(args[0], args[1], args[2])
    } else if (method === 'confirm') {
      result = await this.confirm(args[0], args[1], args[2], args[3])
    } else if (method === 'connectApp') {
      result = await this.connectApp(args[0])
    } else if (method === 'nostrConnect') {
      result = await this.nostrConnect(args[0], args[1], args[2])
    } else if (method === 'updateApp') {
      result = await this.updateApp(args[0])
    } else if (method === 'deleteApp') {
      result = await this.deleteApp(args[0], args[1])
    } else if (method === 'deletePerm') {
      result = await this.deletePerm(args[0])
    } else if (method === 'addPerm') {
      result = await this.addPerm(args[0], args[1], args[2], args[3])
    } else if (method === 'editName') {
      result = await this.editName(args[0], args[1])
    } else if (method === 'transferName') {
      result = await this.transferName(args[0], args[1], args[2])
    } else if (method === 'enablePush') {
      result = await this.enablePush()
    } else if (method === 'checkPendingRequest') {
      result = await this.checkPendingRequest(args[0], args[1])
    } else if (method === 'fetchPendingRequests') {
      result = await this.fetchPendingRequests(args[0])
    } else if (method === 'exportKey') {
      result = await this.exportKey(args[0])
    } else if (method === 'nip04Decrypt') {
      result = await this.nip04Decrypt(args[0], args[1], args[2])
    } else if (method === 'nip44Decrypt') {
      result = await this.nip44Decrypt(args[0], args[1], args[2])
    } else if (method === 'getConnectToken') {
      result = await this.getConnectToken(args[0], args[1])
    } else {
      console.log('unknown method from UI ', method)
    }
    console.log('done method', method, 'in', Date.now() - start)
    return result
  }

  public async onPush(event: any) {
    try {
      const data = event.data?.json()
      console.log('push', JSON.stringify(data))
      const npub = nip19.npubEncode(data.pubkey)
      this.pushNpubs.push(npub)
      return npub
    } catch (e) {
      console.log('Failed to process push event', e)
      return ''
    }
  }

  protected getApp(npub: string, appNpub: string) {
    return this.apps.find((a) => a.appNpub === appNpub && a.npub === npub)
  }

  protected getUnlockedNpubs(): string[] {
    return this.keys.map((k) => k.npub)
  }

  protected getNpubName(npub: string) {
    const key = this.enckeys.find((k) => k.npub === npub)
    if (!key) return ''
    return key.name || key.nip05 || getShortenNpub(key.npub)
  }

  protected async enablePush(): Promise<boolean> {
    // noop stub
    return false
  }

  protected async notifyNpub(npub: string) {
    npub
    // implemented in sw
  }

  protected async updateUI() {
    // noop stub
  }

  protected async subscribeAllKeys() {
    // noop stub
  }

  protected notifyConfirm() {
    // noop
  }

  protected async subscribeNpub(npub: string) {
    // noop
  }
}
