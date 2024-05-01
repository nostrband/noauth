import { sendPost, sendPostAuthd } from './utils'
import { GlobalContext } from './global'
import { MAX_POW, MIN_POW } from '../common/consts'

export class Api {
  readonly global: GlobalContext

  constructor(global: GlobalContext) {
    this.global = global
  }

  public async sendKeyToServer(npub: string, enckey: string, pwh: string) {
    const body = JSON.stringify({
      npub,
      data: enckey,
      pwh,
    })

    const method = 'POST'
    const url = `${this.global.getNoauthdUrl()}/put`

    return sendPostAuthd({
      global: this.global,
      key: this.global.getKey(npub),
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
    const url = `${this.global.getNoauthdUrl()}/get`

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
    const url = `${this.global.getNoauthdUrl()}/name`

    const key = this.global.getKey(npub)

    // mas pow should be 21 or something like that
    let pow = MIN_POW
    while (pow <= MAX_POW) {
      console.log('Try name', name, 'pow', pow)
      try {
        return await sendPostAuthd({
          global: this.global,
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
    const url = `${this.global.getNoauthdUrl()}/name`

    return sendPostAuthd({
      global: this.global,
      key: this.global.getKey(npub),
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
    const url = `${this.global.getNoauthdUrl()}/name`

    return sendPostAuthd({
      global: this.global,
      key: this.global.getKey(npub),
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
    const url = `${this.global.getNoauthdUrl()}/created`

    return sendPostAuthd({
      global: this.global,
      key: this.global.getKey(npub),
      url,
      method,
      body,
    })
  }

  public async fetchNpubName(npub: string) {
    const url = `${this.global.getNoauthdUrl()}/name?npub=${npub}`
    const r = await fetch(url)
    const d = await r.json()
    return d?.names?.length ? (d.names[0] as string) : ''
  }

}
