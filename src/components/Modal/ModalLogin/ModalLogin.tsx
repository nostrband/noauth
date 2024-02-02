import React, { useCallback, useEffect, useState } from 'react'
import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'
import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { swicCall } from '@/modules/swic'
import { Modal } from '@/shared/Modal/Modal'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { IconButton, Stack, Typography } from '@mui/material'
import { StyledAppLogo } from './styled'
import { nip19 } from 'nostr-tools'
import { Input } from '@/shared/Input/Input'
import { Button } from '@/shared/Button/Button'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { FormInputType, schema } from './const'
import { yupResolver } from '@hookform/resolvers/yup'

export const ModalLogin = () => {
	const { getModalOpened, handleClose } = useModalSearchParams()
	const isModalOpened = getModalOpened(MODAL_PARAMS_KEYS.LOGIN)
	const handleCloseModal = handleClose(MODAL_PARAMS_KEYS.LOGIN)

	const notify = useEnqueueSnackbar()

	const navigate = useNavigate()

	const {
		handleSubmit,
		reset,
		register,
		formState: { errors },
	} = useForm<FormInputType>({
		defaultValues: {
			username: '',
			password: '',
		},
		resolver: yupResolver(schema),
		mode: 'onSubmit',
	})

	const [isPasswordShown, setIsPasswordShown] = useState(false)

	const handlePasswordTypeChange = () =>
		setIsPasswordShown((prevState) => !prevState)

	const cleanUpStates = useCallback(() => {
		setIsPasswordShown(false)
		reset()
	}, [reset])

	const submitHandler = async (values: FormInputType) => {
		try {
			const [username, domain] = values.username.split('@')
			const response = await fetch(
				`https://${domain}/.well-known/nostr.json?name=${username}`,
			)
			const getNpub: {
				names: {
					[name: string]: string
				}
			} = await response.json()

			const pubkey = getNpub.names[username]
			const npub = nip19.npubEncode(pubkey)
			const passphrase = values.password

			console.log('fetch', npub, passphrase)
			const k: any = await swicCall('fetchKey', npub, passphrase)
			notify(`Fetched ${k.npub}`, 'success')
			cleanUpStates()
			navigate(`/key/${k.npub}`)
		} catch (error: any) {
			notify(error?.message || 'Something went wrong!', 'error')
		}
	}

	useEffect(() => {
		return () => {
			if (isModalOpened) {
				// modal closed
				cleanUpStates()
			}
		}
	}, [isModalOpened, cleanUpStates])

	return (
		<Modal open={isModalOpened} onClose={handleCloseModal}>
			<Stack
				gap={'1rem'}
				component={'form'}
				onSubmit={handleSubmit(submitHandler)}
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
					{...register('username')}
					error={!!errors.username}
				/>
				<Input
					label='Password'
					fullWidth
					placeholder='Your password'
					{...register('password')}
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
					type={isPasswordShown ? 'text' : 'password'}
					error={!!errors.password}
				/>
				<Button type='submit' fullWidth>
					Login
				</Button>
			</Stack>
		</Modal>
	)
}
