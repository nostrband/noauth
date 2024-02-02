import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { Modal } from '@/shared/Modal/Modal'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { call, getShortenNpub, getSignReqKind } from '@/utils/helpers/helpers'
import {
	Avatar,
	Box,
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
import { FC, useEffect, useMemo, useState } from 'react'
import {
	StyledActionsListContainer,
	StyledButton,
	StyledToggleButtonsGroup,
} from './styled'
import { SectionTitle } from '@/shared/SectionTitle/SectionTitle'
import { swicCall } from '@/modules/swic'
import { Checkbox } from '@/shared/Checkbox/Checkbox'
import { DbPending } from '@/modules/db'
import { ACTIONS } from '@/utils/consts'
import { IPendingsByAppNpub } from '@/pages/KeyPage/hooks/useTriggerConfirmModal'

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
	confirmEventReqs: IPendingsByAppNpub
}

type PendingRequest = DbPending & { checked: boolean }

export const ModalConfirmEvent: FC<ModalConfirmEventProps> = ({
	confirmEventReqs,
}) => {
	const { getModalOpened, handleClose } = useModalSearchParams()
	const isModalOpened = getModalOpened(MODAL_PARAMS_KEYS.CONFIRM_EVENT)
	const [searchParams] = useSearchParams()

	const appNpub = searchParams.get('appNpub') || ''

	const { npub = '' } = useParams<{ npub: string }>()
	const apps = useAppSelector((state) => selectAppsByNpub(state, npub))

	const [selectedActionType, setSelectedActionType] = useState<ACTION_TYPE>(
		ACTION_TYPE.ALWAYS,
	)
	const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([])

	const currentAppPendingReqs = useMemo(
		() => confirmEventReqs[appNpub]?.pending || [],
		[confirmEventReqs, appNpub],
	)

	useEffect(() => {
		setPendingRequests(
			currentAppPendingReqs.map((pr) => ({ ...pr, checked: true })),
		)
	}, [currentAppPendingReqs])

	const triggerApp = apps.find((app) => app.appNpub === appNpub)
	const { name, icon = '' } = triggerApp || {}
	const appName = name || getShortenNpub(appNpub)

	const handleActionTypeChange = (_: any, value: ACTION_TYPE | null) => {
		if (!value) return undefined
		return setSelectedActionType(value)
	}

	const selectedPendingRequests = pendingRequests.filter((pr) => pr.checked)

	const handleCloseModal = handleClose(
		MODAL_PARAMS_KEYS.CONFIRM_EVENT,
		(sp) => {
			sp.delete('appNpub')
			sp.delete('reqId')
			selectedPendingRequests.forEach(
				async (req) => await swicCall('confirm', req.id, false, false),
			)
		},
	)

	const closeModalAfterRequest = handleClose(
		MODAL_PARAMS_KEYS.CONFIRM_EVENT,
		(sp) => {
			sp.delete('appNpub')
			sp.delete('reqId')
		},
	)

	async function confirmPending(allow: boolean) {
		selectedPendingRequests.forEach((req) => {
			call(async () => {
				const remember = selectedActionType !== ACTION_TYPE.ONCE
				await swicCall('confirm', req.id, allow, remember)
				console.log('confirmed', req.id, selectedActionType, allow)
			})
		})
		closeModalAfterRequest()
	}

	const handleChangeCheckbox = (reqId: string) => () => {
		const newPendingRequests = pendingRequests.map((req) => {
			if (req.id === reqId) return { ...req, checked: !req.checked }
			return req
		})
		setPendingRequests(newPendingRequests)
	}

	const getAction = (req: PendingRequest) => {
		const action = ACTIONS[req.method]
		if (req.method === 'sign_event') {
			const kind = getSignReqKind(req)
			if (kind !== undefined) return `${action} of kind ${kind}`
		}
		return action
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
						{pendingRequests.map((req) => {
							return (
								<ListItem key={req.id}>
									<ListItemIcon>
										<Checkbox
											checked={req.checked}
											onChange={handleChangeCheckbox(
												req.id,
											)}
										/>
									</ListItemIcon>
									<ListItemText>
										{getAction(req)}
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
					{/* <ActionToggleButton
						value={ACTION_TYPE.ALLOW_ALL}
						title='Allow All Advanced Actions'
						hasinfo
					/> */}
				</StyledToggleButtonsGroup>

				<Stack direction={'row'} gap={'1rem'}>
					<StyledButton
						onClick={() => confirmPending(false)}
						varianttype='secondary'
					>
						Disallow {ACTION_LABELS[selectedActionType]}
					</StyledButton>
					<StyledButton onClick={() => confirmPending(true)}>
						Allow {ACTION_LABELS[selectedActionType]}
					</StyledButton>
				</Stack>
			</Stack>
		</Modal>
	)
}
