import {
  ADMIN_DOMAIN,
  DOMAIN,
  ENCLAVE_DEBUG,
  ENCLAVE_LAUNCHER_PUBKEYS,
  NIP46_RELAYS,
  NOAUTHD_URL,
  NSEC_APP_NPUB,
} from '@/utils/consts'
import { NoauthBackend, Api, Key, GlobalContext, sendAuthd } from '@noauth/backend'
import { dbi } from '@noauth/common/dist/dbi-client'
import { BackendReply } from './client'
import { hexToBytes } from '@noble/hashes/utils'

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
        return ENCLAVE_LAUNCHER_PUBKEYS.split(',')
          .map((p) => p.trim())
          .filter((p) => !!p)
      },
      isValidEnclavePCRs(pcrs: Map<number, string>) {
        if (!pcrs.get(0)) return false
        const debug = !hexToBytes(pcrs.get(0)!).find((c) => c !== 0)
        console.log('ENCLAVE_DEBUG', ENCLAVE_DEBUG)
        if (ENCLAVE_DEBUG === 'true') return true
        if (debug) return false

        // current dev release of noauth-enclaved
        return (
          pcrs.get(0) ===
            '2adc99990f8c26accf04e319fd7024381f1d4b460d4b4c2309c96a3260969994011484eb8038e04993ed95e7c9c75918' &&
          pcrs.get(1) ===
            '4b4d5b3661b3efc12920900c80e126e4ce783c522de6c02a2a5bf7af3a2b9327b86776f188e4be1c1c404a129dbda493' &&
          pcrs.get(2) ===
            '0044b92a9dcb2762d14cd51e63ac0e8f122ef1b3c9fdf67774e614315abe210b260dee01ac665e0a93953ebacd3ed21e'
        )
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
