import { nip19 } from 'nostr-tools'
import { ACTION_TYPE } from './consts'
import { DbPending } from './db-types'
import { MetaEvent } from './meta-event'

export const getShortenNpub = (npub = '') => {
  return npub.substring(0, 10) + '...' + npub.slice(-4)
}

export const getProfileUsername = (profile: MetaEvent | null) => {
  if (!profile) return undefined
  return profile?.info?.name || profile?.info?.display_name
}

export function getReqParams(req: DbPending): any {
  try {
    return JSON.parse(req.params)
  } catch {}
  return undefined
}

export function getSignReqKind(req: DbPending): number | undefined {
  try {
    const data = JSON.parse(JSON.parse(req.params)[0])
    return data.kind
  } catch {}
  return undefined
}

export function getReqPerm(req: DbPending): string {
  if (req.method === 'sign_event') {
    const kind = getSignReqKind(req)
    if (kind !== undefined) return `${req.method}:${kind}`
  }
  return req.method
}

export function packageToPerms(pack: string) {
  if (pack === ACTION_TYPE.BASIC) {
    return [
      'connect',
      'get_public_key',
      'nip04_decrypt',
      'nip04_encrypt',
      'nip44_decrypt',
      'nip44_encrypt',
      'sign_event:0',
      'sign_event:1',
      'sign_event:3',
      'sign_event:6',
      'sign_event:7',
      'sign_event:9734',
      'sign_event:10002',
      'sign_event:30023',
      'sign_event:10000',
      'sign_event:27235',
    ]
  }
  return undefined
}

export function isPackagePerm(perm: string, reqPerm: string) {
  if (perm === ACTION_TYPE.BASIC) {
    switch (reqPerm) {
      case 'connect':
      case 'get_public_key':
      case 'nip04_decrypt':
      case 'nip04_encrypt':
      case 'nip44_decrypt':
      case 'nip44_encrypt':
      case 'sign_event:0':
      case 'sign_event:1':
      case 'sign_event:3':
      case 'sign_event:6':
      case 'sign_event:7':
      case 'sign_event:9734':
      case 'sign_event:10002':
      case 'sign_event:30023':
      case 'sign_event:10000':
      case 'sign_event:27235':
        return true
    }
  }
  return false
}

export async function fetchNip05(value: string, origin?: string) {
  try {
    const [username, domain] = value.toLocaleLowerCase().split('@')
    if (!origin) origin = `https://${domain}`
    const response = await fetch(`${origin}/.well-known/nostr.json?name=${username}`)
    const getNpub: {
      names: {
        [name: string]: string
      }
    } = await response.json()

    const pubkey = getNpub.names[username]
    return nip19.npubEncode(pubkey)
  } catch (e) {
    console.log('Failed to fetch nip05', value, 'error: ' + e)
    return ''
  }
}

