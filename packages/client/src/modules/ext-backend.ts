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
    // @ts-ignore
    browser.runtime.onMessage.addListener(async (message: any) => {
      try {
        const result = await this.onMessageEvent(message)

        await browser.runtime.sendMessage(result).catch((error) => {
          console.log({ error }, 'HISH-send')
        })
        this.updateUI()
      } catch (error: any) {
        await browser.runtime.sendMessage({ error: error.toString(), id: message.id }).catch((error) => {
          console.log({ error }, 'HISH-send')
        })
        this.updateUI()
      }
    })
  }

  private async onMessageEvent(message: BackendRequest) {
    try {
      const { id, method } = message
      const result = await this.onMessage(message)

      return { id, result, method }
    } catch (e: any) {
      throw new Error(e.toString())
    }
  }

  protected async updateUI() {
    browser.runtime.sendMessage({ result: 're-render' })
  }
}
