import { MAX_POW, MIN_POW, NIP46_RELAYS, NOAUTHD_URL } from "@/utils/consts"
import { Key } from "./types"
import { sendPost, sendPostAuthd } from "./utils"

export interface KeyStore {
  getKey(npub: string): Key
}

export class Api {

  readonly swg: ServiceWorkerGlobalScope
  readonly ks: KeyStore

  constructor(swg: ServiceWorkerGlobalScope, ks: KeyStore) {
    this.swg = swg
    this.ks = ks
  }

  public async sendSubscriptionToServer(npub: string, pushSubscription: PushSubscription) {
    const body = JSON.stringify({
      npub,
      relays: NIP46_RELAYS,
      pushSubscription,
    })

    const method = 'POST'
    const url = `${NOAUTHD_URL}/subscribe`

    return sendPostAuthd({
      swg: this.swg,
      key: this.ks.getKey(npub),
      url,
      method,
      body,
    })
  }

  public async sendKeyToServer(npub: string, enckey: string, pwh: string) {
    const body = JSON.stringify({
      npub,
      data: enckey,
      pwh,
    })

    const method = 'POST'
    const url = `${NOAUTHD_URL}/put`

    return sendPostAuthd({
      swg: this.swg,
      key: this.ks.getKey(npub),
      url,
      method,
      body,
    })
  }

  public async fetchKeyFromServer(npub: string, pwh: string) {
    const body = JSON.stringify({
      npub,
      pwh,
    })

    const method = 'POST'
    const url = `${NOAUTHD_URL}/get`

    return await sendPost({
      url,
      method,
      headers: {},
      body,
    })
  }

  public async sendNameToServer(npub: string, name: string) {
    const body = JSON.stringify({
      npub,
      name,
    })

    const method = 'POST'
    const url = `${NOAUTHD_URL}/name`

    const key = this.ks.getKey(npub)

    // mas pow should be 21 or something like that
    let pow = MIN_POW
    while (pow <= MAX_POW) {
      console.log('Try name', name, 'pow', pow)
      try {
        return await sendPostAuthd({
          swg: this.swg,
          key,
          url,
          method,
          body,
          pow,
        })
      } catch (e: any) {
        console.log('error', e.cause)
        if (e.cause && e.cause.body && e.cause.body.minPow > pow) pow = e.cause.body.minPow
        else throw e
      }
    }
    throw new Error('Too many requests, retry later')
  }

  public async sendDeleteNameToServer(npub: string, name: string) {
    const body = JSON.stringify({
      npub,
      name,
    })

    const method = 'DELETE'
    const url = `${NOAUTHD_URL}/name`

    return sendPostAuthd({
      swg: this.swg,
      key: this.ks.getKey(npub),
      url,
      method,
      body,
    })
  }

  public async sendTransferNameToServer(npub: string, name: string, newNpub: string) {
    const body = JSON.stringify({
      npub,
      name,
      newNpub,
    })

    const method = 'PUT'
    const url = `${NOAUTHD_URL}/name`

    return sendPostAuthd({
      swg: this.swg,
      key: this.ks.getKey(npub),
      url,
      method,
      body,
    })
  }

  public async sendTokenToServer(npub: string, token: string) {
    const body = JSON.stringify({
      npub,
      token,
    })

    const method = 'POST'
    const url = `${NOAUTHD_URL}/created`

    return sendPostAuthd({
      swg: this.swg,
      key: this.ks.getKey(npub),
      url,
      method,
      body,
    })
  }
}