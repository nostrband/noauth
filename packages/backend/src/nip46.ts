import NDK, {
  NDKEvent,
  NDKKind,
  NDKNip46Backend,
  NDKRpcRequest,
  NDKRpcResponse,
  NDKUser,
  NostrEvent,
} from '@nostr-dev-kit/ndk'
import { Event, getEventHash, nip19, validateEvent, verifySignature } from 'nostr-tools'
import { DECISION, IAllowCallbackParams } from './types'
import { Signer } from './signer'
import { Nip44DecryptHandlingStrategy, Nip44EncryptHandlingStrategy } from './nip44'
import { KIND_DATA, KIND_RPC } from '@noauth/common'
import { isNip04 } from './utils'
import { APP_TAG } from './const'

export interface IEventHandlingStrategyOptioned {
  handle(
    backend: NDKNip46Backend,
    id: string,
    remotePubkey: string,
    params: string[],
    options?: any
  ): Promise<string | undefined>
}

class ConnectEventHandlingStrategy implements IEventHandlingStrategyOptioned {
  async handle(
    backend: NDKNip46Backend,
    id: string,
    remotePubkey: string,
    params: string[],
    options?: any
  ): Promise<string | undefined> {
    return options && options.secret ? options.secret : 'ack'
  }
}

class SignEventHandlingStrategy implements IEventHandlingStrategyOptioned {
  async handle(
    backend: NDKNip46Backend,
    id: string,
    remotePubkey: string,
    params: string[],
    options?: any
  ): Promise<string | undefined> {
    // NDK messes with created_at for replaceable
    // events, and it's hard to fix it from the outside,
    // so we're reimplementing it here properly.

    const [eventString] = params

    const event = JSON.parse(eventString) as Event

    // make sure apps can't force us to modify our own
    // permission events
    if (event.kind === KIND_DATA && event.tags.find((t) => t.length > 1 && t[0] === 't' && t.includes(APP_TAG)))
      throw new Error('Forbidden')

    event.pubkey = (await backend.signer.user()).pubkey
    event.id = getEventHash(event)
    event.sig = await backend.signer.sign(event)

    return JSON.stringify(event)
  }
}

export class Nip46Backend extends NDKNip46Backend {
  readonly signer: Signer
  private allowCb: (
    params: IAllowCallbackParams
  ) => Promise<[DECISION, ((result: string | undefined) => void) | undefined]>
  private npub: string = ''

  public constructor(
    ndk: NDK,
    signer: Signer,
    allowCb: (params: IAllowCallbackParams) => Promise<[DECISION, ((result: string | undefined) => void) | undefined]>
  ) {
    super(ndk, signer, () => Promise.resolve(true))
    this.signer = signer
    this.allowCb = allowCb
    signer.user().then((u) => (this.npub = nip19.npubEncode(u.pubkey)))

    // NDK's connect doesn't work for us
    this.handlers['connect'] = new ConnectEventHandlingStrategy()
    this.handlers['nip44_encrypt'] = new Nip44EncryptHandlingStrategy()
    this.handlers['nip44_decrypt'] = new Nip44DecryptHandlingStrategy()
    this.handlers['sign_event'] = new SignEventHandlingStrategy()
  }

  // override ndk's implementation to add 'since' tag
  // which is needed for strfry which doesn't
  // always delete ephemeral events properly
  public async start() {
    this.localUser = await this.signer.user()

    const sub = this.ndk.subscribe(
      {
        kinds: [24133 as number],
        '#p': [this.localUser.hexpubkey],
        since: Math.floor(Date.now() / 1000 - 60),
      },
      { closeOnEose: false }
    )

    sub.on('event', (e) => this.handleIncomingEvent(e))
  }

  public async processEvent(event: NDKEvent) {
    // default nip46 mode
    return this.handleIncomingEvent(event)
  }

  public async processEventIframe(event: NDKEvent, onAuthUrl: (auth_url: NostrEvent) => void) {
    // iframe mode
    const req = await this.parseRequest(event)

    const { response, error } = await this.processRequest({
      ...req,
      options: {
        iframe: true,
        onAuthUrl,
      },
    })

    // send result
    const res = { id: req.id, result: response } as NDKRpcResponse
    if (error) {
      res.error = error
    }

    const localUser = await this.signer.user()
    const remoteUser = this.ndk.getUser({ pubkey: req.remotePubkey })
    const replyEvent = new NDKEvent(this.ndk, {
      kind: NDKKind.NostrConnect,
      content: JSON.stringify(res),
      tags: [['p', req.remotePubkey]],
      pubkey: localUser.pubkey,
    } as NostrEvent)

    replyEvent.content = await this.signer.encrypt(remoteUser, replyEvent.content)
    await replyEvent.sign(this.signer)
    console.log('sw iframe reply event', replyEvent.rawEvent())

    return replyEvent.rawEvent()
  }

  private async processRequest({
    remotePubkey,
    id,
    method,
    params,
    options,
  }: {
    remotePubkey: string
    id: string
    method: string
    params?: any
    options?: any
  }) {
    // console.log("handle request", { remotePubkey, id, method, params });
    const [decision, resultCb] = await this.allowCb({
      backend: this,
      npub: this.npub,
      id,
      method,
      remotePubkey,
      params,
      options,
    })
    console.log(Date.now(), 'handle', { method, id, decision, remotePubkey, params, options })
    if (decision === DECISION.IGNORE) return {}

    let response: string | undefined
    let error
    const allow = decision === DECISION.ALLOW
    const strategy = this.handlers[method] as IEventHandlingStrategyOptioned
    if (allow) {
      if (strategy) {
        try {
          response = await strategy.handle(this, id, remotePubkey, params, options)
          console.log(Date.now(), 'req', id, 'method', method, 'result', response)
        } catch (e: any) {
          console.log('error handling event', e, { id, method, params })
          error = e.message || e.toString()
        }
      } else {
        console.log('unsupported method', { method, params })
        error = 'Unsupported method'
      }
    } else {
      error = 'Not authorized'
    }

    // wtf?
    if (!error && response === undefined) {
      error = 'Empty response'
    }

    // pass results back to UI
    console.log('response', { method, response, error })
    resultCb?.(response)

    return {
      response,
      error,
    }
  }

  public async handleRequest({
    remotePubkey,
    id,
    method,
    params,
    options,
  }: {
    remotePubkey: string
    id: string
    method: string
    params?: any
    options?: any
  }) {
    const { response, error } = await this.processRequest({
      remotePubkey,
      id,
      method,
      params,
      options,
    })

    // Decision.IGNORE
    if (!response && !error) return

    // send over nip46
    if (response) {
      await this.sendResponse(id, remotePubkey, response)
    } else {
      await this.sendResponse(id, remotePubkey, 'error', undefined, error)
    }
  }

  private async parseEvent(event: NDKEvent): Promise<NDKRpcRequest | NDKRpcResponse> {
    const remoteUser = this.ndk.getUser({ pubkey: event.pubkey })
    remoteUser.ndk = this.ndk
    const decrypt = isNip04(event.content) ? this.signer.decrypt : this.signer.decryptNip44
    console.log('event nip04', isNip04(event.content))
    const decryptedContent = await decrypt.call(this.signer, remoteUser, event.content)
    const parsedContent = JSON.parse(decryptedContent)
    const { id, method, params, result, error } = parsedContent

    if (method) {
      return { id, pubkey: event.pubkey, method, params, event }
    } else {
      return { id, result, error, event }
    }
  }

  private async parseRequest(event: NDKEvent) {
    const { id, method, params } = (await this.parseEvent(event)) as any
    const remotePubkey = event.pubkey

    this.debug('incoming event', { id, method, params })

    // validate signature explicitly
    if (!verifySignature(event.rawEvent() as Event)) {
      this.debug('invalid signature', event.rawEvent())
      throw new Error('Invalid request signature')
    }

    return {
      id,
      method,
      params,
      remotePubkey,
    }
  }

  protected async handleIncomingEvent(event: NDKEvent) {
    try {
      const req = await this.parseRequest(event)
      return this.handleRequest(req)
    } catch (e) {
      console.log('error processing incoming event', e, event)
    }
  }

  private async sendResponse(
    id: string,
    remotePubkey: string,
    result: string,
    kind = NDKKind.NostrConnect,
    error?: string
  ): Promise<void> {
    const event = await this.prepareResponse(id, remotePubkey, result, kind, error)
    await event.publish()
  }

  public async prepareResponse(
    id: string,
    remotePubkey: string,
    result: string,
    kind = NDKKind.NostrConnect,
    error?: string
  ): Promise<NDKEvent> {
    // FIXME reimplemented from rpc.sendResponse
    const res = { id, result } as NDKRpcResponse
    if (error) {
      res.error = error
    }

    const localUser = await this.signer.user()
    const remoteUser = this.ndk.getUser({ pubkey: remotePubkey })
    const event = new NDKEvent(this.ndk, {
      kind,
      content: JSON.stringify(res),
      tags: [['p', remotePubkey]],
      pubkey: localUser.pubkey,
    } as NostrEvent)

    event.content = await this.signer.encryptNip44(remoteUser, event.content)
    await event.sign(this.signer)
    return event
  }

  public async prepareAuthUrlResponse(id: string, remotePubkey: string, authUrl: string) {
    return this.prepareResponse(id, remotePubkey, 'auth_url', KIND_RPC, authUrl)
  }

  public async sendAuthUrlResponse(id: string, remotePubkey: string, authUrl: string) {
    const event = await this.prepareAuthUrlResponse(id, remotePubkey, authUrl)
    await event.publish()
  }
}

export class Nip46Client {
  private ndk: NDK
  private kind: number
  private signerPubkey: string
  private signer: Signer
  private pending = new Map<
    string,
    {
      ok: (result: string) => void
      err: (e: any) => void
    }
  >()

  constructor({ ndk, kind, signerPubkey, signer }: { ndk: NDK; kind: number; signerPubkey: string; signer: Signer }) {
    this.ndk = ndk
    this.kind = kind
    this.signerPubkey = signerPubkey
    this.signer = signer
    this.subscribe();
  }

  public async send({ method, params, timeout = 30000 }: { method: string; params: string[]; timeout?: number }) {
    if (!this.signerPubkey) throw new Error('Not started')

    const req = {
      id: '' + Math.random(),
      method,
      params,
    }

    const event = new NDKEvent(this.ndk, {
      created_at: Math.floor(Date.now() / 1000),
      pubkey: (await this.signer.user()).pubkey,
      kind: this.kind,
      content: await this.signer.encryptNip44(new NDKUser({ hexpubkey: this.signerPubkey }), JSON.stringify(req)),
      tags: [['p', this.signerPubkey]],
    })
    event.sig = await event.sign(this.signer)
    console.log('sending', event)
    await event.publish()

    return new Promise<string>((ok, err) => {
      this.pending.set(req.id, { ok, err })
      setTimeout(() => {
        const cbs = this.pending.get(req.id)
        if (cbs) {
          this.pending.delete(req.id)
          cbs.err('Request timeout')
        }
      }, timeout)
    })
  }

  private async onReplyEvent(e: Event) {
    const { id, result, error } = JSON.parse(
      await this.signer.decryptNip44(new NDKUser({ hexpubkey: this.signerPubkey }), e.content)
    )
    console.log('reply', { id, result, error })
    // if (result === "auth_url") {
    //   console.log("Open auth url: ", error);
    //   return;
    // }

    const cbs = this.pending.get(id)
    if (!cbs) return
    this.pending.delete(id)

    if (error) cbs.err(error)
    else cbs.ok(result)
  }

  private async subscribe() {
    const sub = this.ndk.subscribe(
      {
        kinds: [this.kind as number],
        authors: [this.signerPubkey!],
        '#p': [(await this.signer.user()).pubkey],
        since: Math.floor(Date.now() / 1000) - 10,
      },
      {
        groupable: false,
        closeOnEose: false,
      }
    )
    sub.on('event', this.onReplyEvent.bind(this))
  }
}
