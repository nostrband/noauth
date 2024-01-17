import { Avatar, Stack, Toolbar, Typography } from '@mui/material'

import { AppLogo } from '../../assets'
import { StyledAppBar, StyledAppName } from './styled'
import { Menu } from './components/Menu'
import { useParams } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import { MetaEvent } from '@/types/meta-event'
import { nip19 } from 'nostr-tools'
import { fetchProfile } from '@/modules/nostr'
import { ProfileMenu } from './components/ProfileMenu'
import { getShortenNpub } from '@/utils/helpers'

export const Header = () => {
	const { npub = '' } = useParams<{ npub: string }>()

	const [profile, setProfile] = useState<MetaEvent | null>(null)

	const load = useCallback(async () => {
		if (!npub) return setProfile(null)

		try {
			const npubToken = npub.includes('#') ? npub.split('#')[0] : npub
			const { type, data: pubkey } = nip19.decode(npubToken)
			if (type !== 'npub') return undefined

			const response = await fetchProfile(pubkey)

			setProfile(response as any)
		} catch (e) {
			return setProfile(null)
		}
	}, [npub])

	useEffect(() => {
		load()
	}, [load])

	const showProfile = Boolean(npub || profile)
	const userName = profile?.info?.name || getShortenNpub(npub)
	const userAvatar = profile?.info?.picture || ''

	return (
		<StyledAppBar position='fixed'>
			<Toolbar sx={{ padding: '12px' }}>
				<Stack
					direction={'row'}
					justifyContent={'space-between'}
					alignItems={'center'}
					width={'100%'}
				>
					{showProfile ? (
						<Stack
							gap={'1rem'}
							direction={'row'}
							alignItems={'center'}
							flex={1}
						>
							<Avatar src={userAvatar} alt={userName} />
							<Typography fontWeight={600}>{userName}</Typography>
						</Stack>
					) : (
						<StyledAppName>
							<AppLogo />
							<span>Nsec.app</span>
						</StyledAppName>
					)}

					{showProfile ? <ProfileMenu /> : <Menu />}
				</Stack>
			</Toolbar>
		</StyledAppBar>
	)
}
