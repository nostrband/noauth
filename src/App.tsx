import { dbi } from './modules/backend/db'
import { useCallback, useEffect, useState } from 'react'
import { client } from './modules/swic'
import { useAppDispatch } from './store/hooks/redux'
import { setApps, setKeys, setPending, setPerms } from './store/reducers/content.slice'
import AppRoutes from './routes/AppRoutes'
import { fetchProfile, ndk } from './modules/common/nostr'
import { ModalInitial } from './components/Modal/ModalInitial/ModalInitial'
import { ModalImportKeys } from './components/Modal/ModalImportKeys/ModalImportKeys'
import { ModalSignUp } from './components/Modal/ModalSignUp/ModalSignUp'
import { ModalLogin } from './components/Modal/ModalLogin/ModalLogin'
import { useSessionStorage } from 'usehooks-ts'
import { RELOAD_STORAGE_KEY } from './utils/consts'
import { ModalExplanation } from './components/Modal/ModalExplanation/ModalExplanation'
import { DbKey } from './modules/common/db-types'

function App() {
  const [render, setRender] = useState(0)
  const dispatch = useAppDispatch()

  // eslint-disable-next-line
  const [_, setNeedReload] = useSessionStorage(RELOAD_STORAGE_KEY, false)

  const [isConnected, setIsConnected] = useState(false)

  const load = useCallback(async () => {
    const keys: DbKey[] = await dbi.listKeys()

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

    const apps = await dbi.listApps()
    const loadApps = async () => {
      const updatedApps = []
      for (const app of apps) {
        const lastActive = await dbi.getAppLastActiveRecord(app)
        updatedApps.push({ ...app, lastActive })
      }
      dispatch(
        setApps({
          apps: updatedApps,
        })
      )
    }
    loadApps()

    const perms = await dbi.listPerms()
    dispatch(setPerms({ perms }))

    const pending = await dbi.listPending()
    dispatch(setPending({ pending }))

    // all updates from backend reloaded,
    // backend replies can be delivered now
    await client.checkpoint()

    // eslint-disable-next-line
  }, [dispatch])

  useEffect(() => {
    if (isConnected) load()
  }, [render, isConnected, load])

  useEffect(() => {
    ndk.connect().then(() => {
      console.log('NDK connected')
      setIsConnected(true)
    })
    // eslint-disable-next-line
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

  useEffect(() => {
    const handleBeforeUnload = () => {
      setNeedReload(false)
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
    // eslint-disable-next-line
  }, [])

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
