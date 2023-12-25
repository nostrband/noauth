import { useRef } from 'react'
import { useAppSelector } from '../store/hooks/redux'
import { Navigate } from 'react-router-dom'
import { swicCall } from '../modules/swic'
import { Box, Button, Stack, TextField } from '@mui/material'
import { useEnqueueSnackbar } from '../hooks/useEnqueueSnackbar'

const WelcomePage = () => {
	const keys = useAppSelector((state) => state.content.keys)
	const notify = useEnqueueSnackbar()

	const isKeysExists = keys.length > 0

	const nsecInputRef = useRef<HTMLInputElement | null>(null)
	const npubInputRef = useRef<HTMLInputElement | null>(null)
	const passwordInputRef = useRef<HTMLInputElement | null>(null)

	if (isKeysExists) return <Navigate to={'/home'} />

	async function generateKey() {
		try {
			const k: any = await swicCall('generateKey')
			notify(`New key ${k.npub}`, 'success')
		} catch (error: any) {
			notify(error.message, 'error')
		}
	}

	async function importKey() {
		try {
			const nsec = nsecInputRef.current?.value
			if (!nsec) return
			await swicCall('importKey', nsec)
		} catch (error: any) {
			notify(error.message, 'error')
		}
	}

	async function fetchNewKey() {
		try {
			const npub = npubInputRef.current?.value
			const passphrase = passwordInputRef.current?.value
			console.log('fetch', npub, passphrase)
			const k: any = await swicCall('fetchKey', npub, passphrase)
			notify(`Fetched ${k.npub}`, 'success')
		} catch (error: any) {
			notify(error.message, 'error')
		}
	}

	return (
		<Stack gap={'1.5rem'}>
			<Box alignSelf={'center'}>
				<Button size='small' variant='contained' onClick={generateKey}>
					generate key
				</Button>
			</Box>

			<Stack alignItems={'center'} gap='0.5rem'>
				<TextField
					variant='outlined'
					ref={nsecInputRef}
					placeholder='Enter nsec...'
					fullWidth
					size='small'
				/>
				<Button size='small' variant='contained' onClick={importKey}>
					import key (DANGER!)
				</Button>
			</Stack>

			<Stack alignItems={'center'} gap='0.5rem'>
				<Stack width={'100%'} gap='0.5rem'>
					<TextField
						variant='outlined'
						ref={npubInputRef}
						placeholder='Enter npub...'
						fullWidth
						size='small'
					/>
					<TextField
						variant='outlined'
						ref={passwordInputRef}
						placeholder='Enter password'
						fullWidth
						size='small'
					/>
				</Stack>
				<Button size='small' variant='contained' onClick={fetchNewKey}>
					fetch key
				</Button>
			</Stack>
		</Stack>
	)
}

export default WelcomePage
