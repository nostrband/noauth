import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'
import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { swicCall } from '@/modules/swic'
import { Button } from '@/shared/Button/Button'
import { Input } from '@/shared/Input/Input'
import { Modal } from '@/shared/Modal/Modal'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { Stack, Typography } from '@mui/material'
import React, { ChangeEvent, FormEvent, useState } from 'react'
import { StyledAppLogo } from './styled'

export const ModalImportKeys = () => {
	const { getModalOpened, handleClose } = useModalSearchParams()
	const isModalOpened = getModalOpened(MODAL_PARAMS_KEYS.IMPORT_KEYS)
	const handleCloseModal = handleClose(MODAL_PARAMS_KEYS.IMPORT_KEYS)

	const notify = useEnqueueSnackbar()

	const [enteredNsec, setEnteredNsec] = useState('')

	const handleNsecChange = (e: ChangeEvent<HTMLInputElement>) => {
		setEnteredNsec(e.target.value)
	}

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault()
		try {
			if (!enteredNsec.trim().length) return
			await swicCall('importKey', enteredNsec)
			notify('Key imported!', 'success')
			handleCloseModal()
		} catch (error: any) {
			notify(error.message, 'error')
		}
	}

	return (
		<Modal open={isModalOpened} onClose={handleCloseModal}>
			<Stack
				paddingTop={'1rem'}
				gap={'1rem'}
				component={'form'}
				onSubmit={handleSubmit}
			>
				<Stack
					direction={'row'}
					gap={'1rem'}
					alignItems={'center'}
					alignSelf={'flex-start'}
				>
					<StyledAppLogo />
					<Typography fontWeight={600} variant='h5'>
						Import keys
					</Typography>
				</Stack>
				<Input
					label='Enter a NSEC'
					placeholder='Your NSEC'
					value={enteredNsec}
					onChange={handleNsecChange}
					fullWidth
				/>
				<Button>Import nsec</Button>
			</Stack>
		</Modal>
	)
}
