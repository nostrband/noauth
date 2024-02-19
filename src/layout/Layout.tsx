import { FC } from 'react'
import { Outlet, useSearchParams } from 'react-router-dom'
import { Header } from './Header/Header'
import { Container, ContainerProps, styled } from '@mui/material'
import { ReloadBadge } from '@/components/ReloadBadge/ReloadBadge'

export const Layout: FC = () => {
  const [searchParams] = useSearchParams()
  const needReload = searchParams.get('reload') === 'true'

  return (
    <StyledContainer maxWidth="md" className={needReload ? 'reload' : ''}>
      <ReloadBadge />
      <Header />
      <main>
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
  '&': {
    flex: 1,
    maxHeight: '100%',
  },
  '&:not(.reload) > main': {
    paddingTop: 'calc(66px + 1rem)',
  },
})
