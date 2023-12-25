import { useCallback, useEffect, useState } from 'react'
import { SectionTitle } from '../../shared/SectionTitle/SectionTitle'
import { useAppSelector } from '../../store/hooks/redux'
import {
	askNotificationPermission,
	getDefaultUserName,
} from '../../utils/helpers'
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

const KeyPage = () => {
	const { apps, perms } = useAppSelector((state) => state.content)
	const { npub = '' } = useParams<{ npub: string }>()
	const { handleOpen } = useModalSearchParams()
	const nofity = useEnqueueSnackbar()

	const filteredApps = apps.filter((a) => a.npub === npub)
	const filteredPerms = perms.filter((p) => p.npub === npub)

	const [profile, setProfile] = useState<MetaEvent | null>(null)
	const [showWarning, setShowWarning] = useState(false)

	const userName = profile?.info?.name || getDefaultUserName(npub)
	const userNameWithPrefix = userName + '@nsec.app'

	const load = useCallback(async () => {
		try {
			const npubToken = npub.includes('#') ? npub.split('#')[0] : npub
			const { type, data: pubkey } = nip19.decode(npubToken)
			if (type !== 'npub') return undefined

			const response = await fetchProfile(pubkey)
			console.log({ response, pubkey, npub, npubToken, profile })
			setProfile(response as any)
		} catch (e) {
			return undefined
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
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

	const handleOpenConnectAppModal = () =>
		handleOpen(MODAL_PARAMS_KEYS.CONNECT_APP)

	const handleOpenSettingsModal = () => handleOpen(MODAL_PARAMS_KEYS.SETTINGS)

	useEffect(() => {
		const checkBackgroundSigning = async () => {
			if (swr) {
				const isBackgroundEnable = await swr.pushManager.getSubscription()
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

	return (
		<>
			<Stack gap={'1rem'}>
				{showWarning && (
					<Warning
						message='Please enable push notifications'
						Icon={<GppMaybeIcon />}
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
		</>
	)
}

export default KeyPage
