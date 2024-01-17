import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { Modal } from '@/shared/Modal/Modal'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { getShortenNpub } from '@/utils/helpers'
import {
	Avatar,
	Box,
	Checkbox,
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
	Stack,
	Typography,
} from '@mui/material'
import { useParams, useSearchParams } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks/redux'
import { selectAppsByNpub } from '@/store'
import { ActionToggleButton } from './сomponents/ActionToggleButton'
import { FC, useState } from 'react'
import {
	StyledActionsListContainer,
	StyledButton,
	StyledToggleButtonsGroup,
} from './styled'
import { SectionTitle } from '@/shared/SectionTitle/SectionTitle'
import { DbPerm } from '@/modules/db'

enum ACTION_TYPE {
	ALWAYS = 'ALWAYS',
	ONCE = 'ONCE',
	ALLOW_ALL = 'ALLOW_ALL',
}

const ACTION_LABELS = {
	[ACTION_TYPE.ALWAYS]: 'Always',
	[ACTION_TYPE.ONCE]: 'Just Once',
	[ACTION_TYPE.ALLOW_ALL]: 'All Advanced Actions',
}

type ModalConfirmEventProps = {
	eventPerms: { [appNpub: string]: DbPerm[] }
}

export const ACTIONS: { [type: string]: string } = {
	get_public_key: 'Get public key',
	sign_event: 'Sign event',
}

export const ModalConfirmEvent: FC<ModalConfirmEventProps> = ({
	eventPerms,
}) => {
	const { getModalOpened, handleClose } = useModalSearchParams()
	const isModalOpened = getModalOpened(MODAL_PARAMS_KEYS.CONFIRM_EVENT)
	const handleCloseModal = handleClose(
		MODAL_PARAMS_KEYS.CONFIRM_EVENT,
		(sp) => sp.delete('appNpub'),
	)

	const [selectedActionType, setSelectedActionType] = useState<ACTION_TYPE>(
		ACTION_TYPE.ALWAYS,
	)

	const { npub = '' } = useParams<{ npub: string }>()
	const apps = useAppSelector((state) => selectAppsByNpub(state, npub))

	const [searchParams] = useSearchParams()

	const appNpub = searchParams.get('appNpub') || ''
	const currentAppPerms = eventPerms[appNpub] || []

	const triggerApp = apps.find((app) => app.appNpub === appNpub)

	const open = Boolean(isModalOpened)

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
							borderRadius: '12px',
						}}
						src={icon}
					/>
					<Box>
						<Typography variant='h5' fontWeight={600}>
							{appName}
						</Typography>
						<Typography variant='body2' color={'GrayText'}>
							Would like your permission to
						</Typography>
					</Box>
				</Stack>

				<StyledActionsListContainer marginBottom={'1rem'}>
					<SectionTitle>Actions</SectionTitle>
					<List>
						{currentAppPerms.map((perm) => {
							return (
								<ListItem>
									<ListItemIcon>
										<Checkbox color='primary' />
									</ListItemIcon>
									<ListItemText>
										{ACTIONS[perm.perm]}
									</ListItemText>
								</ListItem>
							)
						})}
					</List>
				</StyledActionsListContainer>
				<StyledToggleButtonsGroup
					value={selectedActionType}
					onChange={handleActionTypeChange}
					exclusive
				>
					<ActionToggleButton
						value={ACTION_TYPE.ALWAYS}
						title='Always'
					/>
					<ActionToggleButton
						value={ACTION_TYPE.ONCE}
						title='Just once'
					/>
					<ActionToggleButton
						value={ACTION_TYPE.ALLOW_ALL}
						title='Allow All Advanced Actions'
						hasinfo
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
						Allow {ACTION_LABELS[selectedActionType]}
					</StyledButton>
				</Stack>
			</Stack>
		</Modal>
	)
}
