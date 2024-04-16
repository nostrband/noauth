import { usePrepareSubNpubList } from '@/hooks/usePrepareSubNpubList'
import { selectAppsByNpub } from '@/store'
import { useAppSelector } from '@/store/hooks/redux'
import { IClientApp, SubNpubProfile } from '@/types/general'
import { useCallback, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

type usePrepareAppsReturnType = {
  apps: IClientApp[]
  subNpubAppsExists: boolean
  subNpubProfiles: SubNpubProfile[]
  onResetSubNpub: () => void
  subNpub: string
}

export const usePrepareApps = (npub: string): usePrepareAppsReturnType => {
  const apps = useAppSelector((state) => selectAppsByNpub(state, npub))
  const [searchParams, setSearchParams] = useSearchParams()
  const { subNpubs } = usePrepareSubNpubList(npub)

  const subNpubParam = searchParams.get('subNpub') || ''

  const npubApps = apps.filter((app) => !app.subNpub)

  const filteredSubNpubs = apps.filter((app) => !!app.subNpub)
  const subNpubApps = filteredSubNpubs.filter((app) => app.subNpub === subNpubParam)
  const subNpubAppsExists = filteredSubNpubs.length > 0

  useEffect(() => {
    if (!subNpubParam.trim().length) return
    const isSubNpubExists = apps.find((app) => app.subNpub === subNpubParam)
    if (!isSubNpubExists) searchParams.delete('subNpub')
  }, [apps, searchParams, subNpubParam])

  const handleResetSubNpubParam = useCallback(() => {
    searchParams.delete('subNpub')
    setSearchParams(searchParams)
  }, [searchParams, setSearchParams])

  const returnApps = subNpubParam ? subNpubApps : npubApps

  return {
    apps: returnApps,
    subNpubAppsExists,
    subNpubProfiles: subNpubs,
    onResetSubNpub: handleResetSubNpubParam,
    subNpub: subNpubParam,
  }
}
