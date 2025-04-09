import { Event } from 'nostr-tools'

export type IEnclave = {
  event: Event
  prod: boolean
  debug: boolean
  builder: string
  launcher: string
  version: string
}
