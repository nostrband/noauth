import { DbApp, DbPerm } from '@/modules/db'
import { selectPermsByNpub } from '@/store'
import { useAppSelector } from '@/store/hooks/redux'
import { getDomainPort } from '@/utils/helpers/helpers'
import { useMemo } from 'react'

type AppPermsMap = { [permId: string]: DbPerm }

export const usePrepareExistingAppPerms = (npub: string, appDomain: string, apps: DbApp[]) => {
  const perms = useAppSelector((state) => selectPermsByNpub(state, npub))
  return useMemo(() => {

    const appsWithSameDomain = apps.filter((app) => !!appDomain && getDomainPort(app.url) === appDomain)

    const permsMap = perms.reduce<AppPermsMap>((acc, perm) => {
      if (perm.value === '0' || perm.perm === 'connect' || perm.perm === 'get_public_key') return acc

      const isAppPerm = appsWithSameDomain.some((app) => app.appNpub === perm.appNpub)
      if (!isAppPerm) return acc

      if (acc[perm.perm]) return acc

      return {
        ...acc,
        [perm.perm]: perm,
      }
    }, {})

    const appExistingPerms = Object.values(permsMap)

    return appExistingPerms
  }, [perms, appDomain, apps])
}
