import WebSocket from 'ws'
import { BackendRequest, NoauthBackend } from '../backend'
import { Api } from '../api'
import { sendPostAuthd } from '../utils'
import { GlobalContext } from '../global'
import { Key } from '../types'
import { dbi } from '@noauth/common'
import { wss } from '../../index'

const NIP46_RELAYS = ['wss://relay.nsec.app']
const NOAUTHD_URL = 'https://noauthd.nsec.app'
const NSEC_APP_NPUB = 'npub1uf9gd9pax7534dy96mu603nqjlp9mht8az73ka0dy54rcfnvlxasumv8xc'
const DOMAIN = 'nsec.app'

class BrowserApi extends Api {
  // send push api subsciption to server
  public async sendSubscriptionToServer(npub: string, pushSubscription: PushSubscription) {
    const body = JSON.stringify({
      npub,
      relays: NIP46_RELAYS,
      pushSubscription,
    })

    const method = 'POST'
    const url = `${NOAUTHD_URL}/subscribe`

    return sendPostAuthd({
      global: this.global,
      key: this.global.getKey(npub),
      url,
      method,
      body,
    })
  }
}

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

    const api = new BrowserApi(global)
    super(global, api)

    self = this
    this.socket = ws
    this.setupListeners()
  }

  private setupListeners(): void {
    this.socket.on('message', this.onMessageEvent.bind(this))
    this.socket.on('close', this.onClose.bind(this))
  }

  private async onMessageEvent(message: string): Promise<void> {
    try {
      const request: BackendRequest = JSON.parse(message)

      let response

      if (request.method === 'listKeys') {
        response = await dbi.listKeys()
      } else if (request.method === 'listApps') {
        response = await dbi.listApps()
      } else if (request.method === 'listPerms') {
        response = await dbi.listPerms()
      } else if (request.method === 'listPending') {
        response = await dbi.listPending()
      } else if (request.method === 'appLastActiveRecord') {
        response = await dbi.getAppLastActiveRecord(request.args[0])
      } else {
        response = await this.onMessage(request)
      }

      const result = {
        id: request.id,
        result: response,
      }
      this.socket.send(JSON.stringify(result))
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
    // wss.clients.forEach(function (client) {
    //   console.log('sending render flag')
    //   client.send(JSON.stringify({}))
    // })
    // console.log(wss.clients)
  }
}
