import { ADMIN_DOMAIN, DOMAIN, NIP46_RELAYS, NOAUTHD_URL, NSEC_APP_NPUB } from '@/utils/consts'
import { NoauthBackend, Api, Key, GlobalContext, sendAuthd } from '@noauth/backend'
import { dbi } from '@noauth/common/dist/dbi-client'
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

    return sendAuthd({
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
      getEnclaveBuilderPubkeys: function (): string[] {
        throw new Error('Function not implemented.')
      },
      isValidEnclavePCRs: function (pcrs: Map<number, string>): boolean {
        throw new Error('Function not implemented.')
      },
    }

    const api = new BrowserApi(global)
    super(global, api, dbi)

    self = this
    this.browserApi = api

    this.reloadUI()
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

  private async reloadUI() {}

  // https://web.dev/articles/push-notifications-common-notification-patterns#the_exception_to_the_rule
  protected isClientFocused() {}

  protected async notifyNpub(npub: string) {}

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
    return { value: '' }
  }

  protected async subscribeAllKeys(): Promise<void> {
    await new Promise((ok) => setTimeout(ok, 10000))
    console.log('push subscribeAllKeys')
  }

  protected async subscribeNpub(npub: string) {}
}
