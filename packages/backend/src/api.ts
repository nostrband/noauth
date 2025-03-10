import { fetchJson, sendAuthd } from './utils'
import { GlobalContext } from './global'
import { MAX_POW, MIN_POW } from '@noauth/common'

export class Api {
  readonly global: GlobalContext

  constructor(global: GlobalContext) {
    this.global = global
  }

  /**
   * Upload encrypted key to server (authed)
   * @param npub - user npub
   * @param enckey - encrypted key
   * @param pwh - password hash to be checked by fetchKeyFromServer
   * @param email - email if set
   * @param epwh - email password hash to be checked by fetchEmailFromServer
   * @returns data: { ok: true }
   */
  public async sendKeyToServer(npub: string, enckey: string, pwh: string, email?: string, epwh?: string) {
    const body = JSON.stringify({
      npub,
      data: enckey,
      pwh,
      email,
      epwh,
    })

    const method = 'POST'
    const url = `${this.global.getNoauthdUrl()}/put`

    return sendAuthd({
      global: this.global,
      key: this.global.getKey(npub),
      url,
      method,
      body,
    })
  }

  /**
   * Get encrypted key from server (public)
   * @param npub - user npub
   * @param pwh - password hash previously sent by sendKeyToServer
   * @returns data: { data: string } - encrypted key
   */
  public async fetchKeyFromServer(npub: string, pwh: string) {
    const body = JSON.stringify({
      npub,
      pwh,
    })

    const method = 'POST'
    const url = `${this.global.getNoauthdUrl()}/get`

    return await fetchJson({
      url,
      method,
      headers: {},
      body,
    })
  }

  /**
   * Set chosen user name to npub (authed),
   * will generate POW and retry if server says 'too low'.
   * @param npub - user npub
   * @param name - nip05 name under @nsec.app
   * @returns data: { ok: true }
   */
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
        return await sendAuthd({
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

  /**
   * Delete assigned name from server (authed)
   * @param npub - user npub
   * @param name - name
   * @returns data: { ok: true }
   */
  public async sendDeleteNameToServer(npub: string, name: string) {
    const body = JSON.stringify({
      npub,
      name,
    })

    const method = 'DELETE'
    const url = `${this.global.getNoauthdUrl()}/name`

    return sendAuthd({
      global: this.global,
      key: this.global.getKey(npub),
      url,
      method,
      body,
    })
  }

  /**
   * Transfer assigned name to newNpub (authed)
   * @param npub - user npub
   * @param name - name
   * @param newNpub - target npub
   * @returns data: { ok: true }
   */
  public async sendTransferNameToServer(npub: string, name: string, newNpub: string) {
    const body = JSON.stringify({
      npub,
      name,
      newNpub,
    })

    const method = 'PUT'
    const url = `${this.global.getNoauthdUrl()}/name`

    return sendAuthd({
      global: this.global,
      key: this.global.getKey(npub),
      url,
      method,
      body,
    })
  }

  /**
   * Send create_account token after signed up (authed)
   * @param npub - user npub
   * @param token - create_account token
   * @returns data: { ok: true }
   */
  public async sendTokenToServer(npub: string, token: string) {
    const body = JSON.stringify({
      npub,
      token,
    })

    const method = 'POST'
    const url = `${this.global.getNoauthdUrl()}/created`

    return sendAuthd({
      global: this.global,
      key: this.global.getKey(npub),
      url,
      method,
      body,
    })
  }

  /**
   * Fetch one nip05 assigned name for npub (public)
   * @param npub - user npub
   * @returns data: { name: ["name1", ...] }
   */
  public async fetchNpubName(npub: string) {
    const url = `${this.global.getNoauthdUrl()}/name?npub=${npub}`
    const r = await fetch(url)
    const d = await r.json()
    return d?.names?.length ? (d.names[0] as string) : ''
  }

  /**
   * Check if email is assigned to npub (public)
   * @param email - email
   * @returns data: { is_user: boolean }
   */
  public async checkEmail(email: string) {
    const url = `${this.global.getNoauthdUrl()}/is_user?email=${email}`
    const r = await fetch(url)
    const d = await r.json()
    return d.is_user === true
  }

  /**
   * Request attaching of email (authed), sends
   * confirmation email if not already confirmed.
   * @param npub - user npub
   * @param email - email
   * @param appNpub? - app
   * @returns data: { ok: true }
   */
  public async setEmail(npub: string, email: string, appNpub?: string) {
    const body = JSON.stringify({
      npub,
      email,
      appNpub
    })

    const method = 'POST'
    const url = `${this.global.getNoauthdUrl()}/email`

    return sendAuthd({
      global: this.global,
      key: this.global.getKey(npub),
      url,
      method,
      body,
    })
  }

  /**
   * Check npub's attached email and it's state (authed)
   * @param npub - user npub
   * @returns data: { email: string, confirmed: boolean }
   */
  public async getEmail(npub: string) {
    const url = `${this.global.getNoauthdUrl()}/email?npub=${npub}`
    return sendAuthd({
      global: this.global,
      key: this.global.getKey(npub),
      url,
    })
  }

  /**
   * Send when user clicks on confirmation link (authed)
   * @param npub - user npub
   * @param email - email mathing the code
   * @param code - code from confirmation email
   * @returns data: { ok: true }
   */
  public async confirmEmail(npub: string, email: string, code: string) {
    const body = JSON.stringify({
      npub,
      email,
      code,
    })

    const method = 'PUT'
    const url = `${this.global.getNoauthdUrl()}/email`

    return sendAuthd({
      global: this.global,
      key: this.global.getKey(npub),
      url,
      method,
      body,
    })
  }

  /**
   * Fetch email's npub from server, password from /confirm-email (public)
   * @param email - user email
   * @param pwh - user password
   * @returns data: { npub: string }
   */
  public async fetchEmailFromServer(email: string, pwh: string) {
    const body = JSON.stringify({
      email,
      pwh,
    })

    const method = 'POST'
    const url = `${this.global.getNoauthdUrl()}/email_npub`

    return await fetchJson({
      url,
      method,
      headers: {},
      body,
    })
  }
}
