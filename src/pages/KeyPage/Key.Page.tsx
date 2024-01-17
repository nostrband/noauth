import { useCallback, useEffect, useRef, useState } from 'react'
import { SectionTitle } from '../../shared/SectionTitle/SectionTitle'
import { useAppSelector } from '../../store/hooks/redux'
import { askNotificationPermission, getShortenNpub } from '../../utils/helpers'
import { useParams } from 'react-router-dom'
import { fetchProfile } from '../../modules/nostr'
import { nip19 } from 'nostr-tools'
import { Badge, Box, Stack } from '@mui/material'
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
import { DbPerm } from '@/modules/db'

const KeyPage = () => {
	const { apps, perms } = useAppSelector((state) => state.content)
	const { npub = '' } = useParams<{ npub: string }>()
	const { handleOpen, getModalOpened } = useModalSearchParams()
	const isConfirmConnectModalOpened = getModalOpened(
		MODAL_PARAMS_KEYS.CONFIRM_CONNECT,
	)
	const isConfirmEventModalOpened = getModalOpened(
		MODAL_PARAMS_KEYS.CONFIRM_EVENT,
	)

	const nofity = useEnqueueSnackbar()

	const filteredApps = apps.filter((a) => a.npub === npub)
	const filteredPerms = perms.filter((p) => p.npub === npub)
	const excludeConnectPerms = filteredPerms.filter(
		(perm) => perm.perm !== 'connect',
	)
	const prepareEventPerms = excludeConnectPerms.reduce<{
		[appNpub: string]: DbPerm[]
	}>((acc: { [appNpub: string]: DbPerm[] }, current: DbPerm) => {
		if (!acc[current.appNpub]) {
			acc[current.appNpub] = []
		}
		acc[current.appNpub].push(current)
		return acc
	}, {})

	const [profile, setProfile] = useState<MetaEvent | null>(null)
	const [showWarning, setShowWarning] = useState(false)

	const userName = profile?.info?.name || getShortenNpub(npub)
	const userNameWithPrefix = userName + '@nsec.app'

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

	useEffect(() => {
		const checkBackgroundSigning = async () => {
			if (swr) {
				const isBackgroundEnable =
					await swr.pushManager.getSubscription()
				if (!isBackgroundEnable) {
					setShowWarning(true)
				} else {
					setShowWarning(false)
				}
			}
		}
		checkBackgroundSigning()
	}, [])

	const handleEnableBackground = async () => {
		await askNotificationPermission()
		try {
			const r = await swicCall('enablePush')
			if (!r) return nofity(`Failed to enable push subscription`, 'error')
			nofity('Enabled!', 'success')
		} catch (e) {
			nofity(`Failed to enable push subscription`, 'error')
		}
	}

	const shownConnectModals = useRef<{
		[permId: string]: boolean
	}>({})

	const shownConfirmEventModals = useRef<{
		[permId: string]: boolean
	}>({})

	useEffect(() => {
		return () => {
			shownConnectModals.current = {}
			shownConfirmEventModals.current = {}
		}
	}, [npub])

	const connectPerms = filteredPerms.filter((perm) => perm.perm === 'connect')

	const handleOpenConfirmConnectModal = useCallback(() => {
		if (!filteredPerms.length || isConfirmEventModalOpened) return undefined

		for (let i = 0; i < connectPerms.length; i++) {
			const perm = connectPerms[i]
			if (shownConnectModals.current[perm.id]) {
				continue
			}

			shownConnectModals.current[perm.id] = true
			handleOpen(MODAL_PARAMS_KEYS.CONFIRM_CONNECT, {
				search: {
					appNpub: perm.appNpub,
				},
			})
			break
		}
	}, [
		connectPerms,
		filteredPerms.length,
		handleOpen,
		isConfirmEventModalOpened,
	])

	useEffect(() => {
		if (!filteredPerms.length || connectPerms.length) return undefined

		for (let i = 0; i < Object.keys(prepareEventPerms).length; i++) {
			const appNpub = Object.keys(prepareEventPerms)[i]

			if (shownConfirmEventModals.current[appNpub]) {
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
		connectPerms.length,
		filteredPerms.length,
		handleOpen,
		isConfirmConnectModalOpened,
		prepareEventPerms,
	])

	useEffect(() => {
		handleOpenConfirmConnectModal()
	}, [handleOpenConfirmConnectModal])

	const renderUserValueSection = (
		title: string,
		value: string,
		explanationType: EXPLANATION_MODAL_KEYS,
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
					endAdornment={<InputCopyButton value={value} />}
				/>
			</Box>
		)
	}

	return (
		<>
			<Stack gap={'1rem'} height={'100%'}>
				{showWarning && (
					<Warning
						message='Please enable push notifications'
						Icon={<GppMaybeIcon htmlColor='white' />}
						onClick={handleEnableBackground}
					/>
				)}
				{renderUserValueSection(
					'Your login',
					userNameWithPrefix,
					EXPLANATION_MODAL_KEYS.NPUB,
				)}
				{renderUserValueSection(
					'Your NPUB',
					npub,
					EXPLANATION_MODAL_KEYS.NPUB,
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

				<Apps apps={filteredApps} perms={filteredPerms} npub={npub} />
			</Stack>
			<ModalConnectApp />
			<ModalSettings />
			<ModalExplanation />
			<ModalConfirmConnect />
			<ModalConfirmEvent eventPerms={prepareEventPerms} />
		</>
	)
}

export default KeyPage
