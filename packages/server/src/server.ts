import WebSocket from 'ws'
import { Api, BackendRequest, GlobalContext, Key, NoauthBackend } from '@noauth/backend'
import { DOMAIN, NIP46_RELAYS, NOAUTHD_URL, NSEC_APP_NPUB, ORIGIN } from './consts'
import http from 'http'
// @ts-ignore
import { dbi } from '@noauth/common/dist/dbi'

const DB_METHODS = [
  'listKeys',
  'listApps',
  'listPerms',
  'listPending',
  'listHistory',
  'getAppLastActiveRecord',
  'getSynced',
]

export class WebSocketBackend extends NoauthBackend {
  private wss: WebSocket.Server<typeof WebSocket, typeof http.IncomingMessage>

  constructor(wss: WebSocket.Server<typeof WebSocket, typeof http.IncomingMessage>, origin: string) {
    let self: WebSocketBackend
    const global: GlobalContext = {
      btoa(data) {
        return Promise.resolve(Buffer.from(data, 'binary').toString('base64'))
      },
      getOrigin() {
        return origin
      },
      getCryptoSubtle() {
        // @ts-ignore
        return crypto.subtle
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
    super(global, api, dbi)

    self = this
    this.wss = wss
  }

  public async onMessageEvent(ws: WebSocket, message: string): Promise<void> {
    try {
      const { args, id, method }: BackendRequest = JSON.parse(message)

      if (DB_METHODS.includes(method)) {
        let result
        if (method === 'listKeys') {
          result = await dbi.listKeys()
        } else if (method === 'listApps') {
          result = await dbi.listApps()
        } else if (method === 'listPerms') {
          result = await dbi.listPerms()
        } else if (method === 'listPending') {
          result = await dbi.listPending()
        } else if (method === 'listHistory') {
          result = await dbi.listHistory(args[0])
        } else if (method === 'getAppLastActiveRecord') {
          result = await dbi.getAppLastActiveRecord(args[0])
        } else if (method === 'getSynced') {
          result = await dbi.getSynced(args[0])
        }
        ws.send(JSON.stringify({ id, result, method }))
        return
      }

      const result = await this.onMessage({ args, id, method })
      ws.send(JSON.stringify({ id, result, method }))

      this.updateUI()
    } catch (error) {
      console.log(error, '=> server error')
      ws.send(JSON.stringify({ error: 'Invalid request format' }))
      this.updateUI()
    }
  }

  public onClose(code: number, reason: Buffer): void {
    console.log('Connection closed', code, reason.toJSON())
  }

  protected async updateUI() {
    this.wss.emit('re-render')
  }
}
