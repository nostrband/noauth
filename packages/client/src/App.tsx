import { useCallback, useEffect, useState } from 'react'
import { useAppDispatch } from './store/hooks/redux'
import { setApps, setKeys, setPending, setPerms } from './store/reducers/content.slice'
import AppRoutes from './routes/AppRoutes'
import { fetchProfile, ndk } from '@noauth/common'
import { ModalInitial } from './components/Modal/ModalInitial/ModalInitial'
import { ModalImportKeys } from './components/Modal/ModalImportKeys/ModalImportKeys'
import { ModalSignUp } from './components/Modal/ModalSignUp/ModalSignUp'
import { ModalLogin } from './components/Modal/ModalLogin/ModalLogin'
import { useSessionStorage } from 'usehooks-ts'
import { RELOAD_STORAGE_KEY } from './utils/consts'
import { ModalExplanation } from './components/Modal/ModalExplanation/ModalExplanation'
import { client } from './modules/client'
import { LoadingSpinner } from './shared/LoadingSpinner/LoadingSpinner'
import { Stack } from '@mui/material'

function App() {
  const [render, setRender] = useState(0)
  const dispatch = useAppDispatch()

  const [isLoading, setIsLoading] = useState(true)

  // eslint-disable-next-line
  const [_, setNeedReload] = useSessionStorage(RELOAD_STORAGE_KEY, false)

  const [isNdkConnected, setIsNdkConnected] = useState(false)
  const [isClientConnected, setIsClientConnected] = useState(false)

  const load = useCallback(async () => {
    const keys = await client.getListKeys()
    dispatch(setKeys({ keys }))

    const loadProfiles = async () => {
      const newKeys = []

      for (const key of keys) {
        // make it async
        const response = await fetchProfile(key.npub)
        if (!response) {
          newKeys.push(key)
        } else {
          newKeys.push({ ...key, profile: response })
        }
      }

      dispatch(setKeys({ keys: newKeys }))
    }
    // async load to avoid blocking main code below
    loadProfiles()

    const apps = await client.getListApps()

    const loadApps = async () => {
      const updatedApps = []
      for (const app of apps) {
        const lastActive = await client.getAppLastActiveRecord(app)
        updatedApps.push({ ...app, lastActive })
      }
      dispatch(
        setApps({
          apps: updatedApps,
        })
      )
    }
    loadApps()

    const perms = await client.getListPerms()
    dispatch(setPerms({ perms }))

    const pending = await client.getListPendingRequests()
    dispatch(setPending({ pending }))

    // all updates from backend reloaded,
    // backend replies can be delivered now
    await client.checkpoint()
    setIsLoading(false)

    // eslint-disable-next-line
  }, [])

  useEffect(() => {
    if (isNdkConnected && isClientConnected) load()
  }, [isNdkConnected, isClientConnected, load, render])

  useEffect(() => {
    Promise.race([ndk.connect(), new Promise((ok) => setTimeout(ok, 1000))]).then(() => {
      console.log('NDK connected')
      setIsNdkConnected(true)
    })
    // eslint-disable-next-line
  }, [])

  useEffect(() => {
    client.connect().then((connected) => {
      if (!connected) return
      setIsClientConnected(true)
      console.log('Client connected')
    })
  }, [])

  // subscribe to updates from the service worker
  client.setOnRender(() => {
    console.log('render')
    setRender((r) => r + 1)
  })

  // subscribe to service worker updates
  client.setOnReload(() => {
    console.log('reload')
    setNeedReload(true)
  })

  client.setOnClose(() => {
    setIsLoading(false)
  })

  useEffect(() => {
    const handleBeforeUnload = () => setNeedReload(false)
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    // eslint-disable-next-line
  }, [])

  if (isLoading) {
    return (
      <Stack alignItems={'center'} justifyContent={'center'} height={'100%'}>
        <LoadingSpinner mode="secondary" size={'2rem'} />
      </Stack>
    )
  }

  return (
    <>
      <AppRoutes />
      <ModalInitial />
      <ModalExplanation />
      <ModalImportKeys />
      <ModalSignUp />
      <ModalLogin />
    </>
  )
}

export default App
