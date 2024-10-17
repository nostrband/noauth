import { NIP46_RELAYS } from '@/utils/consts'
import { createFilterOptions } from '@mui/material'
import { nip19 } from 'nostr-tools'
import { SubNpubOptionType } from './types'

export const getBunkerLink = (npub: string, token = '') => {
  const { data: pubkey } = nip19.decode(npub)
  return `bunker://${pubkey}?relay=${NIP46_RELAYS[0]}${token ? `&secret=${token}` : ''}`
}

export const filter = createFilterOptions<SubNpubOptionType>()
