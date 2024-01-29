import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { Modal } from '@/shared/Modal/Modal'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { call, getShortenNpub } from '@/utils/helpers'
import { Avatar, Box, Stack, Typography } from '@mui/material'
import { useParams, useSearchParams } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks/redux'
import { selectAppsByNpub } from '@/store'
import { StyledButton, StyledToggleButtonsGroup } from './styled'
import { ActionToggleButton } from './сomponents/ActionToggleButton'
import { useState } from 'react'
import { swicCall } from '@/modules/swic'
import { ACTION_TYPE } from '@/utils/consts'


export const ModalConfirmConnect = () => {
	const { getModalOpened, handleClose } = useModalSearchParams()
	const isModalOpened = getModalOpened(MODAL_PARAMS_KEYS.CONFIRM_CONNECT)

	const { npub = '' } = useParams<{ npub: string }>()
	const apps = useAppSelector((state) => selectAppsByNpub(state, npub))

	const [selectedActionType, setSelectedActionType] = useState<ACTION_TYPE>(
		ACTION_TYPE.BASIC,
	)

	const [searchParams] = useSearchParams()
	const appNpub = searchParams.get('appNpub') || ''
	const pendingReqId = searchParams.get('reqId') || ''

	const triggerApp = apps.find((app) => app.appNpub === appNpub)
	const { name, icon = '' } = triggerApp || {}
	const appName = name || getShortenNpub(appNpub)

	const handleActionTypeChange = (_: any, value: ACTION_TYPE | null) => {
		if (!value) return undefined
		return setSelectedActionType(value)
	}

	const handleCloseModal = handleClose(
		MODAL_PARAMS_KEYS.CONFIRM_CONNECT,
		async (sp) => {
			sp.delete('appNpub')
			sp.delete('reqId')
			await swicCall('confirm', pendingReqId, false, false)
		},
	)
	const closeModalAfterRequest = handleClose(
		MODAL_PARAMS_KEYS.CONFIRM_CONNECT,
		(sp) => {
			sp.delete('appNpub')
			sp.delete('reqId')
		},
	)

	async function confirmPending(
		id: string,
		allow: boolean,
		remember: boolean,
		options?: any
	) {
		call(async () => {
			await swicCall('confirm', id, allow, remember, options)
			console.log('confirmed', id, allow, remember, options)
			closeModalAfterRequest()
		})
	}

	const allow = () => {
		const options: any = {};
		if (selectedActionType === ACTION_TYPE.BASIC)
			options.perm = ACTION_TYPE.BASIC;
		confirmPending(pendingReqId, true, true, options)
	}

	return (
		<Modal open={isModalOpened} onClose={handleCloseModal}>
			<Stack gap={'1rem'} paddingTop={'1rem'}>
				<Stack
					direction={'row'}
					gap={'1rem'}
					alignItems={'center'}
					marginBottom={'1rem'}
				>
					<Avatar
						variant='square'
						sx={{
							width: 56,
							height: 56,
						}}
						src={icon}
					/>
					<Box>
						<Typography variant='h5' fontWeight={600}>
							{appName}
						</Typography>
						<Typography variant='body2' color={'GrayText'}>
							Would like to connect to your account
						</Typography>
					</Box>
				</Stack>
				<StyledToggleButtonsGroup
					value={selectedActionType}
					onChange={handleActionTypeChange}
					exclusive
				>
					<ActionToggleButton
						value={ACTION_TYPE.BASIC}
						title='Basic permissions'
						description='Read your public key, sign notes and reactions'
						// hasinfo
					/>
					{/* <ActionToggleButton
						value={ACTION_TYPE.ADVANCED}
						title='Advanced'
						description='Use for trusted apps only'
						hasinfo
					/> */}
					<ActionToggleButton
						value={ACTION_TYPE.CUSTOM}
						title='On demand'
						description='Assign permissions when the app asks for them'
					/>
				</StyledToggleButtonsGroup>
				<Stack direction={'row'} gap={'1rem'}>
					<StyledButton
						onClick={() => confirmPending(pendingReqId, false, true)}
						varianttype='secondary'
					>
						Disallow
					</StyledButton>
					<StyledButton
						fullWidth
						onClick={allow}
					>
						{/* Allow {selectedActionType} actions */}
						Connect
					</StyledButton>
				</Stack>
			</Stack>
		</Modal>
	)
}
