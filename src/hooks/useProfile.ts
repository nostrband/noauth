import { useCallback, useEffect, useState } from 'react'
import { fetchProfile } from '@/modules/nostr'
import { MetaEvent } from '@/types/meta-event'
import { getProfileUsername, getShortenNpub } from '@/utils/helpers/helpers'
import { useAppSelector } from '@/store/hooks/redux'
import { selectKeyByNpub } from '@/store'

const getFirstLetter = (text: string | undefined): string | null => {
  if (!text || text.trim().length === 0) return null
  return text.substring(0, 1).toUpperCase()
}

export const useProfile = (npub: string) => {
  const [profile, setProfile] = useState<MetaEvent | null>(null)
  const currentKey = useAppSelector((state) => selectKeyByNpub(state, npub))

  const userName = currentKey?.name || getProfileUsername(profile) || getShortenNpub(npub)
  const userAvatar = profile?.info?.picture || ''
  const avatarTitle = getFirstLetter(userName)

  const loadProfile = useCallback(async () => {
    if (!npub) return undefined
    try {
      const response = await fetchProfile(npub)
      setProfile(response)
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    }
  }, [npub])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  return {
    profile,
    userName,
    userAvatar,
    avatarTitle,
  }
}
