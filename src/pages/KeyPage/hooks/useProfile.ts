import { useCallback, useEffect, useState } from 'react'
import { fetchProfile } from '@/modules/nostr'
import { MetaEvent } from '@/types/meta-event'
import { getProfileUsername } from '@/utils/helpers/helpers'
import { DOMAIN } from '@/utils/consts'

export const useProfile = (npub: string) => {
  const [profile, setProfile] = useState<MetaEvent | null>(null)

  const userName = getProfileUsername(profile, npub)
  // FIXME use nip05?
  const userNameWithPrefix = userName + '@' + DOMAIN

  const loadProfile = useCallback(async () => {
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
    userNameWithPrefix,
  }
}
