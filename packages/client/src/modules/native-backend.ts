import { ADMIN_DOMAIN, DOMAIN, NIP46_RELAYS, NOAUTHD_URL, NSEC_APP_NPUB } from '@/utils/consts'
import { NoauthBackend, Api, Key, GlobalContext, sendPostAuthd } from '@noauth/backend'
import { dbi } from '@noauth/common/dist/dbi-client'
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications'
import { BackendReply } from './client'

class BrowserApi extends Api {
  // send push api subsciption to server
  public async sendSubscriptionToServer(npub: string, apnToken: string) {
    const body = JSON.stringify({
      npub,
      relays: NIP46_RELAYS,
      apnToken,
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

export class NativeBackend extends NoauthBackend {
  private browserApi: BrowserApi
  // private notifCallback: (() => void) | null = null
  // private lastPushTime = 0
  private onUIUpdate: () => void = () => undefined
  private pushToken?: Token

  constructor() {
    let self: NativeBackend
    const global: GlobalContext = {
      btoa(data) {
        return Promise.resolve(window.btoa(data))
      },
      getOrigin(iframe?: boolean) {
        // iframe must use the same origin, otherwise - main domain
        return iframe || !ADMIN_DOMAIN ? window.location.origin : `https://${ADMIN_DOMAIN}`
      },
      getCryptoSubtle() {
        return window.crypto.subtle
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
    super(global, api, dbi)

    self = this
    this.browserApi = api

    this.reloadUI()

    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('got push', notification)
      // self.setNotifCallback(ok)
      this.onPush({
        data: {
          json: () => {
            return notification.data
          },
        },
      })
    })

    PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
      // FIXME now what?
    })

    //     swg.addEventListener(
    //       'notificationclick',
    //       (event) => {
    //         event.notification.close()
    //         if (event.action.startsWith('allow:')) {
    //           self.confirm(event.action.split(':')[1], true, false)
    //         } else if (event.action.startsWith('allow-remember:')) {
    //           self.confirm(event.action.split(':')[1], true, true)
    //         } else if (event.action.startsWith('disallow:')) {
    //           self.confirm(event.action.split(':')[1], false, false)
    //         } else {
    //           event.waitUntil(
    //             self.swg.clients.matchAll({ type: 'window' }).then((clientList) => {
    //               console.log('clients', clientList.length)
    //               // FIXME find a client that has our
    //               // key page
    //               for (const client of clientList) {
    //                 console.log('client', client.url)
    //                 if (new URL(client.url).pathname === '/' && 'focus' in client) {
    //                   client.focus()
    //                   return
    //                 }
    //               }

    //               // confirm screen url
    //               if (!event.notification.data) return
    //               const npub = event.notification.data.req ? event.notification.data.req.npub : event.notification.data.npub

    //               if (npub) {
    //                 const url = `${self.swg.location.origin}/key/${npub}`
    //                 self.swg.clients.openWindow(url)
    //               }
    //             })
    //           )
    //         }
    //       },
    //       false // ???
    //     )
  }

  public async onMessageEvent(data: any, onReply: (data: BackendReply) => void) {
    const { id } = data
    try {
      const result = await this.onMessage(data)
      console.log({ result }, 'result in onMessageEvent sw.ts:139')
      onReply({
        id,
        result,
      } as BackendReply)
      this.updateUI()

      // ensure it's sent to make checkpoint work
    } catch (e: any) {
      console.log('backend error', e)
      onReply({
        id,
        error: e.toString(),
      } as BackendReply)
      // checkpoint
      this.updateUI()
    }
  }

  public setOnUIUpdate(onUIUpdate: () => void) {
    if (typeof onUIUpdate !== 'function') return
    this.onUIUpdate = onUIUpdate
  }

  private async reloadUI() {
    // const clients = await this.swg.clients.matchAll({
    //   includeUncontrolled: true,
    // })
    // console.log('reloadUI clients', clients.length)
    // for (const client of clients) {
    //   client.postMessage({ result: 'reload' })
    // }
  }

  // https://web.dev/articles/push-notifications-common-notification-patterns#the_exception_to_the_rule
  protected isClientFocused() {
    // return this.swg.clients
    //   .matchAll({
    //     type: 'window',
    //     includeUncontrolled: true,
    //   })
    //   .then((windowClients) => {
    //     let clientIsFocused = false
    //     for (let i = 0; i < windowClients.length; i++) {
    //       const windowClient = windowClients[i]
    //       if (windowClient.focused) {
    //         clientIsFocused = true
    //         break
    //       }
    //     }
    //     return clientIsFocused
    //   })
  }

  protected async notifyNpub(npub: string) {
    // if (await this.isClientFocused()) return
    // // annoying when several pushes show up too fast
    // const minInterval = 1000
    // const interval = Date.now() - this.lastPushTime
    // if (interval < minInterval) await new Promise((ok) => setTimeout(ok, minInterval - interval))
    // // remember
    // this.lastPushTime = Date.now()
    // const tag = npub
    // try {
    //   let show = true
    //   if (!this.isSafari()) {
    //     const notifs = await this.swg.registration.getNotifications({
    //       tag,
    //     })
    //     show = !notifs.length
    //   }
    //   if (show) {
    //     const icon = '/favicon-32x32.png'
    //     const title = this.getNpubName(npub)
    //     const body = `Processed request.`
    //     await this.swg.registration.showNotification(title, {
    //       body,
    //       tag,
    //       silent: true,
    //       icon,
    //       data: { npub },
    //     })
    //   }
    // } catch (e) {
    //   console.log('failed to show notification', e)
    // }
    // // unlock the onPush to let browser know we're done,
    // // FIXME what if it shuts us down immediately?
    // if (this.notifCallback) this.notifCallback()
    // this.notifCallback = null
  }

  protected async updateUI() {
    this.onUIUpdate()
  }

  protected async enablePush() {
    const token = await this.getPushToken()
    if (!token) return false

    console.log('push token', token.value)
    try {
      for (const npub of this.getUnlockedNpubs()) {
        await this.browserApi.sendSubscriptionToServer(npub, token.value)
      }
      console.log('push enabled')
      return true
    } catch (e) {
      console.log('Failed to send token to server', e)
      return false
    }
  }

  private async getPushToken() {
    if (this.pushToken) return Promise.resolve(this.pushToken)

    return await new Promise<{ value: string } | undefined>(async (ok) => {
      PushNotifications.addListener('registration', (token: { value: string }) => {
        this.pushToken = token
        ok(token)
      })
      PushNotifications.addListener('registrationError', (error: any) => {
        console.log('error in PushNotifications.register', error)
        ok(undefined)
      })
      await PushNotifications.register()
    })
  }

  protected async subscribeAllKeys(): Promise<void> {
    await PushNotifications.removeAllDeliveredNotifications()

    // returns token if perms are granted and registration is successful
    const token = await this.getPushToken()
    if (token) {
      // subscribe in the background to avoid blocking
      // the request processing
      for (const npub of this.getUnlockedNpubs()) this.browserApi.sendSubscriptionToServer(npub, token.value)
    }
  }

  protected async subscribeNpub(npub: string) {
    const token = await this.getPushToken()
    if (token) await this.browserApi.sendSubscriptionToServer(npub, token.value)
    console.log('subscribed', npub)
  }
}
