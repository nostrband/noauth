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

function App() {
	const [render, setRender] = useState(0)
	// const [keys, setKeys] = useState<DbKey[]>([])
	// const [apps, setApps] = useState<DbApp[]>([])
	// const [perms, setPerms] = useState<DbPerm[]>([])
	// const [pending, setPending] = useState<DbPending[]>([])

	const dispatch = useAppDispatch()

	const load = async () => {
		const keys = await dbi.listKeys()
		dispatch(setKeys({ keys }))

		const apps = await dbi.listApps()
		dispatch(setApps({ apps }))

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
		ndk.connect().then(() => console.log('NDK connected'))
	}, [])

	// async function askNotificationPermission() {
	// 	return new Promise<void>((ok, rej) => {
	// 		// Let's check if the browser supports notifications
	// 		if (!('Notification' in window)) {
	// 			log('This browser does not support notifications.')
	// 			rej()
	// 		} else {
	// 			Notification.requestPermission().then(() => {
	// 				log('notifications perm' + Notification.permission)
	// 				if (Notification.permission === 'granted') ok()
	// 				else rej()
	// 			})
	// 		}
	// 	})
	// }

	// async function enableNotifications() {
	// 	await askNotificationPermission()
	// 	try {
	// 		const r = await swicCall('enablePush')
	// 		if (!r) {
	// 			log(`Failed to enable push subscription`)
	// 			return
	// 		}

	// 		log(`enabled!`)
	// 	} catch (e) {
	// 		log(`Error: ${e}`)
	// 	}
	// }

	// subscribe to updates from the service worker
	swicOnRender(() => {
		console.log('render')
		setRender((r) => r + 1)
	})

	return <AppRoutes />

	// return (
	// 	<div>
	// 		<div>
	// 			<h4>Connected apps:</h4>
	// 			{apps.map((a) => (
	// 				<div key={a.npub} style={{ marginTop: '10px' }}>
	// 					<div>
	// 						{a.npub} =&gt; {a.appNpub}
	// 						<button onClick={() => deleteApp(a.appNpub)}>
	// 							x
	// 						</button>
	// 					</div>
	// 					<h5>Perms:</h5>
	// 					{perms
	// 						.filter((p) => p.appNpub === a.appNpub)
	// 						.map((p) => (
	// 							<div key={p.id}>
	// 								{p.perm}: {p.value}
	// 								<button onClick={() => deletePerm(p.id)}>
	// 									x
	// 								</button>
	// 							</div>
	// 						))}
	// 					<hr />
	// 				</div>
	// 			))}

	// 			<div>
	// 				<button onClick={enableNotifications}>
	// 					enable background signing
	// 				</button>
	// 			</div>
	// 			<div>
	// 				<textarea id='log'></textarea>
	// 			</div>
	// 		</div>
	// 	</div>
	// )
}

export default App
