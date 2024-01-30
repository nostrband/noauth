import { Menu as MuiMenu } from '@mui/material'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import LoginIcon from '@mui/icons-material/Login'
import PersonAddAltRoundedIcon from '@mui/icons-material/PersonAddAltRounded'
import { setThemeMode } from '@/store/reducers/ui.slice'
import { useAppDispatch, useAppSelector } from '@/store/hooks/redux'
import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { MenuButton } from './styled'
import { useOpenMenu } from '@/hooks/useOpenMenu'
import { MenuItem } from './MenuItem'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import { selectKeys } from '@/store'

export const Menu = () => {
	const themeMode = useAppSelector((state) => state.ui.themeMode)
	const keys = useAppSelector(selectKeys)
	const dispatch = useAppDispatch()
	const { handleOpen } = useModalSearchParams()

	const isDarkMode = themeMode === 'dark'
	const isNoKeys = !keys || keys.length === 0

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
					Icon={
						isNoKeys ? <LoginIcon /> : <PersonAddAltRoundedIcon />
					}
					onClick={handleNavigateToAuth}
					title={isNoKeys ? 'Sign up' : 'Add account'}
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
