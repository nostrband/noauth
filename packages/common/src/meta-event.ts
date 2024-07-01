import { Meta } from './meta'
import { AugmentedEvent } from './augmented-event'

export interface MetaEvent extends AugmentedEvent {
  info?: Meta
}

export function createMetaEvent(e: AugmentedEvent): MetaEvent {
  return e as MetaEvent
}
