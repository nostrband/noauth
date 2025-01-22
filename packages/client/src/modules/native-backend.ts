import { ADMIN_DOMAIN, DOMAIN, NIP46_RELAYS, NOAUTHD_URL, NSEC_APP_NPUB } from '@/utils/consts'
import { NoauthBackend, Api, Key, GlobalContext, sendPostAuthd } from '@noauth/backend'
import { dbi } from '@noauth/common/dist/dbi-client'
import { PushNotifications, Token } from '@capacitor/push-notifications'
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
  private notifCallback: (() => void) | null = null
  private lastPushTime = 0

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

    // swg.addEventListener('push', (event) => {
    //   console.log('got push', event)
    //   event.waitUntil(
    //     // wait until the sw loads and shows a notification
    //     new Promise((ok: any) => {
    //       self.setNotifCallback(ok)
    //       self.onPush(event)
    //     })
    //   )
    // })

    // swg.addEventListener('message', (event) => {
    //   self.onMessageEvent(event)
    // })

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

  //   public setNotifCallback(cb: () => void) {
  //     // make sure the previous promise is resolved
  //     if (this.notifCallback) this.notifCallback()
  //     this.notifCallback = cb
  //   }

  public async onMessageEvent(data: any, onReply: (data: BackendReply) => void) {
    const { id } = data
    try {
      const result = await this.onMessage(data)
      console.log({ result }, 'result in onMessageEvent sw.ts:139')
      onReply({
        id,
        result,
      } as BackendReply)
      this.updateUI(onReply)

      // ensure it's sent to make checkpoint work
    } catch (e: any) {
      console.log('backend error', e)
      onReply({
        id,
        error: e.toString(),
      } as BackendReply)
      // checkpoint
      this.updateUI(onReply)
    }
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

  //   protected notifyConfirmTODO() {
  //     // FIXME collect info from accessBuffer and confirmBuffer
  //     // and update the notifications

  //     for (const r of this.confirmBuffer) {
  //       if (r.notified) continue

  //       // check key exists
  //       if (!this.getUnlockedNpubs().find((npub) => npub === r.req.npub)) continue

  //       // get the app info
  //       const app = this.getApp(r.req.npub, r.req.appNpub)
  //       if (r.req.method !== 'connect' && !app) continue

  //       // FIXME check
  //       const icon = 'assets/icons/logo.svg'

  //       const appName = app?.name || getShortenNpub(r.req.appNpub)
  //       // FIXME load profile?
  //       const keyName = getShortenNpub(r.req.npub)

  //       const tag = 'confirm-' + r.req.appNpub
  //       const allowAction = 'allow:' + r.req.id
  //       const disallowAction = 'disallow:' + r.req.id
  //       const data = { req: r.req }

  //       if (r.req.method === 'connect') {
  //         const title = `Connect with new app`
  //         const body = `Allow app "${appName}" to connect to key "${keyName}"`
  //         this.swg.registration.showNotification(title, {
  //           body,
  //           tag,
  //           icon,
  //           data,
  //           // @ts-ignore
  //           actions: [
  //             {
  //               action: allowAction,
  //               title: 'Connect',
  //             },
  //             {
  //               action: disallowAction,
  //               title: 'Ignore',
  //             },
  //           ],
  //         })
  //       } else {
  //         const title = `Permission request`
  //         const body = `Allow "${r.req.method}" by "${appName}" to "${keyName}"`
  //         this.swg.registration.showNotification(title, {
  //           body,
  //           tag,
  //           icon,
  //           data,
  //           // @ts-ignore
  //           actions: [
  //             {
  //               action: allowAction,
  //               title: 'Yes',
  //             },
  //             {
  //               action: disallowAction,
  //               title: 'No',
  //             },
  //           ],
  //         })
  //       }

  //       // mark
  //       r.notified = true
  //     }

  //     if (this.notifCallback) this.notifCallback()
  //     this.notifCallback = null
  //   }

  protected async updateUI(onReply?: (data: any) => void) {
    onReply && onReply({})
  }

  protected async enablePush(): Promise<boolean> {
    return new Promise<boolean>(async (resolve) => {
      const onRegistration = async (token: Token) => {
        console.log('Push registration success, token:', token.value)
        try {
          for (const npub of this.getUnlockedNpubs()) {
            await this.browserApi.sendSubscriptionToServer(npub, token.value)
          }
          console.log('push enabled')
          resolve(true)
        } catch (e) {
          console.log('Failed to send token to server', e)
          resolve(false)
        } finally {
          PushNotifications.removeAllListeners()
        }
      }

      const onRegistrationError = (error: any) => {
        console.log('Failed to enable push notifications', error)
        resolve(false)
        PushNotifications.removeAllListeners()
      }

      PushNotifications.addListener('registration', onRegistration)
      PushNotifications.addListener('registrationError', onRegistrationError)

      await PushNotifications.register()
    })
  }

  //   protected async subscribeAllKeys(): Promise<void> {
  //     let sub = await this.swg.registration.pushManager?.getSubscription()
  //     if (!sub && Notification && Notification.permission === 'granted') {
  //       const enabled = await this.enablePush()
  //       if (enabled) sub = await this.swg.registration.pushManager.getSubscription()
  //     }

  //     if (sub) {
  //       // subscribe in the background to avoid blocking
  //       // the request processing
  //       for (const npub of this.getUnlockedNpubs()) this.browserApi.sendSubscriptionToServer(npub, sub)
  //     }
  //   }

  //   protected async subscribeNpub(npub: string) {
  //     const sub = await this.swg.registration.pushManager?.getSubscription()
  //     if (sub) await this.browserApi.sendSubscriptionToServer(npub, sub)
  //     console.log('subscribed', npub)
  //   }
}
