import { Key } from './types'

export interface GlobalContext {
  btoa: (data: string) => Promise<string>
  getOrigin: (iframe?: boolean) => string
  getCryptoSubtle: () => any
  getKey(npub: string): Key

  getNoauthdUrl: () => string
  getDomain: () => string
  getNsecAppNpub: () => string
  getNip46Relays: () => string[]
}
