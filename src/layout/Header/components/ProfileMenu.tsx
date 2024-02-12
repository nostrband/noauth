import { useOpenMenu } from '@/hooks/useOpenMenu'
import { MenuButton } from './styled'
import { Divider, Menu } from '@mui/material'
import { MenuItem } from './MenuItem'
import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { useNavigate } from 'react-router-dom'
import LoginIcon from '@mui/icons-material/Login'
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import HomeRoundedIcon from '@mui/icons-material/HomeRounded'
import PersonAddAltRoundedIcon from '@mui/icons-material/PersonAddAltRounded'
import { useAppSelector } from '@/store/hooks/redux'
import { selectKeys } from '@/store'

import { ListProfiles } from './ListProfiles'
import { DbKey } from '@/modules/db'

export const ProfileMenu = () => {
  const { anchorEl, handleOpen: handleOpenMenu, open, handleClose } = useOpenMenu()
  const { handleOpen } = useModalSearchParams()

  const keys = useAppSelector(selectKeys)
  const isNoKeys = !keys || keys.length === 0

  const navigate = useNavigate()

  const handleNavigateToAuth = () => {
    handleOpen(MODAL_PARAMS_KEYS.INITIAL)
    handleClose()
  }

  const handleNavigateHome = () => {
    navigate('/home')
    handleClose()
  }

  const handleNavigateToKeyInnerPage = (key: DbKey) => {
    navigate('/key/' + key.npub)
    handleClose()
  }

  return (
    <>
      <MenuButton onClick={handleOpenMenu}>
        <KeyboardArrowDownRoundedIcon color="inherit" fontSize="large" />
      </MenuButton>
      <Menu
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        sx={{
          zIndex: 1302,
        }}
      >
        <ListProfiles keys={keys} onClickItem={handleNavigateToKeyInnerPage} />
        <Divider />
        <MenuItem Icon={<HomeRoundedIcon />} onClick={handleNavigateHome} title="Home" />
        <MenuItem
          Icon={isNoKeys ? <LoginIcon /> : <PersonAddAltRoundedIcon />}
          onClick={handleNavigateToAuth}
          title={isNoKeys ? 'Sign up' : 'Add account'}
        />
      </Menu>
    </>
  )
}
