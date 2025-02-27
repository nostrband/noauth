import { NDKEvent } from '@nostr-dev-kit/ndk'
import { nip19 } from 'nostr-tools'
import { Key } from './types'
import { NostrPowEvent, minePow } from './pow'
import { GlobalContext } from './global'
import { sha256 } from '@noble/hashes/sha256'
import { bytesToHex } from '@noble/hashes/utils'

export async function fetchJson({
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

export async function sendAuthd({
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
  method?: string
  body?: string
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

  return await fetchJson({
    url,
    method,
    headers: {
      Authorization: `Nostr ${auth}`,
    },
    body,
  })
}

export function isNip04(ciphertext: string) {
  const l = ciphertext.length
  if (l < 28) return false
  return (
    ciphertext[l - 28] === '?' && ciphertext[l - 27] === 'i' && ciphertext[l - 26] === 'v' && ciphertext[l - 25] === '='
  )
}

// https://stackoverflow.com/a/46181
export function validateEmail(email: string) {
  return email.match(
    /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  )
}
