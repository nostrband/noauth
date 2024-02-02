import { useCallback, useEffect, useState } from 'react'
import { fetchProfile } from '@/modules/nostr'
import { MetaEvent } from '@/types/meta-event'
import { getProfileUsername } from '@/utils/helpers/helpers'

export const useProfile = (npub: string) => {
	const [profile, setProfile] = useState<MetaEvent | null>(null)

	const userName = getProfileUsername(profile, npub)
	const userNameWithPrefix = userName + '@nsec.app'

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
