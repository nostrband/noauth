import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'
import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { Modal } from '@/shared/Modal/Modal'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { Stack, Typography, useTheme } from '@mui/material'
import React, { ChangeEvent, useState } from 'react'
import { StyledAppLogo } from './styled'
import { Input } from '@/shared/Input/Input'
import { Button } from '@/shared/Button/Button'
import { CheckmarkIcon } from '@/assets'
import { swicCall } from '@/modules/swic'
import { useNavigate } from 'react-router-dom'

export const ModalSignUp = () => {
	const { getModalOpened, handleClose } = useModalSearchParams()
	const isModalOpened = getModalOpened(MODAL_PARAMS_KEYS.SIGN_UP)
	const handleCloseModal = handleClose(MODAL_PARAMS_KEYS.SIGN_UP)
	const notify = useEnqueueSnackbar()
	const theme = useTheme()

	const navigate = useNavigate()

	const [enteredValue, setEnteredValue] = useState('')

	const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
		setEnteredValue(e.target.value)
	}

	const isAvailable = enteredValue.trim().length > 2

	const inputHelperText = isAvailable ? (
		<>
			<CheckmarkIcon /> Available
		</>
	) : (
		"Don't worry, username can be changed later."
	)

	const handleSubmit = async (e: React.FormEvent) => {
		if (!enteredValue.trim().length) return
		e.preventDefault()
		try {
			const k: any = await swicCall('generateKey')
			notify(`New key ${k.npub}`, 'success')
			navigate(`/key/${k.npub}`)
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
						Sign up
					</Typography>
				</Stack>
				<Input
					label='Enter a Username'
					fullWidth
					placeholder='Username'
					helperText={inputHelperText}
					endAdornment={
						<Typography color={'#FFFFFFA8'}>@nsec.app</Typography>
					}
					onChange={handleInputChange}
					value={enteredValue}
					helperTextProps={{
						sx: {
							'&.helper_text': {
								color: isAvailable
									? theme.palette.success.main
									: theme.palette.textSecondaryDecorate.main,
							},
						},
					}}
				/>
				<Button fullWidth type='submit'>
					Sign up
				</Button>
			</Stack>
		</Modal>
	)
}
