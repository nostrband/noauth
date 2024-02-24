import { Avatar, Stack, Toolbar, Typography, Divider, DividerProps, styled } from '@mui/material'
import { StyledAppBar, StyledAppLogo, StyledAppName, StyledProfileContainer, StyledThemeButton } from './styled'
import { Menu } from './components/Menu'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ProfileMenu } from './components/ProfileMenu'
import { useProfile } from '@/hooks/useProfile'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import { useAppDispatch, useAppSelector } from '@/store/hooks/redux'
import { setThemeMode } from '@/store/reducers/ui.slice'
import { useSessionStorage } from 'usehooks-ts'
import { RELOAD_STORAGE_KEY } from '@/utils/consts'
import { useCallback } from 'react'

export const Header = () => {
  const themeMode = useAppSelector((state) => state.ui.themeMode)
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [needReload] = useSessionStorage(RELOAD_STORAGE_KEY, false)

  const [searchParams] = useSearchParams()
  const isPopupMode = searchParams.get('popup') === 'true'

  const { npub = '' } = useParams<{ npub: string }>()
  const { userName, userAvatar, avatarTitle } = useProfile(npub)
  const isKeyPage = Boolean(npub)

  const handleNavigate = () => {
    navigate(`/key/${npub}`)
  }

  const isDarkMode = themeMode === 'dark'
  const themeIcon = isDarkMode ? <LightModeIcon htmlColor="#fff" /> : <DarkModeIcon htmlColor="#000" />

  const handleChangeMode = () => {
    dispatch(setThemeMode({ mode: isDarkMode ? 'light' : 'dark' }))
  }

  const renderMenus = useCallback(() => {
    if (isPopupMode && isKeyPage) return null
    return isKeyPage ? <ProfileMenu /> : <Menu />
  }, [isPopupMode, isKeyPage])

  return (
    <StyledAppBar position={needReload ? 'relative' : 'fixed'}>
      <Toolbar sx={{ padding: '12px' }}>
        <Stack direction={'row'} justifyContent={'space-between'} alignItems={'center'} width={'100%'}>
          {isKeyPage && (
            <StyledProfileContainer nonclickable={isPopupMode}>
              <Avatar src={userAvatar} alt={userName} onClick={handleNavigate} className="avatar">
                {avatarTitle}
              </Avatar>
              <Typography fontWeight={600} onClick={handleNavigate} className="username">
                {userName}
              </Typography>
            </StyledProfileContainer>
          )}

          {!isKeyPage && (
            <StyledAppName>
              <StyledAppLogo />
              <span>Nsec.app</span>
            </StyledAppName>
          )}

          <StyledThemeButton onClick={handleChangeMode}>{themeIcon}</StyledThemeButton>

          {renderMenus()}
        </Stack>
      </Toolbar>
      <StyledDivider />
    </StyledAppBar>
  )
}

const StyledDivider = styled((props: DividerProps) => <Divider {...props} />)({
  position: 'absolute',
  bottom: 0,
  width: '100%',
  left: 0,
  height: '2px',
})
