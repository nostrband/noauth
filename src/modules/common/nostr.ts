import NDK, { NDKEvent, NostrEvent } from '@nostr-dev-kit/ndk'
import { nip19 } from 'nostr-tools'
import { MetaEvent, createMetaEvent } from './meta-event'
import { AugmentedEvent } from './augmented-event'
import { Meta, createMeta } from './meta'

const profileCache = new Map<string, MetaEvent | null>()

export const ndk = new NDK({
  explicitRelayUrls: ['wss://relay.nostr.band/all', 'wss://relay.damus.io', 'wss://nos.lol', 'wss://purplepag.es'],
})

export function nostrEvent(e: Required<NDKEvent>) {
  return {
    id: e.id,
    created_at: e.created_at,
    pubkey: e.pubkey,
    kind: e.kind,
    tags: e.tags,
    content: e.content,
    sig: e.sig,
  }
}
function rawEvent(e: Required<NDKEvent>): AugmentedEvent {
  return {
    ...nostrEvent(e),
    identifier: getTagValue(e as NDKEvent, 'd'),
    order: e.created_at as number,
  }
}

function parseContentJson(c: string): object {
  try {
    return JSON.parse(c)
  } catch (e) {
    console.log('Bad json: ', c, e)
    return {}
  }
}

export function getTags(e: AugmentedEvent | NDKEvent | MetaEvent, name: string): string[][] {
  return e.tags.filter((t: string[]) => t.length > 0 && t[0] === name)
}

export function getTag(e: AugmentedEvent | NDKEvent | MetaEvent, name: string): string[] | null {
  const tags = getTags(e, name)
  if (tags.length === 0) return null
  return tags[0]
}

export function getTagValue(
  e: AugmentedEvent | NDKEvent | MetaEvent,
  name: string,
  index: number = 0,
  def: string = ''
): string {
  const tag = getTag(e, name)
  if (tag === null || !tag.length || (index && index >= tag.length)) return def
  return tag[1 + index]
}

export function parseProfileJson(e: NostrEvent): Meta {
  // all meta fields are optional so 'as' works fine
  const profile = createMeta(parseContentJson(e.content))
  profile.pubkey = e.pubkey
  profile.npub = nip19.npubEncode(e.pubkey)
  return profile
}

export async function fetchProfile(npubToken: string): Promise<MetaEvent | null> {
  const npub = npubToken.includes('#') ? npubToken.split('#')[0] : npubToken
  const cached = profileCache.get(npub)
  if (cached !== undefined) return cached

  const { type, data: pubkey } = nip19.decode(npubToken)
  if (type !== 'npub') return null

  const event = await ndk.fetchEvent({ kinds: [0], authors: [pubkey] })

  if (event) {
    const augmentedEvent = rawEvent(event as Required<NDKEvent>)
    const m = createMetaEvent(augmentedEvent)
    m.info = parseProfileJson(m)
    profileCache.set(npub, m)
    return m
  }

  return null
}
