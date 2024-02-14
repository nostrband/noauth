import { DbKey, dbi } from './modules/db'
import { useCallback, useEffect, useState } from 'react'
import { swicOnRender } from './modules/swic'
import { useAppDispatch } from './store/hooks/redux'
import { setApps, setKeys, setPending, setPerms } from './store/reducers/content.slice'
import AppRoutes from './routes/AppRoutes'
import { fetchProfile, ndk } from './modules/nostr'
import { ModalInitial } from './components/Modal/ModalInitial/ModalInitial'
import { ModalImportKeys } from './components/Modal/ModalImportKeys/ModalImportKeys'
import { ModalSignUp } from './components/Modal/ModalSignUp/ModalSignUp'
import { ModalLogin } from './components/Modal/ModalLogin/ModalLogin'

function App() {
  const [render, setRender] = useState(0)
  const dispatch = useAppDispatch()

  const [isConnected, setIsConnected] = useState(false)

  const load = useCallback(async () => {
    const keys: DbKey[] = await dbi.listKeys()
    console.log(keys, 'keys')

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
    dispatch(
      setApps({
        apps,
      })
    )

    const perms = await dbi.listPerms()
    dispatch(setPerms({ perms }))

    const pending = await dbi.listPending()
    dispatch(setPending({ pending }))

    // rerender
    //		setRender((r) => r + 1)

    // if (!keys.length) handleOpen(MODAL_PARAMS_KEYS.INITIAL)
    // eslint-disable-next-line
  }, [dispatch])

  useEffect(() => {
    if (isConnected) load()
  }, [render, isConnected, load])

  useEffect(() => {
    ndk.connect().then(() => {
      console.log('NDK connected', { ndk })
      setIsConnected(true)
    })
    // eslint-disable-next-line
  }, [])

  // subscribe to updates from the service worker
  swicOnRender(() => {
    console.log('render')
    setRender((r) => r + 1)
  })

  return (
    <>
      <AppRoutes />
      <ModalInitial />
      <ModalImportKeys />
      <ModalSignUp />
      <ModalLogin />
    </>
  )
}

export default App
