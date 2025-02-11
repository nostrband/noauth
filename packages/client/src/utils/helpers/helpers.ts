import { nip19 } from 'nostr-tools'
import { ACTIONS, DOMAIN, NOAUTHD_URL } from '../consts'
import { DbHistory, DbPending, DbPerm } from '@noauth/common'
import { fetchNip05, getSignReqKind } from '@noauth/common'
import { PushNotifications } from '@capacitor/push-notifications'
import { NativeSettings, IOSSettings } from 'capacitor-native-settings'

export function getNotificationPermission() {
  if (!('Notification' in window)) {
    return undefined
  } else {
    return Notification.permission === 'granted'
  }
}

export async function askNotificationPermission() {
  return new Promise<void>((ok, rej) => {
    // Let's check if the browser supports notifications
    if (!('Notification' in window)) {
      rej(new Error('This browser does not support notifications.'))
    } else {
      Notification.requestPermission()
        .then(() => {
          if (Notification.permission === 'granted') ok()
          else rej(new Error('Denied'))
        })
        .catch((e) => {
          console.log('failed to request permission', e)
          rej(e)
        })
    }
  })
}

export async function askNativeNotificationPermission() {
  try {
    const permStatus = await PushNotifications.requestPermissions()
    if (permStatus.receive === 'granted') {
      return true
    }
    if (permStatus.receive === 'denied') {
      NativeSettings.openIOS({
        option: IOSSettings.App,
      })
      return false
    } else {
      return false
    }
  } catch (error) {
    console.log('failed to request permission', error)
    return false
  }
}

export function permListToPerms(perms: string): string[] {
  const r: string[] = []
  for (const p of perms.split(',')) {
    const kv = p.split(':')
    switch (kv[0]) {
      // these are always given, don't show them
      case 'connect':
      case 'get_public_key':
        break
      // @ts-ignore
      case 'sign_event':
        // don't let global sign_event perm
        if (kv[1] === '') continue
      // fallthrough
      case 'nip04_decrypt':
      case 'nip04_encrypt':
      case 'nip44_decrypt':
      case 'nip44_encrypt':
        r.push(p)
        break
    }
  }
  return [...new Set(r)]
}

export function formatPermSummary(perms: string[]) {
  const encrypt = perms.includes('nip04_encrypt') || perms.includes('nip44_encrypt')
  const decrypt = perms.includes('nip04_decrypt') || perms.includes('nip44_decrypt')
  const dms = perms.includes('sign_event:4') || perms.includes('sign_event:1059')
  const profile = perms.includes('sign_event:0')
  const contacts = perms.includes('sign_event:3')
  const relays = perms.includes('sign_event:10002')

  const important = []
  if (encrypt && decrypt) important.push('encrypt and decrypt data (DMs)')
  else if (encrypt) important.push('encrypt data (DMs)')
  else if (decrypt) important.push('decrypt data (DMs)')
  if (dms) important.push('send direct messages')
  if (profile) important.push('update your profile')
  if (contacts) important.push('update your contacts')
  if (relays) important.push('update your relays')

  const kinds = []
  for (const p of perms) {
    if (
      p.startsWith('sign_event:') &&
      p !== 'sign_event:0' &&
      p !== 'sign_event:4' &&
      p !== 'sign_event:3' &&
      p !== 'sign_event:10002'
    )
      kinds.push(p.split(':')[1])
  }

  let t = ''
  if (important.length > 0) {
    t += important.join(', ')
  }
  if (kinds.length > 0) {
    if (t) t += ', sign kinds: '
    else t = 'sign kinds: '
    t += kinds.join(', ')
  }

  if (t) t = t[0].toUpperCase() + t.substring(1)
  return t
}

export function getUsablePermList() {
  return ['sign_event', 'nip04_encrypt', 'nip04_decrypt', 'nip44_encrypt', 'nip44_decrypt']
}

export async function fetchNpubNames(npub: string) {
  try {
    const url = `${NOAUTHD_URL}/name?npub=${npub}`
    const response = await fetch(url)
    const names: {
      names: string[]
    } = await response.json()

    return names.names
  } catch (e) {
    console.log('Failed to fetch names for', npub, 'error: ' + e)
    return []
  }
}

export const getDomain = (url: string) => {
  try {
    return new URL(url).hostname
  } catch {
    return ''
  }
}

export const getDomainPort = (url: string) => {
  try {
    return new URL(url).host
  } catch {
    return ''
  }
}

export const getAppDevice = (ua: string) => {
  const Firefox = /Firefox\/[\d]+\.[\d]+(\.[\d]+)?/
  const Seamonkey = /Seamonkey\/[\d]+\.[\d]+(\.[\d]+)?/
  const Chrome = /Chrome\/[\d]+\.[\d]+(\.[\d]+)?/
  const Chromium = /Chromium\/[\d]+\.[\d]+(\.[\d]+)?/
  const Safari = /Safari\/[\d]+\.[\d]+(\.[\d]+)?/
  const OPR = /OPR\/[\d]+\.[\d]+(\.[\d]+)?/
  const Opera = /Opera\/[\d]+\.[\d]+(\.[\d]+)?/
  const Edge = /Edg.*\/[\d]+\.[\d]+(\.[\d]+)?/

  let browser
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Browser_detection_using_the_user_agent#which_part_of_the_user_agent_contains_the_information_you_are_looking_for
  // NOTE: order matters!
  if (ua.match(Seamonkey)) browser = 'Seamonkey'
  else if (ua.match(Firefox)) browser = 'Firefox'
  else if (ua.match(Chromium)) browser = 'Chromium'
  else if (ua.match(Safari) && !ua.match(Chrome)) browser = 'Safari'
  else if (ua.match(Edge)) browser = 'Edge'
  else if (ua.match(Chrome)) browser = 'Chrome'
  else if (ua.match(OPR) || ua.match(Opera)) browser = 'Opera'

  let os
  const Android = /Android/
  const Linux = /Linux/
  const Windows = /Windows/
  const iOS = /iPhone OS/
  const Mac = /Mac OS/
  if (ua.match(Android)) os = 'Android'
  else if (ua.match(Linux)) os = 'Linux'
  else if (ua.match(iOS)) os = 'iOS'
  else if (ua.match(Mac)) os = 'Mac'
  else if (ua.match(Windows)) os = 'Windows'

  if (os && browser) return `${browser}, ${os}`
  else if (browser) return browser
  else if (os) return os
  return ''
}

export const getReferrerAppUrl = () => {
  // console.log('referrer', window.document.referrer)
  if (!window.document.referrer) return ''
  try {
    const u = new URL(window.document.referrer.toLocaleLowerCase())
    if (u.hostname !== DOMAIN && !u.hostname.endsWith('.' + DOMAIN) && u.origin !== window.location.origin)
      return u.origin
  } catch {}
  return ''
}

export const getAppIconTitle = (name: string | undefined, appNpub: string) => {
  return name ? name[0].toLocaleUpperCase() : appNpub.substring(4, 7)
}

export function getActionName(method: string, kind?: number) {
  const action = ACTIONS[method]
  if (method === 'sign_event') {
    if (kind !== undefined) {
      switch (kind) {
        case 0:
          return 'Update your profile'
        case 1:
          return 'Publish note'
        case 3:
          return 'Update your contact list'
        case 4:
          return 'Send direct message'
        case 5:
          return 'Delete event'
        case 6:
          return 'Publish repost'
        case 7:
          return 'Publish reaction'
        case 10002:
          return 'Update your relay list'
      }
      return `${action} of kind ${kind}`
    }
  }
  return action
}

export function getReqActionName(req: DbPending | DbHistory) {
  const kind = req.method === 'sign_event' ? getSignReqKind(req) : undefined
  return getActionName(req.method, kind)
}

export function getPermActionName(req: DbPerm) {
  const method = req.perm.split(':')[0]
  const kind = method === 'sign_event' ? Number(req.perm.split(':')[1]) : undefined
  return getActionName(method, kind)
}

export const isEmptyString = (str = '') => {
  return str.trim().length === 0
}

export const isValidUserName = (username: string) => {
  const REGEX = /^[a-z0-9_\-.]{2,128}$/
  if (!REGEX.test(username.toLowerCase())) return false
  try {
    const { type } = nip19.decode(username)
    if (type === 'nsec') return false
  } catch {}
  return true
}

export const generateNip05 = async () => {
  const nouns = [
    'lion',
    'tiger',
    'bull',
    'bear',
    'wolf',
    'fish',
    'whale',
    'cat',
    'panther',
    'elephant',
    'leopard',
    'jaguar',
    'deer',
    'gorilla',
    'panda',
    'squirrel',
    'wombat',
    'rabbit',
    'ostrich',
    'possum',
    'koala',
    'crocodile',
    'badger',
    'iguana',
    'falcon',
    'owl',
    'puma',
    'goose',
    'peacock',
  ]
  const adjs = [
    'strong',
    'cool',
    'brave',
    'smart',
    'honest',
    'optimistic',
    'adventurous',
    'calm',
    'charming',
    'cheerful',
    'confident',
    'patient',
    'reliable',
    'bright',
    'creative',
    'fast',
    'special',
    'lovely',
  ]
  const MAX_NUMBER = 100
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const adj = adjs[Math.floor(Math.random() * adjs.length)]
  for (let i = 0; i < 3; i++) {
    const id = 1 + Math.floor(Math.random() * MAX_NUMBER - 1)
    const name = `${adj}-${noun}-${id}`
    const nip05 = await fetchNip05(`${name}@${DOMAIN}`)
    if (!nip05) return name
  }

  const id = Math.floor(Math.random() * 100000)
  return `${adj}-${noun}-${id}`
}

export function isDomainOrSubdomain(domain: string, sub: string) {
  console.log('isDomainOrSubdomain', domain, sub)
  return domain === sub || sub.endsWith('.' + domain)
}

// export function parseRebindToken(token: string) {
//   if (!token) return {}
//   console.log("parsing token", token);
//   try {
//     const event = JSON.parse(atob(token));
//     if (!validateEvent(event)) throw new Error('Invalid token');
//     if (!verifySignature(event)) throw new Error('Invalid token signature');
//     if (event.created_at > Date.now() / 1000 + 3) throw new Error("Token time in the future");
//     if (event.created_at < Date.now() / 1000 - 300) throw new Error("Token too old, retry");
//     const pubkey = event.tags.find(t => t.length >= 2 && t[0] === 'p')?.[1];
//     if (!pubkey) throw new Error("Bad token pubkey tag");
//     const npub = nip19.npubEncode(pubkey);
//     const appNpub = nip19.npubEncode(event.pubkey);
//     return {
//       npub, appNpub
//     }
//   } catch (e) {
//     console.log("Bad rebind token", token, e);
//     return {}
//   }
// }
