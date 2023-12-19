import { useEffect, useState } from 'react'
import { swicCall } from '../modules/swic'
import { SectionTitle } from '../shared/SectionTitle/SectionTitle'
import { useAppSelector } from '../store/hooks/redux'
import { call } from '../utils/helpers'
import { Link, useParams } from 'react-router-dom'
import { fetchProfile } from '../modules/nostr'
import { nip19 } from 'nostr-tools'
import { useEnqueueSnackbar } from '../hooks/useEnqueueSnackbar'
import { Box, Stack, Typography } from '@mui/material'

const KeyPage = () => {
	const { apps, perms, pending } = useAppSelector((state) => state.content)
	const { npub = '' } = useParams<{ npub: string }>()

	const filteredApps = apps.filter((a) => a.npub === npub)
	const filteredPerms = perms.filter((p) => p.npub === npub)
	const filteredPendingRequests = pending.filter((p) => p.npub === npub)

	const notify = useEnqueueSnackbar()

	const [profile, setProfile] = useState(null)

	useEffect(() => {
		const load = async () => {
			try {
				const npubToken = npub.includes('#') ? npub.split('#')[0] : npub
				const { type, data: pubkey } = nip19.decode(npubToken)
				if (type !== 'npub') return undefined

				const response = await fetchProfile(pubkey)
				console.log({ response, pubkey, npub, npubToken, profile })
				setProfile(response as any)
			} catch (e) {
				return undefined
			}
		}
		load()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	// eslint-disable-next-line
	async function deleteApp(appNpub: string) {
		call(async () => {
			await swicCall('deleteApp', appNpub)
			notify('App deleted!', 'success')
		})
	}

	async function deletePerm(id: string) {
		call(async () => {
			await swicCall('deletePerm', id)
			notify('Perm deleted!', 'success')
		})
	}

	async function confirmPending(
		id: string,
		allow: boolean,
		remember: boolean,
	) {
		call(async () => {
			await swicCall('confirm', id, allow, remember)
			console.log('confirmed', id, allow, remember)
		})
	}

	return (
		<Stack gap={'1rem'}>
			<Box>
				<SectionTitle>Connected apps:</SectionTitle>
				{!filteredApps.length && (
					<Typography textAlign={'center'}>
						No connected apps
					</Typography>
				)}
				{filteredApps.map((a) => (
					<div key={a.npub} style={{ marginTop: '10px' }}>
						<Typography
							component={Link}
							to={`/key/${npub}/app/${a.appNpub}`}
							noWrap
						>
							App: {a.appNpub}
							{/* <button onClick={() => deleteApp(a.appNpub)}>
								x
							</button> */}
						</Typography>
						<SectionTitle>Permissions:</SectionTitle>
						{!filteredPerms.filter((p) => p.appNpub === a.appNpub)
							.length && (
							<Typography textAlign={'center'}>
								No permissions
							</Typography>
						)}
						{filteredPerms
							.filter((p) => p.appNpub === a.appNpub)
							.map((p) => (
								<div key={p.id}>
									{p.perm}: {p.value}
									<button onClick={() => deletePerm(p.id)}>
										x
									</button>
								</div>
							))}
						<hr />
					</div>
				))}
			</Box>

			<Box>
				<SectionTitle>Pending requests:</SectionTitle>
				{!filteredPendingRequests.length && (
					<Typography textAlign={'center'}>
						No pending requests
					</Typography>
				)}
				{filteredPendingRequests.map((p) => (
					<div key={p.id}>
						<Typography
							component={Link}
							to={`/key/${npub}/${p.id}`}
							noWrap
						>
							Request details
						</Typography>
						APP: {p.appNpub} ({p.method})
						<button
							onClick={() => confirmPending(p.id, true, false)}
						>
							yes
						</button>
						<button
							onClick={() => confirmPending(p.id, false, false)}
						>
							no
						</button>
						<button
							onClick={() => confirmPending(p.id, true, true)}
						>
							yes all
						</button>
						<button
							onClick={() => confirmPending(p.id, false, true)}
						>
							no all
						</button>
					</div>
				))}
			</Box>
		</Stack>
	)
}

export default KeyPage
