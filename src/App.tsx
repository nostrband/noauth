import { DbPending, dbi } from './modules/db'
import { useEffect, useState } from 'react'
import { swicOnRender } from './modules/swic'
import { useAppDispatch } from './store/hooks/redux'
import {
	setApps,
	setKeys,
	setPending,
	setPerms,
} from './store/reducers/content.slice'
import AppRoutes from './routes/AppRoutes'
import { ndk } from './modules/nostr'
import { useModalSearchParams } from './hooks/useModalSearchParams'
import { MODAL_PARAMS_KEYS } from './types/modal'
import { ModalInitial } from './components/Modal/ModalInitial/ModalInitial'
import { ModalImportKeys } from './components/Modal/ModalImportKeys/ModalImportKeys'
import { ModalSignUp } from './components/Modal/ModalSignUp/ModalSignUp'
import { ModalLogin } from './components/Modal/ModalLogin/ModalLogin'

function App() {
	const [render, setRender] = useState(0)
	const { handleOpen } = useModalSearchParams()
	const dispatch = useAppDispatch()

	const load = async () => {
		const keys = await dbi.listKeys()
		dispatch(setKeys({ keys }))

		const apps = await dbi.listApps()
		dispatch(
			setApps({
				apps: apps.map((app) => ({
					...app,
					// MOCK IMAGE
					icon: 'https://nostr.band/android-chrome-192x192.png',
				})),
			}),
		)

		const perms = await dbi.listPerms()
		dispatch(setPerms({ perms }))

		const pending = await dbi.listPending()
		const firstPending = new Map<string, DbPending>()
		for (const p of pending) {
			if (firstPending.get(p.appNpub)) continue
			firstPending.set(p.appNpub, p)
		}

		// @ts-ignore
		setPending([...firstPending.values()])
		dispatch(setPending({ pending }))

		// rerender
		setRender((r) => r + 1)
	}

	useEffect(() => {
		load()
		// eslint-disable-next-line
	}, [render])

	useEffect(() => {
		ndk.connect().then(() => {
			console.log('NDK connected')
			handleOpen(MODAL_PARAMS_KEYS.INITIAL)
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
