import { useCallback, useEffect, useState } from 'react'
import { useAppSelector } from '@/store/hooks/redux'
import { selectKeyByNpub } from '@/store'
import { MetaEvent } from '@/modules/common/meta-event'
import { getProfileUsername, getShortenNpub } from '@/modules/common/helpers'
import { fetchProfile } from '@/modules/common/nostr'

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
