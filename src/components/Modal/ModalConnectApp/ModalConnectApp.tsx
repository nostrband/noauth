import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'
import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { AppLink } from '@/shared/AppLink/AppLink'
import { Button } from '@/shared/Button/Button'
import { Input } from '@/shared/Input/Input'
import { InputCopyButton } from '@/shared/InputCopyButton/InputCopyButton'
import { Modal } from '@/shared/Modal/Modal'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { getBunkerLink } from '@/utils/helpers'
import { Stack, Typography } from '@mui/material'
import { useParams } from 'react-router-dom'

export const ModalConnectApp = () => {
	const { getModalOpened, handleClose, handleOpen } = useModalSearchParams()
	const isModalOpened = getModalOpened(MODAL_PARAMS_KEYS.CONNECT_APP)
	const handleCloseModal = handleClose(MODAL_PARAMS_KEYS.CONNECT_APP)

	const notify = useEnqueueSnackbar()

	const { npub = '' } = useParams<{ npub: string }>()

	const bunkerStr = getBunkerLink(npub)

	const handleShareBunker = async () => {
		const shareData = {
			text: bunkerStr,
		}
		try {
			if (navigator.share && navigator.canShare(shareData)) {
				await navigator.share(shareData)
			} else {
				navigator.clipboard.writeText(bunkerStr)
			}
		} catch (err) {
			console.log(err)
			notify('Your browser does not support sharing data', 'warning')
		}
	}

	return (
		<Modal
			open={isModalOpened}
			title='Share your profile'
			onClose={handleCloseModal}
		>
			<Stack gap={'1rem'} alignItems={'center'}>
				<Typography variant='caption'>
					Please, copy this code and paste it into the app to log in
				</Typography>
				<Input
					sx={{
						gap: '0.5rem',
					}}
					fullWidth
					value={bunkerStr}
					endAdornment={<InputCopyButton value={bunkerStr} />}
				/>
				<AppLink
					title='What is this?'
					onClick={() => handleOpen(MODAL_PARAMS_KEYS.EXPLANATION)}
				/>
				<Button fullWidth onClick={handleShareBunker}>
					Share it
				</Button>
				<Button fullWidth onClick={handleCloseModal}>
					Done
				</Button>
			</Stack>
		</Modal>
	)
}
