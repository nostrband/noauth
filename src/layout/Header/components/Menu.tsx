import {
	IconButton,
	IconButtonProps,
	ListItemIcon,
	MenuItem,
	MenuItemProps,
	Menu as MuiMenu,
	Typography,
	styled,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import LoginIcon from '@mui/icons-material/Login'
import { setThemeMode } from '@/store/reducers/ui.slice'
import { useAppDispatch, useAppSelector } from '@/store/hooks/redux'
import { ReactNode, useState } from 'react'
import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { MODAL_PARAMS_KEYS } from '@/types/modal'

const renderMenuItem = (
	Icon: ReactNode,
	handler: () => void,
	title: string | ReactNode,
) => {
	return (
		<StyledMenuItem onClick={handler}>
			<ListItemIcon>{Icon}</ListItemIcon>
			<Typography fontWeight={500} variant='body2' noWrap>
				{title}
			</Typography>
		</StyledMenuItem>
	)
}

export const Menu = () => {
	const themeMode = useAppSelector((state) => state.ui.themeMode)
	const dispatch = useAppDispatch()
	const { handleOpen } = useModalSearchParams()

	const isDarkMode = themeMode === 'dark'

	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

	const open = Boolean(anchorEl)

	const handleClick = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorEl(event.currentTarget)
	}
	const handleClose = () => {
		setAnchorEl(null)
	}

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
			<BurgerButton onClick={handleClick} />
			<MuiMenu anchorEl={anchorEl} open={open} onClose={handleClose}>
				{renderMenuItem(<LoginIcon />, handleNavigateToAuth, 'Sign up')}
				{renderMenuItem(themeIcon, handleChangeMode, 'Change theme')}
			</MuiMenu>
		</>
	)
}

const BurgerButton = styled((props: IconButtonProps) => (
	<IconButton {...props}>
		<MenuIcon color='inherit' />
	</IconButton>
))(({ theme }) => {
	const isDark = theme.palette.mode === 'dark'
	return {
		borderRadius: '1rem',
		background: isDark ? '#333333A8' : 'transparent',
		color: isDark ? '#FFFFFFA8' : 'initial',
	}
})

const StyledMenuItem = styled((props: MenuItemProps) => (
	<MenuItem {...props} />
))(() => ({
	padding: '0.5rem 1rem',
}))
