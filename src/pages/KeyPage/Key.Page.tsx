import { useCallback, useEffect, useRef, useState } from 'react'
import { SectionTitle } from '../../shared/SectionTitle/SectionTitle'
import { useAppSelector } from '../../store/hooks/redux'
import { askNotificationPermission, getShortenNpub } from '../../utils/helpers'
import { useParams } from 'react-router-dom'
import { fetchProfile } from '../../modules/nostr'
import { nip19 } from 'nostr-tools'
import { Badge, Box, CircularProgress, Stack } from '@mui/material'
import { StyledIconButton } from './styled'
import { SettingsIcon, ShareIcon } from '@/assets'
import { AppLink } from '@/shared/AppLink/AppLink'
import { MetaEvent } from '@/types/meta-event'
import { Apps } from './components/Apps'
import { ModalConnectApp } from '@/components/Modal/ModalConnectApp/ModalConnectApp'
import { StyledInput } from './components/styled'
import { InputCopyButton } from '@/shared/InputCopyButton/InputCopyButton'
import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { EXPLANATION_MODAL_KEYS, MODAL_PARAMS_KEYS } from '@/types/modal'
import { ModalSettings } from '@/components/Modal/ModalSettings/ModalSettings'
import { ModalExplanation } from '@/components/Modal/ModalExplanation/ModalExplanation'
import { Warning } from '@/components/Warning/Warning'
import GppMaybeIcon from '@mui/icons-material/GppMaybe'
import { swicCall, swr } from '@/modules/swic'
import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'
import { ModalConfirmConnect } from '@/components/Modal/ModalConfirmConnect/ModalConfirmConnect'
import { ModalConfirmEvent } from '@/components/Modal/ModalConfirmEvent/ModalConfirmEvent'
import { DbPending } from '@/modules/db'

export type IPendingsByAppNpub = {
	[appNpub: string]: {
		pending: DbPending[]
		isConnected: boolean
	}
}

type IShownConfirmModals = {
	[reqId: string]: boolean
}

const KeyPage = () => {
	const { apps, pending, perms } = useAppSelector((state) => state.content)
	const { npub = '' } = useParams<{ npub: string }>()

	const { handleOpen, getModalOpened } = useModalSearchParams()
	const isConfirmConnectModalOpened = getModalOpened(
		MODAL_PARAMS_KEYS.CONFIRM_CONNECT,
	)
	const isConfirmEventModalOpened = getModalOpened(
		MODAL_PARAMS_KEYS.CONFIRM_EVENT,
	)

	const nofity = useEnqueueSnackbar()

	const [profile, setProfile] = useState<MetaEvent | null>(null)
	const userName = profile?.info?.name || getShortenNpub(npub)
	const userNameWithPrefix = userName + '@nsec.app'

	const [showWarning, setShowWarning] = useState(false)
	const [isLoading, setIsLoading] = useState(false)

	const filteredApps = apps.filter((a) => a.npub === npub)
	const filteredPendingReqs = pending.filter((p) => p.npub === npub)
	const filteredPerms = perms.filter((p) => p.npub === npub)

	const npubConnectPerms = filteredPerms.filter(
		(perm) => perm.perm === 'connect',
	)
	const excludeConnectPendings = filteredPendingReqs.filter(
		(pr) => pr.method !== 'connect',
	)
	const connectPendings = filteredPendingReqs.filter(
		(pr) => pr.method === 'connect',
	)

	const prepareEventPendings =
		excludeConnectPendings.reduce<IPendingsByAppNpub>((acc, current) => {
			const isConnected = npubConnectPerms.some(
				(cp) => cp.appNpub === current.appNpub,
			)
			if (!acc[current.appNpub]) {
				acc[current.appNpub] = {
					pending: [current],
					isConnected,
				}
				return acc
			}
			acc[current.appNpub].pending.push(current)
			acc[current.appNpub].isConnected = isConnected
			return acc
		}, {})

	const load = useCallback(async () => {
		try {
			const npubToken = npub.includes('#') ? npub.split('#')[0] : npub
			const { type, data: pubkey } = nip19.decode(npubToken)
			if (type !== 'npub') return undefined

			const response = await fetchProfile(pubkey)
			setProfile(response as any)
		} catch (e) {
			return undefined
		}
		// eslint-disable-next-line
	}, [])

	useEffect(() => {
		load()
	}, [load])

	const handleOpenExplanationModal = (type: EXPLANATION_MODAL_KEYS) => {
		handleOpen(MODAL_PARAMS_KEYS.EXPLANATION, {
			search: {
				type,
			},
		})
	}

	const handleOpenConnectAppModal = () =>
		handleOpen(MODAL_PARAMS_KEYS.CONNECT_APP)

	const handleOpenSettingsModal = () => handleOpen(MODAL_PARAMS_KEYS.SETTINGS)

	const checkBackgroundSigning = useCallback(async () => {
		if (swr) {
			const isBackgroundEnable = await swr.pushManager.getSubscription()
			if (!isBackgroundEnable) setShowWarning(true)
			else setShowWarning(false)
		}
	}, [])

	useEffect(() => {
		checkBackgroundSigning()
	}, [checkBackgroundSigning])

	const handleEnableBackground = async () => {
		try {
			setIsLoading(true)
			await askNotificationPermission()
			const r = await swicCall('enablePush')
			if (!r) return nofity(`Failed to enable push subscription`, 'error')
			nofity('Enabled!', 'success')
			checkBackgroundSigning()
			setIsLoading(false)
		} catch (e) {
			nofity(`Failed to enable push subscription`, 'error')
			setIsLoading(false)
		}
	}

	const shownConnectModals = useRef<IShownConfirmModals>({})

	const shownConfirmEventModals = useRef<IShownConfirmModals>({})

	useEffect(() => {
		return () => {
			shownConnectModals.current = {}
			shownConfirmEventModals.current = {}
		}
	}, [npub, pending.length])

	const handleOpenConfirmConnectModal = useCallback(() => {
		if (
			!filteredPendingReqs.length ||
			isConfirmEventModalOpened ||
			isConfirmConnectModalOpened
		)
			return undefined

		for (let i = 0; i < connectPendings.length; i++) {
			const req = connectPendings[i]
			if (shownConnectModals.current[req.id]) {
				continue
			}

			shownConnectModals.current[req.id] = true
			handleOpen(MODAL_PARAMS_KEYS.CONFIRM_CONNECT, {
				search: {
					appNpub: req.appNpub,
					reqId: req.id,
				},
			})
			break
		}
	}, [
		connectPendings,
		filteredPendingReqs.length,
		handleOpen,
		isConfirmEventModalOpened,
		isConfirmConnectModalOpened,
	])

	const handleOpenConfirmEventModal = useCallback(() => {
		if (!filteredPendingReqs.length || connectPendings.length)
			return undefined

		for (let i = 0; i < Object.keys(prepareEventPendings).length; i++) {
			const appNpub = Object.keys(prepareEventPendings)[i]

			if (
				shownConfirmEventModals.current[appNpub] ||
				!prepareEventPendings[appNpub].isConnected
			) {
				continue
			}

			shownConfirmEventModals.current[appNpub] = true
			handleOpen(MODAL_PARAMS_KEYS.CONFIRM_EVENT, {
				search: {
					appNpub,
				},
			})
			break
		}
	}, [
		connectPendings.length,
		filteredPendingReqs.length,
		handleOpen,
		prepareEventPendings,
	])

	useEffect(() => {
		handleOpenConfirmEventModal()
	}, [handleOpenConfirmEventModal])

	useEffect(() => {
		handleOpenConfirmConnectModal()
	}, [handleOpenConfirmConnectModal])

	const renderUserValueSection = (
		title: string,
		value: string,
		explanationType: EXPLANATION_MODAL_KEYS,
		copyValue: string,
	) => {
		return (
			<Box>
				<Stack
					direction={'row'}
					alignItems={'center'}
					justifyContent={'space-between'}
					marginBottom={'0.5rem'}
				>
					<SectionTitle>{title}</SectionTitle>
					<AppLink
						title='What is this?'
						onClick={() =>
							handleOpenExplanationModal(explanationType)
						}
					/>
				</Stack>
				<StyledInput
					value={value}
					readOnly
					endAdornment={<InputCopyButton value={copyValue} />}
				/>
			</Box>
		)
	}

	return (
		<>
			<Stack gap={'1rem'} height={'100%'}>
				{showWarning && (
					<Warning
						message={
							<Stack
								direction={'row'}
								alignItems={'center'}
								gap={'1rem'}
							>
								Please enable push notifications{' '}
								{isLoading ? (
									<CircularProgress size={'1.5rem'} />
								) : null}
							</Stack>
						}
						Icon={<GppMaybeIcon htmlColor='white' />}
						onClick={isLoading ? undefined : handleEnableBackground}
					/>
				)}
				{renderUserValueSection(
					'Your login',
					userNameWithPrefix,
					EXPLANATION_MODAL_KEYS.NPUB,
					npub + '@nsec.app',
				)}
				{renderUserValueSection(
					'Your NPUB',
					npub,
					EXPLANATION_MODAL_KEYS.NPUB,
					npub,
				)}

				<Stack direction={'row'} gap={'0.75rem'}>
					<StyledIconButton onClick={handleOpenConnectAppModal}>
						<ShareIcon />
						Connect app
					</StyledIconButton>
					<Badge sx={{ flex: 1 }} badgeContent={''} color='error'>
						<StyledIconButton
							bgcolor_variant='secondary'
							onClick={handleOpenSettingsModal}
						>
							<SettingsIcon />
							Settings
						</StyledIconButton>
					</Badge>
				</Stack>

				<Apps apps={filteredApps} npub={npub} />
			</Stack>
			<ModalConnectApp />
			<ModalSettings />
			<ModalExplanation />
			<ModalConfirmConnect />
			<ModalConfirmEvent confirmEventReqs={prepareEventPendings} />
		</>
	)
}

export default KeyPage
