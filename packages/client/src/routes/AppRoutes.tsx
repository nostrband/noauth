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
const ImportConnectPage = lazy(() => import('@/pages/ImportConnectPage/ImportConnect.Page'))

const LoadingSpinner = () => (
  <Stack height={'100%'} justifyContent={'center'} alignItems={'center'}>
    <CircularProgress />
  </Stack>
)

const NOSTR_CONNECT_PROTOCOL = 'nostrconnect://'
const IMPORT_HASH_KEY = 'import'

const AppRoutes = () => {
  const navigate = useNavigate()
  const { pathname, search, hash } = useLocation()

  useEffect(() => {
    if (!pathname.includes(NOSTR_CONNECT_PROTOCOL)) return
    const pubkey = pathname.split(NOSTR_CONNECT_PROTOCOL)[1]
    const parsedHash = new URLSearchParams(hash.substring(1))
    const nsec = parsedHash.get(IMPORT_HASH_KEY)

    if (nsec) {
      return navigate({
        pathname: `/importconnect/${nsec}`,
        search: search,
        hash: hash,
      })
    }
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
          <Route path="/importconnect/:nsec" element={<ImportConnectPage />} />
        </Route>
        <Route path="*" element={<Navigate to={'/home'} replace />} />
      </Routes>
    </Suspense>
  )
}

export default AppRoutes
