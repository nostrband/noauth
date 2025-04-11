import { Event, nip19 } from 'nostr-tools'
import { hexToBytes } from '@noble/hashes/utils'
import { IEnclave } from './types'

export function parseEnclave(e: Event): IEnclave | null {
  try {
    return {
      event: e,
      prod: !!e.tags.find((t) => t.length > 1 && t[0] === 't' && t[1] === 'prod'),
      debug: !hexToBytes(e.tags.find((t) => t.length > 2 && t[0] === 'x' && t[2] === 'PCR0')![1]).find((c) => c !== 0),
      builder: e.tags.find((t) => t.length > 2 && t[0] === 'p' && t[2] === 'builder')?.[1] || '',
      launcher: e.tags.find((t) => t.length > 2 && t[0] === 'p' && t[2] === 'builder')?.[1] || '',
      version: e.tags.find((t) => t.length > 1 && t[0] === 'v')?.[1] || '',
    }
  } catch (err) {
    console.log('bad enclave', e, err)
    return null
  }
}

export const getNjumpLink = (id: any) => {
  const event = nip19.neventEncode({ id, relays: ['wss://relay.nostr.band/all'] })
  return 'https://njump.me/' + event
}

export function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined
}

export type EnclaveEnvironment = 'dev' | 'prod' | 'debug'

export const getEnvironmentStatus = (prod: boolean, debug: boolean) => {
  let envLabel: EnclaveEnvironment = 'dev'
  if (prod) envLabel = 'prod'
  else if (debug) envLabel = 'debug'
  return envLabel
}

export function tv(e: Event, name: string) {
  return e.tags.find((t) => t.length > 1 && t[0] === name)?.[1]
}
