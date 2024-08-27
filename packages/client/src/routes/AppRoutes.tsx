import { Suspense, lazy, useEffect } from 'react'
import { Route, Routes, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { Layout } from '../layout/Layout'
import { CircularProgress, Stack } from '@mui/material'

// Pages
import CreatePage from '@/pages/CreatePage/Create.Page'
import HomePage from '../pages/HomePage/Home.Page'

const KeyPage = lazy(() => import('@/pages/KeyPage/Key.Page'))
const AppPage = lazy(() => import('@/pages/AppPage/App.Page'))
const NostrConnectPage = lazy(() => import('@/pages/NostrConnectPage/NostrConnect.Page'))

const LoadingSpinner = () => (
  <Stack height={'100%'} justifyContent={'center'} alignItems={'center'}>
    <CircularProgress />
  </Stack>
)

const NOSTR_CONNECT_PROTOCOL = 'nostrconnect://'

const AppRoutes = () => {
  const navigate = useNavigate()
  const { pathname, search } = useLocation()

  useEffect(() => {
    if (!pathname.includes(NOSTR_CONNECT_PROTOCOL)) return
    const pubkey = pathname.split(NOSTR_CONNECT_PROTOCOL)[1]
    navigate({ pathname: `/nostrconnect/${pubkey}`, search })
    // eslint-disable-next-line
  }, [])

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route path="/" element={<Navigate to={'/home'} replace />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/key/:npub" element={<KeyPage />} />
          <Route path="/key/:npub/app/:appNpub" element={<AppPage />} />
          <Route path="/create" element={<CreatePage />} />
          <Route path="/nostrconnect/:pubkey" element={<NostrConnectPage />} />
        </Route>
        <Route path="*" element={<Navigate to={'/home'} replace />} />
      </Routes>
    </Suspense>
  )
}

export default AppRoutes
