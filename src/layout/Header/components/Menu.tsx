import { Menu as MuiMenu } from '@mui/material'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import LoginIcon from '@mui/icons-material/Login'
import { setThemeMode } from '@/store/reducers/ui.slice'
import { useAppDispatch, useAppSelector } from '@/store/hooks/redux'
import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { MenuButton } from './styled'
import { useOpenMenu } from '@/hooks/useOpenMenu'
import { MenuItem } from './MenuItem'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'

export const Menu = () => {
	const themeMode = useAppSelector((state) => state.ui.themeMode)
	const dispatch = useAppDispatch()
	const { handleOpen } = useModalSearchParams()

	const isDarkMode = themeMode === 'dark'

	const {
		anchorEl,
		handleClose,
		handleOpen: handleOpenMenu,
		open,
	} = useOpenMenu()

	const handleChangeMode = () => {
		dispatch(setThemeMode({ mode: isDarkMode ? 'light' : 'dark' }))
	}
	const handleNavigateToAuth = () => {
		handleOpen(MODAL_PARAMS_KEYS.INITIAL)
		handleClose()
	}

	const themeIcon = isDarkMode ? (
		<DarkModeIcon htmlColor='#fff' />
	) : (
		<LightModeIcon htmlColor='#feb94a' />
	)

	return (
		<>
			<MenuButton onClick={handleOpenMenu}>
				<MenuRoundedIcon color='inherit' />
			</MenuButton>
			<MuiMenu
				anchorEl={anchorEl}
				open={open}
				onClose={handleClose}
				sx={{
					zIndex: 1302,
				}}
			>
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
			</MuiMenu>
		</>
	)
}
