import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'
import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { swicCall } from '@/modules/swic'
import { Modal } from '@/shared/Modal/Modal'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { IconButton, Stack, Typography } from '@mui/material'
import React, { ChangeEvent, useState } from 'react'
import { StyledAppLogo } from './styled'
import { nip19 } from 'nostr-tools'
import { Input } from '@/shared/Input/Input'
import { Button } from '@/shared/Button/Button'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'

export const ModalLogin = () => {
	const { getModalOpened, handleClose } = useModalSearchParams()
	const isModalOpened = getModalOpened(MODAL_PARAMS_KEYS.LOGIN)
	const handleCloseModal = handleClose(MODAL_PARAMS_KEYS.LOGIN)

	const notify = useEnqueueSnackbar()

	const [enteredUsername, setEnteredUsername] = useState('')
	const [enteredPassword, setEnteredPassword] = useState('')
	const [isPasswordShown, setIsPasswordShown] = useState(false)

	const handleUsernameChange = (e: ChangeEvent<HTMLInputElement>) => {
		setEnteredUsername(e.target.value)
	}

	const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
		setEnteredPassword(e.target.value)
	}

	const handlePasswordTypeChange = () =>
		setIsPasswordShown((prevState) => !prevState)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		try {
			const user = enteredUsername.split('@')[0]
			const response = await fetch(
				'https://domain.com/.well-known/nostr.json?name=' + user,
			)
			const getNpub: {
				names: {
					[name: string]: string
				}
			} = await response.json()

			const pubkey = getNpub.names[user]
			const npub = nip19.npubEncode(pubkey)
			const passphrase = enteredPassword
			console.log('fetch', npub, passphrase)

			const k: any = await swicCall('fetchKey', npub, passphrase)
			notify(`Fetched ${k.npub}`, 'success')
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
						Login
					</Typography>
				</Stack>
				<Input
					label='Enter a Username'
					fullWidth
					placeholder='user@nsec.app'
					onChange={handleUsernameChange}
					value={enteredUsername}
				/>
				<Input
					label='Password'
					fullWidth
					placeholder='Your password'
					onChange={handlePasswordChange}
					value={enteredPassword}
					endAdornment={
						<IconButton
							size='small'
							onClick={handlePasswordTypeChange}
						>
							{isPasswordShown ? (
								<VisibilityOffOutlinedIcon />
							) : (
								<VisibilityOutlinedIcon />
							)}
						</IconButton>
					}
					type={isPasswordShown ? 'password' : 'text'}
				/>
				<Button type='submit' fullWidth>
					Login
				</Button>
			</Stack>
		</Modal>
	)
}
