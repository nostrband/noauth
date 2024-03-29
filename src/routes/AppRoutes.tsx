import { Suspense, lazy } from 'react'
import { Route, Routes, Navigate } from 'react-router-dom'
import { Layout } from '../layout/Layout'
import { CircularProgress, Stack } from '@mui/material'

// Pages
import CreatePage from '@/pages/CreatePage/Create.Page'
import HomePage from '../pages/HomePage/Home.Page'
import KeyPage from '../pages/KeyPage/Key.Page'

const ConfirmPage = lazy(() => import('@/pages/Confirm.Page'))
const AppPage = lazy(() => import('@/pages/AppPage/App.Page'))

const LoadingSpinner = () => (
  <Stack height={'100%'} justifyContent={'center'} alignItems={'center'}>
    <CircularProgress />
  </Stack>
)

const AppRoutes = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route path="/" element={<Navigate to={'/home'} />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/key/:npub" element={<KeyPage />} />
          <Route path="/key/:npub/app/:appNpub" element={<AppPage />} />
          <Route path="/key/:npub/:req_id" element={<ConfirmPage />} />
          <Route path="/create" element={<CreatePage />} />
        </Route>
        <Route path="*" element={<Navigate to={'/home'} />} />
      </Routes>
    </Suspense>
  )
}

export default AppRoutes
