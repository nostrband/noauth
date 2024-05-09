import { Menu as MuiMenu } from '@mui/material'
import LoginIcon from '@mui/icons-material/Login'
import PersonAddAltRoundedIcon from '@mui/icons-material/PersonAddAltRounded'
import { useAppSelector } from '@/store/hooks/redux'
import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { MenuButton } from './styled'
import { useOpenMenu } from '@/hooks/useOpenMenu'
import { MenuItem } from './MenuItem'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import { selectKeys } from '@/store'

export const Menu = () => {
  const keys = useAppSelector(selectKeys)
  const { handleOpen } = useModalSearchParams()
  const { anchorEl, handleClose, handleOpen: handleOpenMenu, open } = useOpenMenu()

  const isNoKeys = !keys || keys.length === 0

  const handleNavigateToAuth = () => {
    handleOpen(MODAL_PARAMS_KEYS.INITIAL)
    handleClose()
  }

  return (
    <>
      <MenuButton onClick={handleOpenMenu}>
        <MenuRoundedIcon color="inherit" />
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
          Icon={isNoKeys ? <LoginIcon /> : <PersonAddAltRoundedIcon />}
          onClick={handleNavigateToAuth}
          title={isNoKeys ? 'Sign up' : 'Add account'}
        />
      </MuiMenu>
    </>
  )
}
