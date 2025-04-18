import { useCallback, useEffect, useState } from 'react'
import { useAppSelector } from '@/store/hooks/redux'
import { selectKeyByNpub } from '@/store'
import { MetaEvent, fetchProfile } from '@noauth/common'
import { getProfileUsername, getShortenNpub } from '@noauth/common'

const getFirstLetter = (text: string | undefined): string | null => {
  if (!text || text.trim().length === 0) return null
  return text.substring(0, 1).toUpperCase()
}

export const useProfile = (npub: string) => {
  const currentKey = useAppSelector((state) => selectKeyByNpub(state, npub))

  const [profile, setProfile] = useState<MetaEvent | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const userName = currentKey?.name || getProfileUsername(profile) || getShortenNpub(npub)
  const userAvatar = profile?.info?.picture || ''
  const avatarTitle = getFirstLetter(userName)

  const loadProfile = useCallback(async () => {
    if (!npub) return undefined
    try {
      setIsLoading(true)
      const response = await fetchProfile(npub)
      setProfile(response)
      setIsLoading(false)
    } catch (error) {
      console.error('Failed to fetch profile:', error)
      setIsLoading(false)
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
    isLoading,
  }
}
