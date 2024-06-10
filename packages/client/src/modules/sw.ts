import { DOMAIN, NIP46_RELAYS, NOAUTHD_URL, NSEC_APP_NPUB, WEB_PUSH_PUBKEY } from '@/utils/consts'
import { getShortenNpub } from '@noauth/common'
import { NoauthBackend, Api, Key, GlobalContext, sendPostAuthd } from '@noauth/backend'

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

export class ServiceWorkerBackend extends NoauthBackend {
  private browserApi: BrowserApi
  private swg: ServiceWorkerGlobalScope
  private notifCallback: (() => void) | null = null

  constructor(swg: ServiceWorkerGlobalScope) {
    console.log('works in browser')
    let self: ServiceWorkerBackend
    const global: GlobalContext = {
      btoa(data) {
        return Promise.resolve(swg.btoa(data))
      },
      getOrigin() {
        return swg.location.origin
      },
      getCryptoSubtle() {
        return swg.crypto.subtle
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
    this.browserApi = api
    this.swg = swg

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
      self.onMessageEvent(event)
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

  public setNotifCallback(cb: () => void) {
    if (this.notifCallback) {
      // this.notify()
    }
    this.notifCallback = cb
  }

  private async onMessageEvent(event: any) {
    const { id } = event.data
    try {
      const result = await this.onMessage(event.data)

      event.source.postMessage({
        id,
        result,
      })
      // ensure it's sent to make checkpoint work
      this.updateUI()
    } catch (e: any) {
      console.log('backend error', e)
      event.source.postMessage({
        id,
        error: e.toString(),
      })
      // checkpoint
      this.updateUI()
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

  protected notifyConfirmTODO() {
    // FIXME collect info from accessBuffer and confirmBuffer
    // and update the notifications

    for (const r of this.confirmBuffer) {
      if (r.notified) continue

      // check key exists
      if (!this.getUnlockedNpubs().find((npub) => npub === r.req.npub)) continue

      // get the app info
      const app = this.getApp(r.req.npub, r.req.appNpub)
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
          // @ts-ignore
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
          // @ts-ignore
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

  protected async updateUI() {
    const clients = await this.swg.clients.matchAll({
      includeUncontrolled: true,
    })
    console.log('updateUI clients', clients.length)
    for (const client of clients) {
      client.postMessage({})
    }
  }

  protected async enablePush(): Promise<boolean> {
    const options = {
      userVisibleOnly: true,
      applicationServerKey: WEB_PUSH_PUBKEY,
    }

    const pushSubscription = await this.swg.registration.pushManager?.subscribe(options)
    console.log('push endpoint', JSON.stringify(pushSubscription))

    if (!pushSubscription) {
      console.log('failed to enable push subscription')
      return false
    }

    // subscribe to all pubkeys
    for (const npub of this.getUnlockedNpubs()) {
      await this.browserApi.sendSubscriptionToServer(npub, pushSubscription)
    }
    console.log('push enabled')

    return true
  }

  protected async subscribeAllKeys(): Promise<void> {
    let sub = await this.swg.registration.pushManager?.getSubscription()
    if (!sub && Notification && Notification.permission === 'granted') {
      const enabled = await this.enablePush()
      if (enabled) sub = await this.swg.registration.pushManager.getSubscription()
    }

    if (sub) {
      // subscribe in the background to avoid blocking
      // the request processing
      for (const npub of this.getUnlockedNpubs()) this.browserApi.sendSubscriptionToServer(npub, sub)
    }
  }

  protected async subscribeNpub(npub: string) {
    const sub = await this.swg.registration.pushManager?.getSubscription()
    if (sub) await this.browserApi.sendSubscriptionToServer(npub, sub)
    console.log('subscribed', npub)
  }
}