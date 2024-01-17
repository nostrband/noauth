import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { Modal } from '@/shared/Modal/Modal'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { getShortenNpub } from '@/utils/helpers'
import { Avatar, Box, Stack, Typography } from '@mui/material'
import { useParams, useSearchParams } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks/redux'
import { selectAppsByNpub } from '@/store'
import { StyledButton, StyledToggleButtonsGroup } from './styled'
import { ActionToggleButton } from './сomponents/ActionToggleButton'
import { useState } from 'react'

enum ACTION_TYPE {
	BASIC = 'Basic',
	ADVANCED = 'Advanced',
	CUSTOM = 'Custom',
}

export const ModalConfirmConnect = () => {
	const { getModalOpened, handleClose } = useModalSearchParams()
	const isModalOpened = getModalOpened(MODAL_PARAMS_KEYS.CONFIRM_CONNECT)
	const handleCloseModal = handleClose(
		MODAL_PARAMS_KEYS.CONFIRM_CONNECT,
		(sp) => {
			sp.delete('appNpub')
		},
	)

	const [selectedActionType, setSelectedActionType] = useState<ACTION_TYPE>(
		ACTION_TYPE.BASIC,
	)

	const { npub = '' } = useParams<{ npub: string }>()
	const apps = useAppSelector((state) => selectAppsByNpub(state, npub))

	const [searchParams] = useSearchParams()

	const appNpub = searchParams.get('appNpub') || ''

	const triggerApp = apps.find((app) => app.appNpub === appNpub)

	const open = Boolean(apps.length && triggerApp && isModalOpened)

	const { name, icon = '' } = triggerApp || {}

	const appName = name || getShortenNpub(appNpub)

	const handleActionTypeChange = (_: any, value: ACTION_TYPE) => {
		setSelectedActionType(value)
	}

	return (
		<Modal open={open} onClose={handleCloseModal}>
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
						title='Basic'
						description='Use this for most apps'
						hasinfo
					/>
					<ActionToggleButton
						value={ACTION_TYPE.ADVANCED}
						title='Advanced'
						description='Use for trusted apps only'
						hasinfo
					/>
					<ActionToggleButton
						value={ACTION_TYPE.CUSTOM}
						title='Custom'
						description='Gives you full control'
					/>
				</StyledToggleButtonsGroup>
				<Stack direction={'row'} gap={'1rem'}>
					<StyledButton
						onClick={handleCloseModal}
						varianttype='secondary'
					>
						Cancel
					</StyledButton>
					<StyledButton fullWidth onClick={handleCloseModal}>
						Allow {selectedActionType} actions
					</StyledButton>
				</Stack>
			</Stack>
		</Modal>
	)
}
