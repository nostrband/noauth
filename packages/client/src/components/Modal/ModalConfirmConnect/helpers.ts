import { Perm } from './types'

export const convertPermListToOptions = (list: string[], npub: string, appNpub: string) => {
  const perms: Perm[] = list.map((p) => {
    return {
      id: p,
      appNpub,
      npub,
      checked: true,
      perm: p,
      timestamp: Date.now(),
      value: '1',
    }
  })
  return perms
}
