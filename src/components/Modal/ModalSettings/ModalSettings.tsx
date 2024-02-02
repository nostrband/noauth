import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { Button } from '@/shared/Button/Button'
import { Modal } from '@/shared/Modal/Modal'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import {
	Box,
	CircularProgress,
	IconButton,
	Stack,
	Typography,
} from '@mui/material'
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
import { ChangeEvent, FC, useEffect, useState } from 'react'
import { Checkbox } from '@/shared/Checkbox/Checkbox'
import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'
import { swicCall } from '@/modules/swic'
import { useParams } from 'react-router-dom'
import { dbi } from '@/modules/db'

type ModalSettingsProps = {
	isSynced: boolean
}

export const ModalSettings: FC<ModalSettingsProps> = ({ isSynced }) => {
	const { getModalOpened, handleClose } = useModalSearchParams()
	const { npub = '' } = useParams<{ npub: string }>()

	const notify = useEnqueueSnackbar()

	const isModalOpened = getModalOpened(MODAL_PARAMS_KEYS.SETTINGS)
	const handleCloseModal = handleClose(MODAL_PARAMS_KEYS.SETTINGS)

	const [enteredPassword, setEnteredPassword] = useState('')
	const [isPasswordShown, setIsPasswordShown] = useState(false)
	const [isPasswordInvalid, setIsPasswordInvalid] = useState(false)

	const [isChecked, setIsChecked] = useState(false)

	const [isLoading, setIsLoading] = useState(false)


	useEffect(() => setIsChecked(isSynced), [isModalOpened])

	const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
		setIsPasswordInvalid(false)
		setEnteredPassword(e.target.value)
	}

	const handlePasswordTypeChange = () =>
		setIsPasswordShown((prevState) => !prevState)

	const onClose = () => {
		handleCloseModal()
		setEnteredPassword('')
		setIsPasswordInvalid(false)
	}

	const handleChangeCheckbox = (e: unknown, checked: boolean) => {
		setIsChecked(checked)
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setIsPasswordInvalid(false)

		if (enteredPassword.trim().length < 6) {
			return setIsPasswordInvalid(true)
		}
		try {
			setIsLoading(true)
			await swicCall('saveKey', npub, enteredPassword)
			notify('Key saved', 'success')
			dbi.addSynced(npub) // Sync npub
			setEnteredPassword('')
			setIsPasswordInvalid(false)
			setIsLoading(false)
		} catch (error) {
			setIsPasswordInvalid(false)
			setIsLoading(false)
		}
	}

	return (
		<Modal open={isModalOpened} onClose={onClose} title='Settings'>
			<Stack gap={'1rem'}>
				<StyledSettingContainer onSubmit={handleSubmit}>
					<Stack direction={'row'} justifyContent={'space-between'}>
						<SectionTitle>Cloud sync</SectionTitle>
						{isSynced && (
							<StyledSynchedText>
								<CheckmarkIcon /> Synched
							</StyledSynchedText>
						)}
					</Stack>
					<Box>
						<Checkbox
							onChange={handleChangeCheckbox}
							checked={isChecked}
						/>
						<Typography variant='caption'>
							Use this key on multiple devices
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
						type={isPasswordShown ? 'text' : 'password'}
						onChange={handlePasswordChange}
						value={enteredPassword}
						helperText={
							isPasswordInvalid ? 'Invalid password' : ''
						}
						placeholder='Enter a password'
						helperTextProps={{
							sx: {
								'&.helper_text': {
									color: 'red',
								},
							},
						}}
						disabled={!isChecked}
					/>
					{isSynced ? (
						<Typography variant='body2' color={'GrayText'}>
							To change your password, type a new one and sync.
						</Typography>
					) : (
						<Typography variant='body2' color={'GrayText'}>
							This key will be encrypted and stored on our server. You can use the password to download this key onto another device.
						</Typography>
					)}
					<StyledButton
						type='submit'
						fullWidth
						disabled={!isChecked}
					>
						Sync{' '}
						{isLoading && (
							<CircularProgress
								sx={{ marginLeft: '0.5rem' }}
								size={'1rem'}
							/>
						)}
					</StyledButton>
				</StyledSettingContainer>
				<Button onClick={onClose}>Done</Button>
			</Stack>
		</Modal>
	)
}
