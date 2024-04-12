import { selectAppsByNpub } from '@/store'
import { useAppSelector } from '@/store/hooks/redux'
import { SubNpubProfile, SubNpubsMap } from '@/types/general'

type usePrepareSubNpubListReturnType = {
  subNpubs: SubNpubProfile[]
}

export const usePrepareSubNpubList = (npub: string): usePrepareSubNpubListReturnType => {
  const apps = useAppSelector((state) => selectAppsByNpub(state, npub))

  const filteredSubNpubs = apps.filter((app) => !!app.subNpub)

  const subNpubsMap = filteredSubNpubs.reduce<SubNpubsMap>((acc, current) => {
    if (!current.subNpub) return acc

    if (!acc[current.subNpub]) {
      const subNpubProfile = {
        picture: '',
        subNpub: current.subNpub,
      }
      return {
        ...acc,
        [current.subNpub]: subNpubProfile,
      }
    }
    return acc
  }, {})

  const subNpubProfiles = Object.values(subNpubsMap)

  return {
    subNpubs: subNpubProfiles,
  }
}
