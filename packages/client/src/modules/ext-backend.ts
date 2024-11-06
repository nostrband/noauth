import { DOMAIN, NIP46_RELAYS, NOAUTHD_URL, NSEC_APP_NPUB } from '@/utils/consts'
import { Api, BackendRequest, GlobalContext, Key, NoauthBackend } from '@noauth/backend'
import { dbi } from '@noauth/common/dist/dbi-client'
import browser from 'webextension-polyfill'

export class ExtensionBackend extends NoauthBackend {
  constructor(origin: string) {
    let self: ExtensionBackend
    const global: GlobalContext = {
      btoa(data) {
        return Promise.resolve(btoa(data))
      },
      getOrigin() {
        return origin
      },
      getCryptoSubtle() {
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

    browser.runtime.onMessage.addListener((message: any) => {
      return this.onMessageEvent(message)
    })
  }

  private async onMessageEvent(message: BackendRequest) {
    try {
      const { id, method } = message
      console.log('[ExtensionBackend]:message', { message })
      const result = await this.onMessage(message)
      this.updateUI()
      return { id, result, method }
    } catch (e: any) {
      console.error('[ExtensionBackend]:error', e)
      this.updateUI()
      return { error: e.toString() }
    }
  }

  protected async updateUI() {
    console.log('[HISH]: update UI', {})
    browser.runtime.sendMessage({ result: 're-render' })
  }
}
