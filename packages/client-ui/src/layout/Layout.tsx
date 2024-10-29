import { FC } from 'react'
import { Outlet, useSearchParams } from 'react-router-dom'
import { Header } from './Header/Header'
import { Container, ContainerProps, styled } from '@mui/material'
import { ReloadBadge } from '@/components/ReloadBadge/ReloadBadge'
import { useSessionStorage } from 'usehooks-ts'
import { RELOAD_STORAGE_KEY } from '@/utils/consts'

export const Layout: FC = () => {
  const [needReload] = useSessionStorage(RELOAD_STORAGE_KEY, false)
  const [searchParams] = useSearchParams()
  const isPopupMode = searchParams.get('popup') === 'true'
  const isAuthUrl = !!searchParams.get('auth_url')
  const showReloadBadge = !isAuthUrl && !isPopupMode && needReload
  const containerClassName = showReloadBadge ? 'reload' : ''

  return (
    <StyledContainer maxWidth="md" className={containerClassName}>
      {isAuthUrl && (
        <style>{`
          body {
            background-color: #ffffff00;
            overflow: hidden;
          }
      `}</style>
      )}
      {!isAuthUrl && (
        <>
          <ReloadBadge />
          <Header />
        </>
      )}
      <main style={isAuthUrl ? { paddingTop: '0' } : {}}>
        <Outlet />
      </main>
    </StyledContainer>
  )
}

const StyledContainer = styled((props: ContainerProps) => <Container maxWidth="sm" {...props} />)({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  paddingBottom: '1rem',
  position: 'relative',
  '& > main': {
    flex: 1,
    maxHeight: '100%',
  },
  '&:not(.reload) > main': {
    paddingTop: 'calc(66px + 1rem)',
  },
  '@media screen and (max-width: 320px)': {
    marginBottom: '0.25rem',
    paddingLeft: '0.75rem',
    paddingBottom: '0.75rem',
    paddingRight: '0.75rem',
  },
})
