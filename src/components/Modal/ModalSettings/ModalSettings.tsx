import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { Button } from '@/shared/Button/Button'
import { Modal } from '@/shared/Modal/Modal'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { Box, IconButton, Stack, Typography } from '@mui/material'
import {
	StyledButton,
	StyledSettingContainer,
	StyledSynchedText,
} from './styled'
import { SectionTitle } from '@/shared/SectionTitle/SectionTitle'
import { CheckmarkIcon } from '@/assets'
import { Input } from '@/shared/Input/Input'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { ChangeEvent, useState } from 'react'
import { Checkbox } from '@/shared/Checkbox/Checkbox'

export const ModalSettings = () => {
	const { getModalOpened, handleClose } = useModalSearchParams()

	const isModalOpened = getModalOpened(MODAL_PARAMS_KEYS.SETTINGS)
	const handleCloseModal = handleClose(MODAL_PARAMS_KEYS.SETTINGS)

	const [enteredPassword, setEnteredPassword] = useState('')
	const [isPasswordShown, setIsPasswordShown] = useState(false)
	const [isPasswordInvalid, setIsPasswordInvalid] = useState(false)
	const [isPasswordSynched, setIsPasswordSynched] = useState(false)

	const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
		setEnteredPassword(e.target.value)
	}

	const handlePasswordTypeChange = () =>
		setIsPasswordShown((prevState) => !prevState)

	const handleSync = () => {
		setIsPasswordInvalid(false)

		if (enteredPassword.trim().length < 6) {
			return setIsPasswordInvalid(true)
		}
		setIsPasswordSynched(true)
	}

	const onClose = () => {
		handleCloseModal()
		setEnteredPassword('')
		setIsPasswordInvalid(false)
		setIsPasswordSynched(false)
	}

	return (
		<Modal open={isModalOpened} onClose={onClose} title='Settings'>
			<Stack gap={'1rem'}>
				<StyledSettingContainer>
					<Stack direction={'row'} justifyContent={'space-between'}>
						<SectionTitle>Cloud sync</SectionTitle>
						{isPasswordSynched && (
							<StyledSynchedText>
								<CheckmarkIcon /> Synched
							</StyledSynchedText>
						)}
					</Stack>
					<Box>
						<Checkbox />
						<Typography variant='caption'>
							Use this login on multiple devices
						</Typography>
					</Box>
					<Input
						fullWidth
						endAdornment={
							<IconButton
								size='small'
								onClick={handlePasswordTypeChange}
							>
								{isPasswordShown ? (
									<VisibilityOffOutlinedIcon htmlColor='#6b6b6b' />
								) : (
									<VisibilityOutlinedIcon htmlColor='#6b6b6b' />
								)}
							</IconButton>
						}
						type={isPasswordShown ? 'password' : 'text'}
						onChange={handlePasswordChange}
						value={enteredPassword}
						helperText={isPasswordInvalid ? 'Invalid password' : ''}
						helperTextProps={{
							sx: {
								'&.helper_text': {
									color: 'red',
								},
							},
						}}
					/>
					<StyledButton type='button' fullWidth onClick={handleSync}>
						Sync
					</StyledButton>
				</StyledSettingContainer>
				<Button onClick={onClose}>Done</Button>
			</Stack>
		</Modal>
	)
}
