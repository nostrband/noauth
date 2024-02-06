import { Avatar, Stack, Toolbar, Typography } from '@mui/material'
import { AppLogo } from '../../assets'
import { StyledAppBar, StyledAppName } from './styled'
import { Menu } from './components/Menu'
import { useNavigate, useParams } from 'react-router-dom'
import { ProfileMenu } from './components/ProfileMenu'
import { useProfile } from '@/hooks/useProfile'

export const Header = () => {
	const { npub = '' } = useParams<{ npub: string }>()
	const { userName, userAvatar, avatarTitle } = useProfile(npub)
	const showProfile = Boolean(npub)

	const navigate = useNavigate()

	const handleNavigate = () => {
		navigate(`/key/${npub}`)
	}

	return (
		<StyledAppBar position='fixed'>
			<Toolbar sx={{ padding: '12px' }}>
				<Stack
					direction={'row'}
					justifyContent={'space-between'}
					alignItems={'center'}
					width={'100%'}
				>
					{showProfile && (
						<Stack
							gap={'1rem'}
							direction={'row'}
							alignItems={'center'}
							flex={1}
						>
							<Avatar
								src={userAvatar}
								alt={userName}
								onClick={handleNavigate}
							>
								{avatarTitle}
							</Avatar>
							<Typography
								fontWeight={600}
								onClick={handleNavigate}
							>
								{userName}
							</Typography>
						</Stack>
					)}

					{!showProfile && (
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
