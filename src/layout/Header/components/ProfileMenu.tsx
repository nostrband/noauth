import { useOpenMenu } from '@/hooks/useOpenMenu'
import { MenuButton } from './styled'
import {
	Divider,
	Menu,
	Stack,
	MenuItem as MuiMenuItem,
	Typography,
	ListItemIcon,
	Avatar,
} from '@mui/material'
import { MenuItem } from './MenuItem'
import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { useNavigate } from 'react-router-dom'
import LoginIcon from '@mui/icons-material/Login'
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import HomeRoundedIcon from '@mui/icons-material/HomeRounded'
import { useAppDispatch, useAppSelector } from '@/store/hooks/redux'
import { selectKeys } from '@/store'
import { getShortenNpub } from '@/utils/helpers'
import { setThemeMode } from '@/store/reducers/ui.slice'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'

export const ProfileMenu = () => {
	const {
		anchorEl,
		handleOpen: handleOpenMenu,
		open,
		handleClose,
	} = useOpenMenu()
	const { handleOpen } = useModalSearchParams()

	const keys = useAppSelector(selectKeys)
	const themeMode = useAppSelector((state) => state.ui.themeMode)
	const isDarkMode = themeMode === 'dark'

	const dispatch = useAppDispatch()
	const navigate = useNavigate()

	const handleNavigateToAuth = () => {
		handleOpen(MODAL_PARAMS_KEYS.INITIAL)
		handleClose()
	}

	const handleNavigateHome = () => {
		navigate('/home')
		handleClose()
	}

	const handleChangeMode = () => {
		dispatch(setThemeMode({ mode: isDarkMode ? 'light' : 'dark' }))
	}

	const handleNavigateToKeyInnerPage = (npub: string) => {
		return () => {
			navigate('/key/' + npub)
			handleClose()
		}
	}

	const themeIcon = isDarkMode ? (
		<DarkModeIcon htmlColor='#fff' />
	) : (
		<LightModeIcon htmlColor='#feb94a' />
	)

	return (
		<>
			<MenuButton onClick={handleOpenMenu}>
				<KeyboardArrowDownRoundedIcon
					color='inherit'
					fontSize='large'
				/>
			</MenuButton>
			<Menu
				open={open}
				anchorEl={anchorEl}
				onClose={handleClose}
				sx={{
					zIndex: 1302,
				}}
			>
				<Stack maxHeight={'10rem'} overflow={'auto'}>
					{keys.map((key) => {
						const userName = key.name || getShortenNpub(key.npub)
						return (
							<MuiMenuItem
								sx={{ gap: '0.5rem' }}
								onClick={handleNavigateToKeyInnerPage(key.npub)}
								key={key.npub}
							>
								<ListItemIcon>
									<Avatar
										src={key.avatar || ''}
										alt={userName}
										sx={{ width: 36, height: 36 }}
									/>
								</ListItemIcon>
								<Typography variant='body2' noWrap>
									{userName}
								</Typography>
							</MuiMenuItem>
						)
					})}
				</Stack>
				<Divider />
				<MenuItem
					Icon={<HomeRoundedIcon />}
					onClick={handleNavigateHome}
					title='Home'
				/>
				<MenuItem
					Icon={<LoginIcon />}
					onClick={handleNavigateToAuth}
					title='Sign up'
				/>
				<MenuItem
					Icon={themeIcon}
					onClick={handleChangeMode}
					title='Change theme'
				/>
			</Menu>
		</>
	)
}
