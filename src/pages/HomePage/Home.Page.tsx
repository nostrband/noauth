import { useRef } from 'react'
import { useAppSelector } from '../../store/hooks/redux'
import { selectKeys } from '../../store'
import { ItemKey } from './components/ItemKey'
import { Stack } from '@mui/material'
import { call } from '../../utils/helpers'
import { swicCall } from '../../modules/swic'
import { SectionTitle } from '../../shared/SectionTitle/SectionTitle'
import { useEnqueueSnackbar } from '../../hooks/useEnqueueSnackbar'

const HomePage = () => {
	const keys = useAppSelector(selectKeys)
	const notify = useEnqueueSnackbar()

	const nsecInputRef = useRef<HTMLInputElement | null>(null)

	// eslint-disable-next-line
	async function importKey() {
		call(async () => {
			const nsec = nsecInputRef.current?.value
			if (!nsec) return
			await swicCall('importKey', nsec)
			notify('Key imported!', 'success')
		})
	}

	// eslint-disable-next-line
	async function generateKey() {
		call(async () => {
			const k: any = await swicCall('generateKey')
			notify(`New key ${k.npub}`, 'success')
		})
	}

	return (
		<Stack>
			{/* <Box alignSelf={'center'} marginBottom={'1rem'}>
				<Button size='small' variant='contained' onClick={generateKey}>
					add key
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
			</Stack> */}

			<SectionTitle>Keys:</SectionTitle>
			<Stack gap={'0.5rem'}>
				{keys.map((key) => (
					<ItemKey {...key} key={key.npub} />
				))}
			</Stack>
		</Stack>
	)
}

export default HomePage
