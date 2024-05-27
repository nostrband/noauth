import WebSocket from 'ws'
import { Api, BackendRequest, GlobalContext, Key, NoauthBackend } from '@noauth/backend'
import { DOMAIN, NIP46_RELAYS, NOAUTHD_URL, NSEC_APP_NPUB } from './consts'

export class WebSocketBackend extends NoauthBackend {
  private socket: WebSocket

  constructor(ws: WebSocket, baseUrl: string) {
    let self: WebSocketBackend
    const global: GlobalContext = {
      btoa(data) {
        return Promise.resolve(Buffer.from(data, 'binary').toString('base64'))
      },
      getOrigin() {
        return baseUrl
      },
      getCryptoSubtle() {
        return globalThis.crypto.subtle
      },
      getKey(npub: string): Key {
        return self!.getKey(npub)
      },
      getDomain() {
        return DOMAIN || ''
      },
      getNoauthdUrl() {
        return NOAUTHD_URL || ''
      },
      getNsecAppNpub() {
        return NSEC_APP_NPUB || ''
      },
      getNip46Relays() {
        return NIP46_RELAYS
      },
    }

    const api = new Api(global)
    super(global, api)

    self = this
    this.socket = ws
    this.setupListeners()
  }

  private setupListeners(): void {
    this.socket.on('message', this.onMessageEvent.bind(this))
    this.socket.on('close', this.onClose.bind(this))
    this.socket.on('open', () => this.start())
  }

  private async onMessageEvent(message: string): Promise<void> {
    try {
      const { args, id, method }: BackendRequest = JSON.parse(message)
      const result = await this.onMessage({ args, id, method })
      this.socket.send(JSON.stringify({ id, result }))

      this.updateUI()
    } catch (error) {
      console.log(error, '=> server error')
      this.socket.send(JSON.stringify({ error: 'Invalid request format' }))
      this.updateUI()
    }
  }

  private onClose(code: number, reason: Buffer): void {
    console.log('Connection closed', code, reason.toJSON())
  }

  protected async updateUI() {
    this.socket.emit('re-render')
  }
}
