import { Event } from 'nostr-tools'

export interface AugmentedEvent extends Event {
  order: number
  identifier: string
}
