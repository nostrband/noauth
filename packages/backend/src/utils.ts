import { NDKEvent, NostrEvent } from '@nostr-dev-kit/ndk'
import { nip19 } from 'nostr-tools'
import { Key } from './types'
import { NostrPowEvent, minePow } from './pow'
import { GlobalContext } from './global'
import { sha256 } from '@noble/hashes/sha256'
import { bytesToHex } from '@noble/hashes/utils'

export async function sendPost({
  url,
  method,
  headers,
  body,
}: {
  url: string
  method: string
  headers: any
  body: string
}) {
  const r = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body,
  })
  if (r.status !== 200 && r.status !== 201) {
    console.log('Fetch error', url, method, r.status)
    const body = await r.json()
    throw new Error('Failed to fetch ' + url, { cause: { body, status: r.status } })
  }

  return await r.json()
}

export async function sendPostAuthd({
  global,
  key,
  url,
  method = 'GET',
  body = '',
  pow = 0,
}: {
  global: GlobalContext
  key: Key
  url: string
  method: string
  body: string
  pow?: number
}) {
  const { data: pubkey } = nip19.decode(key.npub)

  const authEvent = new NDKEvent(key.ndk, {
    pubkey: pubkey as string,
    kind: 27235,
    created_at: Math.floor(Date.now() / 1000),
    content: '',
    tags: [
      ['u', url],
      ['method', method],
    ],
  })
  if (body) authEvent.tags.push(['payload', bytesToHex(sha256(body))])

  // generate pow on auth evevnt
  if (pow) {
    const start = Date.now()
    const powEvent: NostrPowEvent = authEvent.rawEvent()
    const minedEvent = minePow(powEvent, pow)
    console.log('mined pow of', pow, 'in', Date.now() - start, 'ms', minedEvent)
    authEvent.tags = minedEvent.tags
  }

  authEvent.sig = await authEvent.sign(key.signer)

  const auth = await global.btoa(JSON.stringify(authEvent.rawEvent()))

  return await sendPost({
    url,
    method,
    headers: {
      Authorization: `Nostr ${auth}`,
    },
    body,
  })
}

export class WaitableQueue<T> {
  private queue: T[] = []
  private promises: Promise<void>[] = []
  private cb?: () => void

  constructor() {
    // one promise is always there unless we're done
    this.promises.push(new Promise((ok) => (this.cb = ok)))
  }

  public async get(): Promise<T | undefined> {
    // done
    if (!this.promises.length) return undefined

    // wait for the next value to arrive
    await this.promises.shift()

    // wtf?
    if (!this.queue.length) throw new Error('Empty queue')

    // return
    return this.queue.shift()
  }

  public push(reply: T, done: boolean = false) {
    // add to queue
    this.queue.push(reply)

    // resolve current promise
    this.cb!()

    // schedule next promise if we're not done yet
    if (!done) this.promises.push(new Promise<void>((ok) => (this.cb = ok)))
  }
}

export function isNip04(ciphertext: string) {
  const l = ciphertext.length
  if (l < 28) return false
  return (
    ciphertext[l - 28] === '?' && ciphertext[l - 27] === 'i' && ciphertext[l - 26] === 'v' && ciphertext[l - 25] === '='
  )
}
