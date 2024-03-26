import NDK, { IEventHandlingStrategy, NDKEvent, NDKNip46Backend } from "@nostr-dev-kit/ndk"
import { Event, nip19, verifySignature } from "nostr-tools"
import { DECISION, IAllowCallbackParams } from "./types"
import { Signer } from "./signer"
import { Nip44DecryptHandlingStrategy, Nip44EncryptHandlingStrategy } from "./nip44"

class ConnectEventHandlingStrategy implements IEventHandlingStrategy {
  async handle(
      backend: NDKNip46Backend,
      id: string,
      remotePubkey: string,
      params: string[]
  ): Promise<string | undefined> {
    return 'ack';
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
        since: Math.floor(Date.now() / 1000 - 10),
      },
      { closeOnEose: false }
    )

    sub.on('event', (e) => this.handleIncomingEvent(e))
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

    const [decision, resultCb] = await this.allowCb({
      backend: this,
      npub: this.npub,
      id,
      method,
      remotePubkey,
      params,
    })
    console.log(Date.now(), 'handle', { method, id, decision, remotePubkey, params })
    if (decision === DECISION.IGNORE) return

    let error
    const allow = decision === DECISION.ALLOW
    const strategy = this.handlers[method]
    if (allow) {
      if (strategy) {
        try {
          response = await strategy.handle(this, id, remotePubkey, params)
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

    // send result
    if (response) {
      this.rpc.sendResponse(id, remotePubkey, response)
    } else {
      this.rpc.sendResponse(id, remotePubkey, 'error', undefined, error)
    }
  }
}

